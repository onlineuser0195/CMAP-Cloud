import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Setup multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const formId = req.body.formId || req.params.formId || 'temp';
    const dir = `uploads/form-${formId}`;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // const ext = path.extname(file.originalname);
    // cb(null, file.fieldname + '-' + Date.now() + ext);
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });
export { upload };
