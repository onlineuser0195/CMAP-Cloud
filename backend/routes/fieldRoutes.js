import express from 'express';
import {
  getTextboxes, getDropdowns, getCheckboxes,
  postTextboxes, postDropdowns, postCheckboxes,
  deleteTextbox, deleteDropdown, deleteCheckbox,
  updateCheckbox, updateDropdown, updateTextbox,
  getField,
  getTextareas, getRadios, getDateFields,
  getEmailFields, getPhoneFields, getNumberFields,
  postTextareas, postRadios, postDateFields,
  postEmailFields, postPhoneFields, postNumberFields,
  updateTextarea, updateRadio, updateDateField,
  updateEmailField, updatePhoneField, updateNumberField,
  deleteTextarea, deleteRadio, deleteDateField,
  deleteEmailField, deletePhoneField, deleteNumberField,
  getAttachments, postAttachment, updateAttachment, deleteAttachment,
  getInstructions, postInstruction, updateInstruction, deleteInstruction
} from '../controllers/fieldController.js';

import {
  Textbox, Dropdown, Checkbox, Textarea,
  Radio, DateField, EmailField, PhoneField, NumberField, Attachment,
  Instruction
} from '../models/fields.js';

const router = express.Router();

// Routes for all fields
router.get('/textboxes', getTextboxes);
router.get('/dropdowns', getDropdowns);
router.get('/checkboxes', getCheckboxes);
router.get('/textareas', getTextareas);
router.get('/radios', getRadios);
router.get('/datefields', getDateFields);
router.get('/emailfields', getEmailFields);
router.get('/phonefields', getPhoneFields);
router.get('/numberfields', getNumberFields);

// GET single field by field_id
router.get('/textboxes/:field_id', getField(Textbox, 'Textbox'));
router.get('/dropdowns/:field_id', getField(Dropdown, 'Dropdown'));
router.get('/checkboxes/:field_id', getField(Checkbox, 'Checkbox'));
router.get('/textareas/:field_id', getField(Textarea, 'Textarea'));
router.get('/radios/:field_id', getField(Radio, 'Radio'));
router.get('/datefields/:field_id', getField(DateField, 'DateField'));
router.get('/emailfields/:field_id', getField(EmailField, 'EmailField'));
router.get('/phonefields/:field_id', getField(PhoneField, 'PhoneField'));
router.get('/numberfields/:field_id', getField(NumberField, 'NumberField'));

// POST
router.post('/textboxes', postTextboxes);
router.post('/dropdowns', postDropdowns);
router.post('/checkboxes', postCheckboxes);
router.post('/textareas', postTextareas);
router.post('/radios', postRadios);
router.post('/datefields', postDateFields);
router.post('/emailfields', postEmailFields);
router.post('/phonefields', postPhoneFields);
router.post('/numberfields', postNumberFields);

// PUT
router.put('/textboxes/:field_id', updateTextbox);
router.put('/dropdowns/:field_id', updateDropdown);
router.put('/checkboxes/:field_id', updateCheckbox);
router.put('/textareas/:field_id', updateTextarea);
router.put('/radios/:field_id', updateRadio);
router.put('/datefields/:field_id', updateDateField);
router.put('/emailfields/:field_id', updateEmailField);
router.put('/phonefields/:field_id', updatePhoneField);
router.put('/numberfields/:field_id', updateNumberField);

// DELETE
router.delete('/textboxes/:field_id', deleteTextbox);
router.delete('/dropdowns/:field_id', deleteDropdown);
router.delete('/checkboxes/:field_id', deleteCheckbox);
router.delete('/textareas/:field_id', deleteTextarea);
router.delete('/radios/:field_id', deleteRadio);
router.delete('/datefields/:field_id', deleteDateField);
router.delete('/emailfields/:field_id', deleteEmailField);
router.delete('/phonefields/:field_id', deletePhoneField);
router.delete('/numberfields/:field_id', deleteNumberField);

// Attachments
router.get('/attachments', getAttachments);
router.post('/attachments', postAttachment);
router.put('/attachments/:field_id', updateAttachment);
router.delete('/attachments/:field_id', deleteAttachment);
router.get('/attachments/:field_id', getField(Attachment, 'Attachment'));

// Instructions
router.get('/instructions', getInstructions);
router.post('/instructions', postInstruction);
router.put('/instructions/:field_id', updateInstruction);
router.delete('/instructions/:field_id', deleteInstruction);
router.get('/instructions/:field_id', getField(Instruction, 'Instruction'));

export default router;
