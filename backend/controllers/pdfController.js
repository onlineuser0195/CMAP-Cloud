import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import os from 'os';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.FILE_ENCRYPTION_KEY, 'hex');
const IV_HEX_LEN = 32; 
const IV_LENGTH  = 16;  // bytes

const __dirname = dirname(fileURLToPath(import.meta.url));

// export const getAllPermFiles = async (req, res) => {
//   const system_id = req.params.systemId;
//   const dir = path.join(__dirname, `../uploads/system-${system_id}/perm`);

//   // ensure directory exists
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }

//   fs.readdir(dir, (err, files) => {
//     if (err) {
//       console.error('Error reading perm directory:', err);
//       return res.status(500).json({ files: [] });
//     }

//     const pdfs = files
//       // pick up both .pdf and .pdf.enc
//       .filter(fn => fn.endsWith('.pdf') || fn.endsWith('.pdf.enc'))
//       // strip .enc suffix if present
//       .map(fn => fn.replace(/\.enc$/, ''));

//     res.json({ files: pdfs });
//   });
// };


export const getAllPermFiles = async (req, res) => {
  const system_id = req.params.systemId;
  const dir = path.join(__dirname, `../uploads/system-${system_id}/perm`);

  // ✅ Ensure directory exists
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true }); // Creates all parent folders if needed
    } catch (mkdirErr) {
      console.error('Error creating perm directory:', mkdirErr);
      return res.status(500).json({ files: [] });
    }
  }

  // ✅ Read directory contents
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error('Error reading permanent files directory:', err);
      return res.status(500).json({ files: [] });
    }
    // console.log(files)
    const pdfs = files.filter(file => file.endsWith('.pdf') || file.endsWith('.pdf.enc'));
    res.json({ files: pdfs });
  });
};

// controllers/pdfController.js
// export const savePermFile = async (req, res) => {
//   const system_id = req.params.systemId;
//   const file = req.file; // Assuming you're using multer or similar middleware
//   const permDir = path.join(__dirname, `../uploads/system-${system_id}/perm`);

//   try {
//     // Ensure directory exists
//     fs.mkdirSync(permDir, { recursive: true });
    
//     // Generate unique filename
//     const filename = `${Date.now()}-${file.originalname}`;
//     const filePath = path.join(permDir, filename);
    
//     // Save file
//     fs.writeFileSync(filePath, file.buffer);
    
//     res.json({ 
//       success: true,
//       filename: filename,
//       path: filePath
//     });
//   } catch (err) {
//     console.error('Error saving permanent file:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

