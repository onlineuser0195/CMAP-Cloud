import express from 'express';
import multer from 'multer';
import { getLastSyncTimeForUsxportsReport, uploadSpanReports } from '../controller/spanSupportUserController.js';

const spanSupportUserRoutes = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

spanSupportUserRoutes.get('/sync-time', getLastSyncTimeForUsxportsReport);


spanSupportUserRoutes.post('/upload-report', upload.single("file"), uploadSpanReports);


export default spanSupportUserRoutes;
