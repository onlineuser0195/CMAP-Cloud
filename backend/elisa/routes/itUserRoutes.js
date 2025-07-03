import express from 'express';
import multer from 'multer';
import { getUsxportsReports, uploadUsxportsReports } from '../controller/itUserController.js';

const itUserRoutes = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

itUserRoutes.post('/upload-report', upload.single("file"), uploadUsxportsReports);

itUserRoutes.get('/reports', getUsxportsReports);

export default itUserRoutes;
