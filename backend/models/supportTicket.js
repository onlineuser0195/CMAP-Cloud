import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema({
  ticket_type: { type: String, required: true },
  description: { type: String, required: true },
  user:        { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  email:       { type: String, required: true },
  createdAt:   { type: Date, default: Date.now }
});

export default mongoose.model('SupportTicket', SupportTicketSchema);