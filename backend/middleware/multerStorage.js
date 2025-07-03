// multerStorage.js
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { formId, systemId } = req.params;
    const dir = path.join('uploads', `system-${systemId}`, `form-${formId}`);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    const ext = path.extname(file.originalname);
    const safeName = 'file-' + Date.now() + ext;
    file.savedAs = safeName;
    cb(null, safeName);
    // cb(null, file.originalname);
  }
});

const upload = multer({ storage });
export { upload };