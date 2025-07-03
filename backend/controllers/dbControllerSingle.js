// routes/dbExport.js
import mongoose from 'mongoose';
// import multer from 'multer';
import fs from 'fs';

export const exportDB = async (req, res) => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  const data = {};

  for (let coll of collections) {
    const docs = await mongoose.connection.db.collection(coll.name).find({}).toArray();
    data[coll.name] = docs;
  }

  res.setHeader('Content-disposition', 'attachment; filename=backup.json');
  res.setHeader('Content-type', 'application/json');
  res.send(JSON.stringify(data, null, 2));
};

// const upload = multer({ dest: 'uploads/' });

export const importDB =  async (req, res) => {
  const filePath = req.file.path;
  const rawData = fs.readFileSync(filePath);
  const jsonData = JSON.parse(rawData);

  for (const collectionName in jsonData) {
    const collection = mongoose.connection.db.collection(collectionName);
    await collection.deleteMany({}); // Optional: clear existing data
    await collection.insertMany(jsonData[collectionName]);
  }

  fs.unlinkSync(filePath);
  res.json({ success: true });
};