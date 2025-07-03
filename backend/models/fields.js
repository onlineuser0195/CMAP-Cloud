import mongoose from "mongoose";
import { USER_ROLES } from "../constants/constants.js";

const { Schema, model } = mongoose;

// Define the Textbox schema
const textboxSchema = new Schema({
  label: { type: String, required: true },
  field_id: { type: Number, required: true },
  placeholder: { type: String },
  timestamp: { type: Date, default: Date.now },
  required: { type: Boolean, default: false },
  notEditableBy: { 
    type: [String],
    enum: Object.values(USER_ROLES),
    default: [] 
  }
});

// Define the Dropdown schema
const dropdownSchema = new Schema({
  label: { type: String, required: true },
  options: { type: [String], required: true },
  field_id: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  required: { type: Boolean, default: false },
  notEditableBy: { 
    type: [String],
    enum: Object.values(USER_ROLES),
    default: [] 
  }
});

// Define the Checkbox schema
const checkboxSchema = new Schema({
  label: { type: String, required: true },
  options: { type: [String], required: true },
  field_id: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now } ,
  required: { type: Boolean, default: false },
  notEditableBy: { 
    type: [String],
    enum: Object.values(USER_ROLES),
    default: [] 
  }
});

const textareaSchema = new Schema({
  label: { type: String, required: true },
  field_id: { type: Number, required: true },
  rows: { type: Number, default: 4 },
  placeholder: { type: String },
  timestamp: { type: Date, default: Date.now },
  required: { type: Boolean, default: false },
  notEditableBy: { 
    type: [String],
    enum: Object.values(USER_ROLES),
    default: [] 
  }
});

const radioSchema = new Schema({
  label: { type: String, required: true },
  options: { type: [String], required: true },
  field_id: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  required: { type: Boolean, default: false },
  notEditableBy: { 
    type: [String],
    enum: Object.values(USER_ROLES),
    default: [] 
  }
});

const dateSchema = new Schema({
  label: { type: String, required: true },
  field_id: { type: Number, required: true },
  minDate: { type: Date },
  maxDate: { type: Date },
  timestamp: { type: Date, default: Date.now },
  required: { type: Boolean, default: false },
  notEditableBy: { 
    type: [String],
    enum: Object.values(USER_ROLES),
    default: [] 
  }
});

const emailSchema = new Schema({
  label: { type: String, required: true },
  field_id: { type: Number, required: true },
  placeholder: { type: String },
  pattern: {
    type: String,
    default: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$" // Simple email regex
  },
  timestamp: { type: Date, default: Date.now },
  required: { type: Boolean, default: false },
  notEditableBy: { 
    type: [String],
    enum: Object.values(USER_ROLES),
    default: [] 
  }
});

const phoneSchema = new Schema({
  label: { type: String, required: true },
  field_id: { type: Number, required: true },
  placeholder: { type: String, default: 'e.g., (123) 456-7890' },
  pattern: {
    type: String,
    default: "^\\+?\\d{10,15}$" // Allows international numbers
  },
  timestamp: { type: Date, default: Date.now },
  required: { type: Boolean, default: false },
  notEditableBy: { 
    type: [String],
    enum: Object.values(USER_ROLES),
    default: [] 
  }
});

const numberSchema = new Schema({
  label: { type: String, required: true },
  field_id: { type: Number, required: true },
  min: { type: Number },
  max: { type: Number },
  step: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now },
  required: { type: Boolean, default: false },
  notEditableBy: { 
    type: [String],
    enum: Object.values(USER_ROLES),
    default: [] 
  }
});

const attachmentSchema = new Schema({
  label: { type: String, required: true },
  field_id: { type: Number, required: true },
  accept: { type: String, default: '*' }, // e.g., 'image/*', '.pdf', etc.
  maxSizeMB: { type: Number, default: 5 }, // max file size
  timestamp: { type: Date, default: Date.now },
  required: { type: Boolean, default: false },
  notEditableBy: { 
    type: [String],
    enum: Object.values(USER_ROLES),
    default: [] 
  }
});

const instructionSchema = new Schema({
  label: { type: String, required: true },
  field_id: { type: Number, required: true },
  value: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// Create Mongoose models
const Textbox = model('Textbox', textboxSchema);
const Dropdown = model('Dropdown', dropdownSchema);
const Checkbox = model('Checkbox', checkboxSchema);
const Textarea = model('Textarea', textareaSchema);
const DateField = model('DateField', dateSchema);
const Radio = model('Radio', radioSchema);
const EmailField = model('EmailField', emailSchema);
const PhoneField = model('PhoneField', phoneSchema);
const NumberField = model('NumberField', numberSchema);
const Attachment = model('Attachment', attachmentSchema);
const Instruction = model('Instruction', instructionSchema);


export {Textbox, Dropdown, Checkbox, Textarea, DateField, Radio, EmailField, PhoneField, NumberField, Attachment, Instruction};