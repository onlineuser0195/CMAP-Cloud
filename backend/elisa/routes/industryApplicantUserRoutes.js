import express from 'express';
import { getCaseDetails } from '../controller/industryApplicantUserController.js';

const industryApplicantUserRoutes = express.Router();

industryApplicantUserRoutes.get('/case/:caseNumber', getCaseDetails);

export default industryApplicantUserRoutes;
