// src/pages/SupportTicketPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
  Chip,
  Avatar,
  LinearProgress,
  styled
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { ticketAPI } from '../api/api';
import useAuth from '../hooks/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BackButton from '../components/buttons/BackButton';

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 600,
  backgroundColor: 
    status === 'Bug' ? theme.palette.error.light :
    status === 'Feature' ? theme.palette.success.light :
    theme.palette.info.light,
  color: theme.palette.getContrastText(
    status === 'Bug' ? theme.palette.error.light :
    status === 'Feature' ? theme.palette.success.light :
    theme.palette.info.light
  ),
}));

export default function SupportTicketPage() {
  const { userId, email } = useAuth();   
  const [form, setForm] = useState({
    ticket_type: '',
    description: '',
    user: userId,
    email: email
  });
  const [tickets, setTickets] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  // Load tickets on mount
  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await ticketAPI.fetchTickets();
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter tickets by description
  const filtered = useMemo(() =>
    tickets.filter(t =>
      t.description.toLowerCase().includes(searchText.toLowerCase()) ||
      t.ticket_type.toLowerCase().includes(searchText.toLowerCase()) ||
      t.user.toLowerCase().includes(searchText.toLowerCase())
    ),
    [tickets, searchText]
  );

  // Handle form field changes
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Submit a new ticket
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await ticketAPI.createTicket(form);
      setForm({ ticket_type: '', description: '', user: '', email: '' });
      toast.success('Service Now Ticket created successfully!');
      await loadTickets();
    } catch (err) {
      console.error('Failed to create ticket', err);
      toast.success('Service Now Ticket creation failed!');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
    <BackButton label='FAQs'/>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }} >
        <Typography variant="h4" component="h1" fontWeight="600" gutterBottom>
          Support Tickets
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create and manage support requests
        </Typography>
      </Box>
      {/* Create Ticket Form */}
      <StyledPaper elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <AddCircleOutlineIcon />
          </Avatar>
          <Typography variant="h6" fontWeight="600">
            Create New Ticket
          </Typography>
        </Box>
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3} sx={{marginBottom: 2}}>
            <Grid item xs={12} sm={6} sx={{ width: '20%' }}>
              <FormControl fullWidth>
                <InputLabel id="type-label">Ticket Type</InputLabel>
                <Select
                  labelId="type-label"
                  id="ticket_type"
                  name="ticket_type"
                  value={form.ticket_type}
                  label="Ticket Type"
                  onChange={handleChange}
                  required
                  variant="outlined"
                  size="small"
                >
                  <MenuItem value=""><em>Select a type</em></MenuItem>
                  <MenuItem value="Bug">Report Bug</MenuItem>
                  <MenuItem value="Feature">Feature Request</MenuItem>
                  <MenuItem value="Question">Question</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} marginLeft={'2%'} sx={{ width: '30%' }}>
              <TextField
                id="user"
                name="user"
                label="User ID"
                value={form.user}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                disabled
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} marginLeft={'3%'} sx={{ width: '40%' }}>
              <TextField
                id="email"
                name="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange}
                fullWidth
                required
                disabled
                variant="outlined"
                size="small"
                placeholder="your.email@example.com"
              />
            </Grid>
          </Grid>
          <Grid item xs={12}>
              <TextField
                id="description"
                name="description"
                label="Description"
                value={form.description}
                onChange={handleChange}
                multiline
                rows={4}
                fullWidth
                required
                variant="outlined"
                placeholder="Please describe your issue in detail..."
              />
            </Grid>
            <Grid item xs={12} textAlign="center">
              <Button 
                variant="contained" 
                type="submit"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  my: 2,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: '600'
                }}
              >
                Submit Ticket
              </Button>
            </Grid>
        </Box>
      </StyledPaper>

      {/* Search and Tickets Section */}
      <StyledPaper elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="600" sx={{ flexGrow: 1 }}>
            Recent Tickets
          </Typography>
          <TextField
            placeholder="Search tickets..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            size="small"
            variant="outlined"
            InputProps={{
              startAdornment: (
                <IconButton size="small" sx={{ mr: 1 }}>
                  <SearchIcon fontSize="small" />
                </IconButton>
              ),
            }}
            sx={{
              minWidth: 300,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              }
            }}
          />
        </Box>

        {loading ? (
          <LinearProgress />
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="tickets table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: '600' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: '600' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: '600' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: '600' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: '600' }}>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map(t => (
                    <TableRow 
                      key={t._id} 
                      hover
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <TableCell>
                        <StatusChip 
                          label={t.ticket_type} 
                          size="small"
                          status={t.ticket_type}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography noWrap>
                          {t.description}
                        </Typography>
                      </TableCell>
                      <TableCell>{t.user}</TableCell>
                      <TableCell>{t.email}</TableCell>
                      <TableCell>
                        {new Date(t.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchText ? 'No matching tickets found' : 'No tickets created yet'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </StyledPaper>
    </Box>
  );
}