// backend/models/actionLogs.js
import mongoose from 'mongoose';

const ActionLogSchema = new mongoose.Schema({
  userId:    String,
  action:    String,
  payload:   mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now, index: true }
});

// TTL index: automatically delete after 30 days
ActionLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

// ESM export
export default mongoose.model('ActionLog', ActionLogSchema);