export const savePermFile = async (req, res) => {
  const system_id = req.params.systemId;
  const file      = req.file; // from multer
  const permDir   = path.join(__dirname, `../uploads/system-${system_id}/perm`);

  try {
    // 1) ensure directory
    fs.mkdirSync(permDir, { recursive: true });

    // 2) generate IV + cipher
    const iv     = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    // 3) encrypt the entire buffer
    const encryptedBuffer = Buffer.concat([
      cipher.update(file.buffer),
      cipher.final()
    ]);

    // 4) build an IV-prefixed filename
    //    e.g. "<ivHex>-1617971234567-original.pdf.enc"
    const ivHex = iv.toString('hex');
    const uniquePart = `${Date.now()}-${file.originalname}`;
    const encryptedFilename = `${ivHex}-${uniquePart}.enc`;
    const encryptedPath     = path.join(permDir, encryptedFilename);

    // 5) write ciphertext to disk
    fs.writeFileSync(encryptedPath, encryptedBuffer);

    // 6) respond with the encrypted filename & path
    res.json({
      success:  true,
      filename: encryptedFilename,
      path:     encryptedPath
    });

  } catch (err) {
    console.error('Error saving permanent file:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const uploadTempFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const system_id = req.params.systemId;
    const tempFilename = `temp_${Date.now()}_${req.file.originalname}`;

    const dir = path.join(__dirname, `../uploads/system-${system_id}/temp`);

    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        fs.unlinkSync(filePath);
      });
    }

      // ✅ Ensure directory exists
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true }); // Creates all parent folders if needed
      } catch (mkdirErr) {
        console.error('Error creating temp directory:', mkdirErr);
        return res.status(500).json({ files: [] });
      }
    }

    const tempPath = path.join(dir, tempFilename);

    fs.writeFileSync(tempPath, req.file.buffer);
    
    const filePath = `uploads/system-${system_id}/temp/${tempFilename}`

    res.json({ 
      success: true,
      filename: tempFilename,
      path: filePath
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Clean Up functions

export const cleanupTempFolder = async () => {
  try {
    const systemId = 2;
    const tempDir = path.join(__dirname, `../uploads/system-${systemId}/temp`);
    
    if (fs.existsSync(tempDir)) {
      fs.readdirSync(tempDir).forEach(file => {
        const filePath = path.join(tempDir, file);
        fs.unlinkSync(filePath);
      });
    }    
    console.log('Clean Up Done!')
  } catch (err) {
    console.log('Error deleting temp files', err)
  }
};

export const cleanupTempFiles = async (req, res) => {
  try {
    const systemId = req.params.systemId;
    const tempDir = path.join(__dirname, `../uploads/system-${systemId}/temp`);
    
    if (!fs.existsSync(tempDir)) {
      return res.status(200).json({ message: 'Temp directory does not exist' });
    }

    const files = fs.readdirSync(tempDir);
    let deletedCount = 0;
    let errorCount = 0;

    files.forEach(file => {
      try {
        const filePath = path.join(tempDir, file);
        fs.unlinkSync(filePath);
        deletedCount++;
      } catch (err) {
        errorCount++;
        console.error(`Error deleting file ${file}:`, err);
      }
    });

    res.status(200).json({ 
      success: true,
      deletedCount,
      errorCount
    });

  } catch (err) {
    console.error('Cleanup error:', err);
    res.status(500).json({ 
      error: 'Cleanup failed',
      details: err.message 
    });
  }
};

const cleanupInterval = setInterval(async () => {
  try {
    // Mock req/res objects for interval call
    const mockReq = { params: { systemId: '2' } };
    const mockRes = {
      status: () => ({ json: (data) => console.log('Cleanup result:', data) }),
      json: (data) => console.log('Cleanup result:', data)
    };
    await cleanupTempFiles(mockReq, mockRes);
  } catch (err) {
    console.error('Scheduled cleanup error:', err);
  }
}, 3600000); // Run hourly (3600000ms)

const startCleanupJob = () => {
  const interval = setInterval(async () => {
    // ... cleanup logic ...
  }, 3600000); // 1 hour
  
  process.on('SIGTERM', () => clearInterval(interval));
  process.on('SIGINT', () => clearInterval(interval));
};

/**
 * Decrypt a single .enc file or a whole directory of them.
 * @param {string} inputPath  Absolute path to a .enc file or to a folder.
 * @returns {Promise<string>}  Path to the decrypted file, or to the temp folder containing all decrypted files.
 */

export const tempDecryptFolder = async (req, res) => {
  try {
    const { systemId } = req.params;
    let { path: rawPath } = req.body;
    if (!rawPath) {
      return res.status(400).json({ error: 'No path provided' });
    }

    // normalize & strip leading slash so join() works
    rawPath = path.normalize(rawPath).replace(/^[/\\]+/, '');

    // resolve the encrypted file/folder on disk
    const inputPath = path.join(__dirname, '../', rawPath);

    // prepare & clear temp dir
    const tmpDirFs = path.join(__dirname, `../uploads/system-${systemId}/temp`);
    if (fs.existsSync(tmpDirFs)) {
      fs.rmSync(tmpDirFs, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpDirFs, { recursive: true });

    // ensure it exists
    if (!fs.existsSync(inputPath)) {
      console.error('tempDecryptFolder: not found:', inputPath);
      return res.status(404).json({ error: 'Input path not found' });
    }

    const stat = fs.statSync(inputPath);

    // helper to build the relative URL
    const makeRel = (name) => `/uploads/system-${systemId}/temp/${name}`;

    // single-file case
    if (stat.isFile()) {
      const base = path.basename(inputPath);

      if (base.endsWith('.enc') && base.length > IV_HEX_LEN) {
        // encrypted → decrypt
        const ivHex         = base.slice(0, IV_HEX_LEN);
        const iv            = Buffer.from(ivHex, 'hex');
        const encryptedName = base.slice(IV_HEX_LEN);      // e.g. "file.pdf.enc"
        const decryptedName = encryptedName.slice(0, -4);  // strip ".enc"
        const outFsPath     = path.join(tmpDirFs, decryptedName);

        await new Promise((resolve, reject) => {
          fs.createReadStream(inputPath)
            .pipe(crypto.createDecipheriv(ALGORITHM, KEY, iv))
            .pipe(fs.createWriteStream(outFsPath))
            .on('finish', resolve)
            .on('error',  reject);
        });

        // return the **relative** URL
        return res.json({ decryptedPath: makeRel(decryptedName) });
      }

      // plain file → just copy
      const outFsPath = path.join(tmpDirFs, base);
      fs.copyFileSync(inputPath, outFsPath);
      return res.json({ decryptedPath: makeRel(base) });
    }

    // directory case
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(inputPath)) {
        const fullIn  = path.join(inputPath, entry);
        const isEnc   = entry.endsWith('.enc') && entry.length > IV_HEX_LEN;
        const outName = isEnc
          ? entry.slice(IV_HEX_LEN, -4)  // strip IV prefix + ".enc"
          : entry;
        const fullOut = path.join(tmpDirFs, outName);

        if (fs.statSync(fullIn).isFile()) {
          if (isEnc) {
            const iv = Buffer.from(entry.slice(0, IV_HEX_LEN), 'hex');
            await new Promise((resolve, reject) => {
              fs.createReadStream(fullIn)
                .pipe(crypto.createDecipheriv(ALGORITHM, KEY, iv))
                .pipe(fs.createWriteStream(fullOut))
                .on('finish', resolve)
                .on('error',  reject);
            });
          } else {
            fs.copyFileSync(fullIn, fullOut);
          }
        }
      }
      // return the **relative** temp folder URL
      return res.json({ decryptedDir: `/uploads/system-${systemId}/temp` });
    }

    throw new Error('tempDecryptFolder: invalid input type');
  } catch (err) {
    console.error('tempDecryptFolder error', err);
    res.status(500).json({ error: err.message });
  }
};
// startCleanupJob();

// setInterval(cleanupTempFolder, 3600000); // Clean hourly