import mongoose from "mongoose";

const visitAlertsSchema = new mongoose.Schema({
    submission_count: { type: Number },
    submitted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    submitted_on: { type: Date },
    created_at: { type: Date, default: Date.now },
});

const VisitAlertsSchema = mongoose.model('visit_alerts', visitAlertsSchema, 'visit_alerts');

export default VisitAlertsSchema;
