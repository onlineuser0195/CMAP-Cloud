import express from 'express';
import multer from 'multer';
import { updateFormResponse, getFormResponse, updateFormApproval, serveAttachment, getFormResponses, getResponseStatus, deleteResponse, updateFormProgress, getMaxDisplayId } from '../controllers/formResponseController.js';
const router = express.Router();
import { upload } from '../middleware/multerStorage.js';
import { authenticateRequest } from '../auth.js';

// router.get(
//   '/form-response/file/:systemId/:formId/:filename',
//   authenticateRequest,
//   serveAttachment
// );
router.get('/form-response/file/:systemId/:formId/:respId/:fieldId/:filename', serveAttachment);
router.patch('/form-response/:respId/:formId/:systemId',  upload.any(), updateFormResponse);
router.get('/form-response/:respId/:formId/:systemId', getFormResponse);
router.patch('/form-approval/:respId/:formId/:systemId', updateFormApproval);
router.get('/form-responses/:formId/:systemId', getFormResponses);
router.get('/systems/:systemId/forms/:formId/response-status', getResponseStatus);
router.delete('/form-responses/:formId/:systemId', deleteResponse);
router.patch('/form-progress/:respId/:formId/:systemId', updateFormProgress);
router.get('/form-responses/max-display-id/:formId/:systemId', getMaxDisplayId);

export default router;