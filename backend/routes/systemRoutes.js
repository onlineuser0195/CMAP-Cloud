import express from 'express';
import { getAllSystems, addFormsToSystem, getAvailableForms, 
    removeFormFromSystem, createSystem, updateSystemDetails, getSystemDetails, 
    deleteSystem } from '../controllers/systemController.js';

const router = express.Router();

router.get('/systems', getAllSystems);   // Get All Systems

router.patch('/system/:systemId/add-forms', addFormsToSystem);

router.get('/available-forms/:systemId', getAvailableForms);

router.patch('/system/:systemId/remove-form/:formId', removeFormFromSystem);

router.get('/system/:systemId', getSystemDetails);

router.post('/system', createSystem);

router.patch('/system/:systemId', updateSystemDetails);

router.delete('/delete-system/:systemId', deleteSystem);

export default router;