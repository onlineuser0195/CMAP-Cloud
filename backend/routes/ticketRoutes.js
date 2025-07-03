import express from 'express';
import { createTicket, listTickets } from '../controllers/ticketController.js';
import { authenticateRequest } from '../auth.js';

const router = express.Router();

// POST /api/tickets
router.post('/', createTicket);

// GET /api/tickets
router.get('/', listTickets);

export default router;