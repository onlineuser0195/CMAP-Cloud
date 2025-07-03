// import mongoose from "mongoose";
import mongoose from "mongoose";
import { Form } from './forms.js'

const formResponseSchema = new mongoose.Schema({
  form_id: { type: Number, required: true, index: true },
  system_id: { type: Number, required: true, index: true },
  display_id: { type: String,  required: true, index: true },
  fields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed, // Store values directly
    default: () => new Map()
  },
  progress: {
    type: String,
    enum: ['not_started', 'in_progress', 'submitted'],
    default: 'not_started'
  },
  approved: {
    type: String,
    enum: ['true', 'false'],
    default: ''
  },
  comment: { type: String },
  created_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'  // Optional: Links to the "User" model
  },
  updated_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  submitted_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approved_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  submittedAt: {type: Date},
  group_id: { type: Number }
}, { timestamps: true });

formResponseSchema.pre('save', async function(next) {
  try {
    const form = await Form.findOne({ form_id: this.form_id });
    if (!form) throw new Error('Form not found');
    // Only generate display_id if it's missing
    // if (!this.display_id) {
    //   const lastDoc = await this.constructor.findOne({
    //     form_id: this.form_id,
    //     system_id: this.system_id
    //   })
    //   .sort({ display_id: -1 })
    //   .select('display_id')
    //   .lean();

    //   const lastId = lastDoc?.display_id 
    //     ? parseInt(lastDoc.display_id, 10)
    //     : 0;

    //   this.display_id = String(lastId + 1).padStart(9, '0');
    // }

    if (this.isNew && !this.progress) {
      this.progress = 'not_started';
    }

    // Add missing fields with default values
    form.field_ids.forEach(fieldId => {
      const key = String(fieldId);
      if (!this.fields.has(key)) {
        this.fields.set(key, null); // Default null value
      }
    });

    // Remove obsolete fields
    Array.from(this.fields.keys()).forEach(key => {
      if (!form.field_ids.includes(Number(key))) {
        this.fields.delete(key);
      }
    });

    next();
  } catch (error) {
    next(error);
  }
});

const FormResponse = mongoose.model('form_responses', formResponseSchema, 'form_responses');

export { FormResponse };