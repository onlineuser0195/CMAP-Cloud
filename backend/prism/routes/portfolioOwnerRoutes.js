import express from 'express';
import { getAllProjectDetails, getProjectDataForGanttChart, getProjectStatusCount } from '../controllers/portfolioOwnerController.js';

const portfolioOwnerRoutes = express.Router();

portfolioOwnerRoutes.get('/project-details', getAllProjectDetails);

portfolioOwnerRoutes.get('/project-status/:userRole/:userId', getProjectStatusCount);

portfolioOwnerRoutes.get('/project-chart/:userRole/:userId', getProjectDataForGanttChart);

export default portfolioOwnerRoutes;