import mongoose from "mongoose";

const { Schema, model } = mongoose;

const displayCounterSchema = new mongoose.Schema({
    form_id: { type: Number, required: true },
    system_id: { type: Number, required: true },
    seq: { type: Number, default: 1 }
  }, { timestamps: true });
  
  displayCounterSchema.index({ form_id: 1, system_id: 1 }, { unique: true });
  
  const DisplayCounter = mongoose.model('DisplayCounter', displayCounterSchema);

  export default DisplayCounter