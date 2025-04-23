import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';

interface NewIncomeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (incomeName: string, amount: number, date: Date) => void;
}

const NewIncomeModal: React.FC<NewIncomeModalProps> = ({ open, onClose, onSave }) => {
  const [incomeName, setIncomeName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    if (incomeName && amount && date) {
      onSave(incomeName, parseFloat(amount), new Date(date));
      setIncomeName('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Income</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Income Name"
            value={incomeName}
            onChange={(e) => setIncomeName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          sx={{
            color: '#333',
            backgroundColor: '#f1f5f9',
            borderRadius: '12px',
            padding: '8px 16px',
            border: '1px solid #e2e8f0',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: '#e2e8f0',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          sx={{
            color: '#fff',
            backgroundColor: '#4ADE80',
            borderRadius: '12px',
            padding: '8px 16px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: '#3acd70',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(74, 222, 128, 0.2)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewIncomeModal; 