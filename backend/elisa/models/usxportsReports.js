import mongoose from "mongoose";


const usxportReportsSchema = new mongoose.Schema({
    type: { type: String, enum: ["Dual-Use", "CJ", "Munitions"], required: true },
    case_number: { type: String, required: true },
    received_date: { type: Date },
    closed_date: { type: Date },
    case_status: { type: String },
    analyst_first_name: { type: String },
    analyst_last_name: { type: String },
    analyst_phone: { type: String },
    analyst_email: { type: String },
    final_date: { type: Date },
    analyst_details: { type: String },
    registration_date: { type: Date },
    reopen_date: { type: Date },
    staffed_organization_status: { type: String },
    organization: { type: String },
    staffed_date: { type: Date },
    reply_date: { type: Date },
    recommendation: { type: String },
    timestamp: { type: Date, default: Date.now },
});

const UsxportReportsSchema = mongoose.model('usxports_reports', usxportReportsSchema);

export default UsxportReportsSchema;
