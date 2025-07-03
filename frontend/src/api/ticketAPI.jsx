import axios from 'axios';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const createTicket = payload =>
  axios.post(`${VITE_API_URL}/api/tickets`, payload).then(res => res.data);

export const fetchTickets = () =>
  axios.get(`${VITE_API_URL}/api/tickets`).then(res => res.data);