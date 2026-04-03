import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface AddSavingModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (saving: any) => void;
  initialData?: any;
}

const SAVING_TYPES = [
  'פיקדון',
  'קופת גמל להשקעה',
  'קרן השתלמות',
  'אחר'
];

const RISK_LEVELS = [
  'נמוך',
  'בינוני-נמוך',
  'בינוני',
  'בינוני-גבוה',
  'גבוה'
];

const CURRENCIES = ['ILS', 'USD', 'EUR', 'GBP'];

const AddSavingModal: React.FC<AddSavingModalProps> = ({ open, onClose, onSave, initialData }) => {
  const [formData, setFormData] = React.useState({
    type: 'פיקדון',
    amount: '',
    currency: 'ILS',
    date_created: new Date().toISOString().split('T')[0],
    institution: '',
    risk_level: 'בינוני',
    notes: ''
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date_created: initialData.date_created.split('T')[0],
        amount: initialData.amount.toString()
      });
    } else {
      setFormData({
        type: 'פיקדון',
        amount: '',
        currency: 'ILS',
        date_created: new Date().toISOString().split('T')[0],
        institution: '',
        risk_level: 'בינוני',
        notes: ''
      });
    }
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle component="div" sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
          {initialData ? 'Edit Saving' : 'Add New Saving'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Type"
              name="type"
              fullWidth
              value={formData.type}
              onChange={handleChange}
            >
              {SAVING_TYPES.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Institution"
              name="institution"
              placeholder="e.g. Bank Hapoalim, Meitav Dash"
              fullWidth
              value={formData.institution}
              onChange={handleChange}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              label="Amount"
              name="amount"
              type="number"
              fullWidth
              value={formData.amount}
              onChange={handleChange}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              select
              label="Currency"
              name="currency"
              fullWidth
              value={formData.currency}
              onChange={handleChange}
            >
              {CURRENCIES.map(curr => (
                <MenuItem key={curr} value={curr}>{curr}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Date Created"
              name="date_created"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.date_created}
              onChange={handleChange}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Risk Level"
              name="risk_level"
              fullWidth
              value={formData.risk_level}
              onChange={handleChange}
            >
              {RISK_LEVELS.map(level => (
                <MenuItem key={level} value={level}>{level}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Notes"
              name="notes"
              multiline
              rows={3}
              fullWidth
              value={formData.notes}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: '#64748B' }}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!formData.amount || !formData.institution}
          sx={{ 
            bgcolor: '#6366F1', 
            '&:hover': { bgcolor: '#4F46E5' },
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          {initialData ? 'Update Saving' : 'Add Saving'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSavingModal;
