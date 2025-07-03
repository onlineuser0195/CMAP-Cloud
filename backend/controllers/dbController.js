import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import archiver from 'archiver';
import unzipper from 'unzipper';
// import { EJSON } from 'bson';

const __dirname = path.resolve();

const { ObjectId } = mongoose.Types;

function reviveObjectIds(obj) {
  if (Array.isArray(obj)) {
    return obj.map(reviveObjectIds);
  } else if (obj && typeof obj === 'object') {
    if ('$oid' in obj && Object.keys(obj).length === 1) {
      return new ObjectId(obj.$oid);
    }
    for (const key in obj) {
      obj[key] = reviveObjectIds(obj[key]);
    }
  }
  return obj;
}

export const getCollections = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    res.json(collections.map(col => col.name));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
};

function prepareForExport(obj) {
  if (Array.isArray(obj)) {
    return obj.map(prepareForExport);
  } else if (obj && typeof obj === 'object') {
    if (obj instanceof ObjectId) {
      return { $oid: obj.toHexString() };
    }
    const newObj = {};
    for (const key in obj) {
      newObj[key] = prepareForExport(obj[key]);
    }
    return newObj;
  }
  return obj;
}


export const exportDB = async (req, res) => {
  try {
    const selectedCollections = req.body.collections || [];
    const db = mongoose.connection.db;
    const allCollections = await db.listCollections().toArray();
    const collectionsToExport = selectedCollections.length > 0
      ? allCollections.filter(col => selectedCollections.includes(col.name))
      : allCollections;

    const exportDir = path.join(__dirname, 'temp_export');
    fs.mkdirSync(exportDir, { recursive: true });

    for (const col of collectionsToExport) {
      const data = await db.collection(col.name).find().toArray();
      // fs.writeFileSync(path.join(exportDir, `${col.name}.json`), JSON.stringify(data, null, 2));
      // fs.writeFileSync(
      //   path.join(exportDir, `${col.name}.json`),
      //   JSON.stringify(data, (key, value) => {
      //     if (value instanceof mongoose.Types.ObjectId) {
      //       return { $oid: value.toHexString() };
      //     }
      //     return value;
      //   }, 2)
      // );
      const exportedData = prepareForExport(data);
      fs.writeFileSync(
        path.join(exportDir, `${col.name}.json`),
        JSON.stringify(exportedData, null, 2)
      );
    }

    const zipPath = path.join(__dirname, 'temp_export.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip');

    archive.pipe(output);
    archive.directory(exportDir, false);
    archive.finalize();

    output.on('close', () => {
      res.download(zipPath, 'mongodb_backup.zip', () => {
        fs.rmSync(exportDir, { recursive: true, force: true });
        fs.unlinkSync(zipPath);
      });
    });

    archive.on('error', err => {
      throw err;
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
};

export const previewImport = async (req, res) => {
  try {
    const file = req.file;
    const tempDir = path.join(__dirname, 'temp_preview');
    fs.mkdirSync(tempDir, { recursive: true });

    await fs.createReadStream(file.path)
      .pipe(unzipper.Extract({ path: tempDir }))
      .promise();

    const collections = fs.readdirSync(tempDir);
    const previewData = {};

    for (const fileName of collections) {
      if (fileName.endsWith('.json')) {
        const content = fs.readFileSync(path.join(tempDir, fileName), 'utf-8');
        previewData[fileName.replace('.json', '')] = JSON.parse(content).slice(0, 5);
      }
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.unlinkSync(file.path);

    res.json(previewData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Preview import failed' });
  }
};

export const importDB = async (req, res) => {
  try {
    const file = req.file;
    const importDBName = req.body.importDBName || 'importeddb';
    const importMode = req.body.importMode || 'append'; // 'override' or 'append'

    const importDir = path.join(__dirname, 'temp_import');
    fs.mkdirSync(importDir, { recursive: true });

    await fs.createReadStream(file.path)
      .pipe(unzipper.Extract({ path: importDir }))
      .promise();

    const baseDbName = mongoose.connection.name;
    const targetDbName = importDBName ? importDBName : baseDbName;
    const db = mongoose.connection.client.db(targetDbName);

    const files = fs.readdirSync(importDir);
    const skippedIds = {};
    for (const fileName of files) {
      if (fileName.endsWith('.json')) {
        const originalCollectionName = fileName.replace('.json', '');
        const collectionName = originalCollectionName;

        const content = fs.readFileSync(path.join(importDir, fileName), 'utf-8');
        const documents = reviveObjectIds(JSON.parse(content));

        if (documents.length) {
          const collection = db.collection(collectionName);
          skippedIds[collectionName] = [];

          if (importMode === 'override') {
            await collection.deleteMany({});
            await collection.insertMany(documents);
          } else {
            const insertableDocs = [];

            for (const doc of documents) {
              const existing = await collection.findOne({ _id: doc._id });
              if (existing) {
                skippedIds[collectionName].push(doc._id.toString());
              } else {
                insertableDocs.push(doc);
              }
            }

            if (insertableDocs.length) {
              await collection.insertMany(insertableDocs);
            }
          }
        }
      }
    }

    // for (const fileName of files) {
    //   if (fileName.endsWith('.json')) {
    //     const originalCollectionName = fileName.replace('.json', '');
    //     const collectionName = originalCollectionName;

    //     const content = fs.readFileSync(path.join(importDir, fileName), 'utf-8');
    //     // const documents = JSON.parse(content);
    //     const documents = reviveObjectIds(JSON.parse(content));

    //     if (documents.length) {
    //       if (importMode === 'override') {
    //         await db.collection(collectionName).deleteMany({});
    //       }
    //       await db.collection(collectionName).insertMany(documents);
    //     }
    //   }
    // }

    fs.rmSync(importDir, { recursive: true, force: true });
    fs.unlinkSync(file.path);
    const skippedSummary = {};
    for (const [collection, ids] of Object.entries(skippedIds)) {
      skippedSummary[collection] = {
        skippedCount: ids.length,
        skippedIds: ids
      };
    }
    res.json({
      message: `Database import to "${targetDbName}" successful with mode "${importMode}".`,
      skipped: skippedSummary
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Import failed' });
  }
};

// export const exportDB = async (req, res) => {
//   try {
//     const selected = req.body.collections || [];
//     const db       = mongoose.connection.db;
//     const cols     = (await db.listCollections().toArray())
//                      .filter(c => !selected.length || selected.includes(c.name));
//     const exportDir = path.join(__dirname, 'temp_export');
//     fs.mkdirSync(exportDir, { recursive: true });

//     for (let { name } of cols) {
//       const docs = await db.collection(name).find().toArray();
//       // EJSON.stringify will emit {"$oid":"..."} for ObjectId,
//       // {"$date":...} for Date, etc., and preserve type fidelity.
//       fs.writeFileSync(
//         path.join(exportDir, `${name}.json`),
//         EJSON.stringify(docs, { indent: 2 })
//       );
//     }

//     // zip up & send…
//     const zipPath = path.join(__dirname, 'temp_export.zip');
//     const output  = fs.createWriteStream(zipPath);
//     const archive = archiver('zip');
//     archive.pipe(output);
//     archive.directory(exportDir, false);
//     await archive.finalize();

//     output.on('close', () => {
//       res.download(zipPath, 'mongodb_backup.zip', () => {
//         fs.rmSync(exportDir, { recursive: true, force: true });
//         fs.unlinkSync(zipPath);
//       });
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Export failed', details: err.message });
//   }
// };


// export const importDB = async (req, res) => {
//   try {
//     const file       = req.file;
//     const importName = req.body.importDBName || mongoose.connection.name;
//     const mode       = req.body.importMode   || 'append'; // or 'override'
//     const importDir  = path.join(__dirname, 'temp_import');
//     fs.mkdirSync(importDir, { recursive: true });

//     // unzip
//     await fs.createReadStream(file.path)
//       .pipe(unzipper.Extract({ path: importDir }))
//       .promise();

//     const db = mongoose.connection.client.db(importName);
//     const skipped = {};

//     for (let fname of fs.readdirSync(importDir)) {
//       if (!fname.endsWith('.json')) continue;
//       const colName = path.basename(fname, '.json');
//       const raw     = fs.readFileSync(path.join(importDir, fname), 'utf8');
//       // EJSON.parse will turn {"$oid":"..."} back into ObjectId, etc.
//       const docs    = EJSON.parse(raw);

//       if (!docs.length) continue;
//       const coll = db.collection(colName);
//       skipped[colName] = [];

//       if (mode === 'override') {
//         await coll.deleteMany({});
//         await coll.insertMany(docs);
//       } else {
//         const toInsert = [];
//         for (let d of docs) {
//           // d._id is now a real ObjectId
//           const exists = await coll.findOne({ _id: d._id });
//           if (exists) skipped[colName].push(d._id.toHexString());
//           else toInsert.push(d);
//         }
//         if (toInsert.length) await coll.insertMany(toInsert);
//       }
//     }

//     // clean up & respond
//     fs.rmSync(importDir, { recursive: true, force: true });
//     fs.unlinkSync(file.path);

//     res.json({
//       message: `Imported into "${importName}" (${mode}).`,
//       skipped
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Import failed', details: err.message });
//   }
// };