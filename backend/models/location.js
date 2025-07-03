import mongoose from "mongoose";
 
// Define the Form schema
const locationSchema = new mongoose.Schema({
    location_name: { type: String, required: true }
});

const LocationSchema = mongoose.model('Location', locationSchema);

export { LocationSchema };