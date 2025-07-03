import SupportTicket from '../models/supportTicket.js';
import axios from 'axios';

// Create ticket in both ServiceNow and local DB
export const createTicket = async (req, res) => {
  try {
    const { ticket_type, description, user, email } = req.body;

    // Call ServiceNow API
    const snConfig = {
      method: 'post',
      url: 'https://dev186263.service-now.com/api/now/table/x_1781121_suppor_0_supporttickets',
      auth: {
        username: process.env.SN_USERNAME,
        password: process.env.SN_PASSWORD
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: { ticket_type, description, user, email }
    };
    const snResp = await axios(snConfig);

    // Store locally
    const ticket = await SupportTicket.create({ ticket_type, description, user, email });

    res.status(201).json({
      local: ticket,
      serviceNow: snResp.data.result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Fetch all tickets
export const listTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort('-createdAt');
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};