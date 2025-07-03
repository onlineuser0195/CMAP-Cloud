import express from 'express';
import { getVisitsForConfirmationUser, updateVisitorStatus, updateVisitRemarks } from '../controllers/confirmationUserController.js';

const confirmationUserRoutes = express.Router();

confirmationUserRoutes.get('/:confirmationUserId/visits', getVisitsForConfirmationUser);


confirmationUserRoutes.patch('/visits/:visitId/visitors/:visitorId/status', updateVisitorStatus);


confirmationUserRoutes.patch('/visits/:visitId/remarks', updateVisitRemarks);


export default confirmationUserRoutes;