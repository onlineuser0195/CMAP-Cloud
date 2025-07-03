import React, { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FVS_FIELD_MAPPING_CSV } from '../../constants/constants';

const ImportReviewModal = ({ rows, onSave, onCancel }) => {
  const [edited, setEdited] = useState([...rows]);

  // headers in their original order
  const headers = Object.keys(FVS_FIELD_MAPPING_CSV);
  const fieldIds = Object.values(FVS_FIELD_MAPPING_CSV);

  const handleChange = (idx, fieldId, value) => {
    const copy = [...edited];
    copy[idx].fields[fieldId] = value;
    setEdited(copy);
  };

  const handleDelete = (idx) => {
    const copy = [...edited];
    copy.splice(idx, 1);
    setEdited(copy);
  };
  
  const generateObjectId = () => {
    const timestamp = Math.floor(Date.now() / 1000).toString(16);
    const random = 'xxxxxxxxxxxxxxxx'.replace(/x/g, () => 
      Math.floor(Math.random() * 16).toString(16)
    );
    return timestamp + random;
  };

  const addNewRow = () => {
    const emptyFields = {};
    fieldIds.forEach(fid => {
      emptyFields[fid] = '';
    });
  
  const newRow = {
      _id: generateObjectId(),      
      form_id: rows[0].form_id,
      system_id: rows[0].system_id,
      group_id: rows[0].group_id,
      progress: 'in_progress',
      fields: emptyFields
    };
  
    setEdited(prev => [...prev, newRow]);
  };
  
  return (
    <Dialog open maxWidth="xl" fullWidth>
      <DialogTitle>
        Review Imported Data ({edited.length} rows)
      </DialogTitle>

      <DialogContent>
        <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                {headers.map(h => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
                <TableCell>Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {edited.map((r, i) => (
                <TableRow key={r._id}>
                  <TableCell>{i + 1}</TableCell>
                  {fieldIds.map(fid => (
                    <TableCell key={fid}>
                      {(fid === FVS_FIELD_MAPPING_CSV['Start Date'] || fid === FVS_FIELD_MAPPING_CSV['End Date']) ? (
                        <TextField
                          type="date"
                          variant="standard"
                          fullWidth
                          value={r.fields[fid] || ''}
                          onChange={e =>
                            handleChange(i, fid, e.target.value)
                          }
                        />
                      ) : (
                        <TextField
                          variant="standard"
                          fullWidth
                          value={r.fields[fid] || ''}
                          onChange={e =>
                            handleChange(i, fid, e.target.value)
                          }
                        />
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(i)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <Box display="flex" justifyContent="center" my={2}>
        <Button 
          variant="outlined" 
          onClick={addNewRow}
          size="small"
        >
          + Add New Row
        </Button>
      </Box>


      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => onSave(edited)}
          disabled={edited.length === 0}
        >
          Save All
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportReviewModal;
