import express from 'express';
import { getAllForms, buildForm, getBuildForm, createForm, 
    updateFormDetails, getFormDetails, deleteForm,
    cloneForms, getAllSystemForms, updateActiveStatus} from '../controllers/formController.js';
const router = express.Router();
import { upload } from '../middleware/upload.js'

router.get('/forms/:systemId', getAllForms);
router.get('/system-forms/:systemId', getAllSystemForms);
router.patch('/build-form/:formId', buildForm);
router.get('/build-form/:formId', getBuildForm);
router.post('/build-form/:formId', buildForm);
router.post('/form-details', upload.single('file'), createForm);
router.patch('/form-details/:formId', upload.single('file'), updateFormDetails);
router.get('/form-details/:formId', getFormDetails);   // Get form details
router.delete('/delete-form/:formId', deleteForm);
router.patch('/active-status/:formId', updateActiveStatus);
router.post('/clone-forms', cloneForms);
// router.get('/files/:formId/:filename', serveInfo);

export default router;