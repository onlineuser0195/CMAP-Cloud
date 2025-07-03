import mongoose from "mongoose";

const foreignVisitsSchema = new mongoose.Schema({
    type: { type: String, enum: ['single', 'group'], required: true },
    group_id: { type: String, required: function () { return this.visit_type === 'group'; } },
    location: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    purpose: { type: String, required: true },
    remarks: { type: String, default: '' },
    visitors: {
        type: [{
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            form_response_id: { type: mongoose.Schema.Types.ObjectId },
            visitor_name: { type: String },
            passport_number: { type: String },
            status: { type: String, enum: ['not-visited', 'visited'], default: 'not-visited' },
            confirmed_by: { type: mongoose.Schema.Types.ObjectId },
        }],
    },
    timestamp: { type: Date, default: Date.now },
});



const ForeignVisitsSchema = mongoose.model('foreign_visits', foreignVisitsSchema);

export default ForeignVisitsSchema;