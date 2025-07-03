import express from 'express';
import { getSystemOverview, getFormsByStatus, getFormOverview } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/overview', getSystemOverview);

router.get('/form-overview', getFormOverview);

router.get('/forms-status/:status', getFormsByStatus);

export default router;