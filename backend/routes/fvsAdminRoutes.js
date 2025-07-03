import express from 'express';
import { getAllVisitRequests, getVisitRequestsAlert, startDataTesting, startModelTraining } from '../controllers/fvsAdminController.js';

const fvsAdminRoutes = express.Router();

fvsAdminRoutes.get('/visit-requests', getAllVisitRequests);

fvsAdminRoutes.get('/visit-alerts', getVisitRequestsAlert);

fvsAdminRoutes.get('/train-model', startModelTraining);

fvsAdminRoutes.get('/test-data', startDataTesting);

export default fvsAdminRoutes;
