// in your route/middleware
import ActionLog from '../models/actionLogs.js'
import { authenticateRequest } from '../auth.js';
import express from 'express';

const router = express.Router();

function logAction(userId, action, payload) {
  new ActionLog({ userId, action, payload }).save().catch(console.error);
}

router.post('/', (req, res) => {
  const { userId, action, payload } = req.body;
  logAction(userId, action, payload);
  res.sendStatus(204);
});

export default router;
