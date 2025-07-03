import express from 'express';
import { cleanupTempFiles, getAllPermFiles, savePermFile, tempDecryptFolder, uploadTempFile } from '../controllers/pdfController.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.get('/list-permanent-files/:systemId', getAllPermFiles);

router.post('/save-perm-file/:systemId', upload.single('file'), savePermFile);

router.post('/upload-temp-file/:systemId', upload.single('file'), uploadTempFile);

router.get('/cleanup-temp-files/:systemId', cleanupTempFiles);

router.post('/decrypt-files/:systemId', tempDecryptFolder)

export default router;
