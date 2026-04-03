import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useCategories } from '../CategoryDashboard/utils/useCategories';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PaymentsIcon from '@mui/icons-material/Payments';

interface AddRecurrentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

const AddRecurrentModal: React.FC<AddRecurrentModalProps> = ({ open, onClose, onSave, initialData }) => {
  const { categories } = useCategories();
  const [formData, setFormData] = React.useState({
    name: '',
    amount: '',
    category: '',
    start_date: new Date(),
    end_date: null as Date | null,
    type: 'expense'
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        amount: initialData.amount,
        category: initialData.category || '',
        start_date: new Date(initialData.start_date),
        end_date: initialData.end_date ? new Date(initialData.end_date) : null,
        type: initialData.type || 'expense'
      });
    } else {
      setFormData({
        name: '',
        amount: '',
        category: '',
        start_date: new Date(),
        end_date: null,
        type: 'expense'
      });
    }
  }, [initialData, open]);

  const handleSave = () => {
    onSave({
      ...formData,
      amount: parseFloat(formData.amount.toString())
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth 
      PaperProps={{
        sx: { borderRadius: '24px', p: 1 }
      }}
    >
      <DialogTitle sx={{ 
        fontFamily: "'Outfit', sans-serif", 
        fontWeight: 800, 
        fontSize: '24px',
        color: '#1E293B',
        pb: 1
      }}>
        {initialData ? 'Edit Recurrent Transaction' : 'New Recurrent Transaction'}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: '#64748B', mb: 4, mt: -1, fontSize: '14px' }}>
          {initialData ? 'Update the details for this transaction.' : 'Set up a transaction that repeats every month (e.g., Rent, Insurance, Subscriptions).'}
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <ToggleButtonGroup
              value={formData.type}
              exclusive
              onChange={(_, value) => value && setFormData({ ...formData, type: value })}
              fullWidth
              sx={{ 
                mb: 1,
                '& .MuiToggleButton-root': {
                   borderRadius: '12px !important',
                   border: '1px solid #E2E8F0 !important',
                   mx: 0.5,
                   '&.Mui-selected': {
                     border: '1px solid currentColor !important',
                   }
                }
              }}
            >
              <ToggleButton value="expense" sx={{ 
                gap: 1, 
                py: 1.25,
                textTransform: 'none',
                fontWeight: 600,
                color: '#94A3B8',
                '&.Mui-selected': { 
                  bgcolor: 'rgba(220, 38, 38, 0.08) !important', 
                  color: '#DC2626' 
                },
                '&:hover': {
                  bgcolor: 'rgba(220, 38, 38, 0.04)'
                }
              }}>
                <ShoppingBagIcon fontSize="small" /> Expense
              </ToggleButton>
              <ToggleButton value="income" sx={{ 
                gap: 1, 
                py: 1.25,
                textTransform: 'none',
                fontWeight: 600,
                color: '#94A3B8',
                '&.Mui-selected': { 
                  bgcolor: 'rgba(5, 150, 105, 0.08) !important', 
                  color: '#059669' 
                },
                '&:hover': {
                  bgcolor: 'rgba(5, 150, 105, 0.04)'
                }
              }}>
                <PaymentsIcon fontSize="small" /> Income
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Description"
              placeholder="e.g. Monthly Rent"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">₪</InputAdornment>,
              }}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <FormControl fullWidth variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as string })}
                label="Category"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography sx={{ mb: 2, fontWeight: 700, fontSize: '13px', color: '#475569', textTransform: 'uppercase' }}>
              Duration
            </Typography>
          </Grid>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid size={{ xs: 6 }}>
              <DatePicker
                label="Start Date"
                value={formData.start_date}
                onChange={(date) => setFormData({ ...formData, start_date: date || new Date() })}
                slotProps={{ 
                  textField: { 
                    fullWidth: true, 
                    sx: { '& .MuiOutlinedInput-root': { borderRadius: '12px' } } 
                  } 
                }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <DatePicker
                label="End Date (Optional)"
                value={formData.end_date}
                onChange={(date) => setFormData({ ...formData, end_date: date })}
                slotProps={{ 
                  textField: { 
                    fullWidth: true, 
                    sx: { '& .MuiOutlinedInput-root': { borderRadius: '12px' } } 
                  } 
                }}
              />
            </Grid>
          </LocalizationProvider>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} sx={{ 
          color: '#64748B', 
          fontWeight: 600, 
          textTransform: 'none',
          borderRadius: '10px'
        }}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!formData.name || !formData.amount || !formData.start_date}
          sx={{ 
            bgcolor: '#6366F1', 
            '&:hover': { bgcolor: '#4F46E5' },
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '10px',
            px: 4,
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
          }}
        >
          {initialData ? 'Update' : 'Add Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddRecurrentModal;
