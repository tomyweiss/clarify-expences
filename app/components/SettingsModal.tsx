import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { getCurrency, setCurrency } from './CategoryDashboard/utils/format';
import { useNotification } from './NotificationContext';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const [currencyPref, setCurrencyPref] = useState('ILS');
  const { showNotification } = useNotification();

  useEffect(() => {
    if (open) {
      setCurrencyPref(getCurrency());
    }
  }, [open]);

  const handleCurrencyChange = (event: any) => {
    const newCurrency = event.target.value;
    setCurrencyPref(newCurrency);
    setCurrency(newCurrency);
    showNotification('Currency updated successfully', 'success');
    window.dispatchEvent(new CustomEvent('dataRefresh')); // To trigger re-render of formatted values
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          background: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #E5E7EB'
        }
      }}
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(17, 24, 39, 0.5)',
          backdropFilter: 'blur(4px)'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>Settings</span>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#9CA3AF',
            '&:hover': { color: '#4B5563', background: '#F3F4F6' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: '0 32px 32px' }}>
        <Box sx={{ mt: 2 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#374151' }}>Preferences</h3>
          
          <FormControl fullWidth size="small">
            <InputLabel id="currency-select-label">Main Currency</InputLabel>
            <Select
              labelId="currency-select-label"
              value={currencyPref}
              label="Main Currency"
              onChange={handleCurrencyChange}
              sx={{
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E5E7EB',
                },
              }}
            >
              <MenuItem value="ILS">Israeli Shekel (₪)</MenuItem>
              <MenuItem value="USD">US Dollar ($)</MenuItem>
              <MenuItem value="EUR">Euro (€)</MenuItem>
              <MenuItem value="GBP">British Pound (£)</MenuItem>
            </Select>
          </FormControl>
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6B7280' }}>
            This currency symbol will be used throughout the dashboard to format your monetary values.
          </p>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
