import mongoose from "mongoose";

// Define the Form schema
const formSchema = new mongoose.Schema({
    form_id: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    info: {
        type: Object,
        file_path: { type: String }
    },
    field_ids: { type: [Number] },
    active: {type: String, default: 'No' },
    timestamp: { type: Date, default: Date.now } 
});

const Form = mongoose.model('Form', formSchema);

export { Form };