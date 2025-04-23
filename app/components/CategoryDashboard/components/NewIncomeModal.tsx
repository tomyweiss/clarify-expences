import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';

interface NewIncomeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (incomeName: string, amount: number, date: Date) => void;
}

const NewIncomeModal: React.FC<NewIncomeModalProps> = ({ open, onClose, onSave }) => {
  const [incomeName, setIncomeName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [dateString, setDateString] = useState(new Date().toISOString().split('T')[0]);
  const [nameError, setNameError] = useState(false);
  const [amountError, setAmountError] = useState(false);

  const handleSave = () => {
    let valid = true;
    
    if (!incomeName.trim()) {
      setNameError(true);
      valid = false;
    } else {
      setNameError(false);
    }
    
    if (amount === '' || isNaN(Number(amount)) || Number(amount) <= 0) {
      setAmountError(true);
      valid = false;
    } else {
      setAmountError(false);
    }
    
    if (valid) {
      const date = new Date(dateString);
      onSave(incomeName, Number(amount), date);
      setIncomeName('');
      setAmount('');
      setDateString(new Date().toISOString().split('T')[0]);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle style={{ 
        color: '#333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Add New Income</span>
        </div>
        <IconButton onClick={onClose} style={{ color: '#888' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent style={{ padding: '0 24px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <TextField
            label="Income Name"
            value={incomeName}
            onChange={(e) => setIncomeName(e.target.value)}
            fullWidth
            error={nameError}
            helperText={nameError ? "Income name is required" : ""}
            InputLabelProps={{
              style: { color: '#666' },
            }}
            InputProps={{
              style: { color: '#333' },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e2e8f0',
                },
                '&:hover fieldset': {
                  borderColor: '#cbd5e1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4ADE80',
                },
              },
              '& .MuiFormHelperText-root': {
                color: '#ef4444',
              },
            }}
          />
          
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            fullWidth
            error={amountError}
            helperText={amountError ? "Valid amount is required" : ""}
            InputLabelProps={{
              style: { color: '#666' },
            }}
            InputProps={{
              style: { color: '#333' },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e2e8f0',
                },
                '&:hover fieldset': {
                  borderColor: '#cbd5e1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4ADE80',
                },
              },
              '& .MuiFormHelperText-root': {
                color: '#ef4444',
              },
            }}
          />
          
          <TextField
            label="Date"
            type="date"
            value={dateString}
            onChange={(e) => setDateString(e.target.value)}
            fullWidth
            InputLabelProps={{
              style: { color: '#666' },
              shrink: true
            }}
            InputProps={{
              style: { color: '#333' },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e2e8f0',
                },
                '&:hover fieldset': {
                  borderColor: '#cbd5e1',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4ADE80',
                },
              },
            }}
          />
        </div>
      </DialogContent>
      <DialogActions style={{ padding: '0 24px 24px' }}>
        <Button 
          onClick={onClose} 
          style={{ 
            color: '#333',
            backgroundColor: '#f1f5f9',
            borderRadius: '12px',
            padding: '8px 16px',
            border: '1px solid #e2e8f0'
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          style={{ 
            color: '#fff',
            backgroundColor: '#4ADE80',
            borderRadius: '12px',
            padding: '8px 16px',
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewIncomeModal; 