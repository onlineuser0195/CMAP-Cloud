import mongoose from "mongoose";

// Define the Form schema
const systemSchema = new mongoose.Schema({
    system_id: { type: Number, required: true },
    name: { type: String, required: true },
    full_name: { type: String },
    description: { type: String, required: true },
    form_ids : { type: [Number], default: []},
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    roles: [{
        displayName: { type: String, required: true },  // Custom role name for this system
        mappedRole: { type: String, required: true }     // e.g., 'admin', 'editor', etc.
    }]
});

const System = mongoose.model('System', systemSchema);

export { System };