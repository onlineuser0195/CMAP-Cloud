import express from 'express';
import multer from 'multer';
import {
  getCollections,
  exportDB,
  importDB,
  previewImport
} from '../controllers/dbController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/collections', getCollections);
router.post('/export_db', exportDB);
router.post('/import_db', upload.single('file'), importDB);
router.post('/preview_import', upload.single('file'), previewImport);

export default router;
