import express from 'express';
import { getGovernmentLeads } from '../controllers/projectManagerController.js';

const router = express.Router();

router.get('/government-leads', getGovernmentLeads);

export default router;