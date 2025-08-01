import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ModalHeader from './ModalHeader';

interface ManualModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (transactionData: {
    name: string;
    amount: number;
    date: Date;
    type: 'income' | 'expense';
    category?: string;
  }) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`manual-tabpanel-${index}`}
      aria-labelledby={`manual-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ManualModal: React.FC<ManualModalProps> = ({ open, onClose, onSave }) => {
  const [tabValue, setTabValue] = useState(0);
  const [transactionName, setTransactionName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [nameError, setNameError] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const [categoryError, setCategoryError] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch('/api/get_all_categories');
        if (response.ok) {
          const data = await response.json();
          // Filter out 'Bank' category for expenses since it's used for income
          const expenseCategories = data.filter((cat: string) => cat !== 'Bank');
          setCategories(expenseCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to default categories if API fails
        setCategories([
          'Food & Dining',
          'Transportation',
          'Shopping',
          'Entertainment',
          'Utilities',
          'Healthcare',
          'Education',
          'Travel',
          'Other'
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [open]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Reset errors when switching tabs
    setNameError(false);
    setAmountError(false);
    setCategoryError(false);
  };

  const handleSubmit = () => {
    let valid = true;
    
    if (!transactionName.trim()) {
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

    // Only require category for expenses
    if (tabValue === 1 && !category) {
      setCategoryError(true);
      valid = false;
    } else {
      setCategoryError(false);
    }
    
    if (valid) {
      const transactionType = tabValue === 0 ? 'income' : 'expense';
      const transactionAmount = Number(amount); // Always positive amount
      
      onSave({
        name: transactionName,
        amount: transactionAmount,
        date: new Date(date),
        type: transactionType,
        category: tabValue === 1 ? category : undefined
      });

      // Reset form
      setTransactionName('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('');
      onClose();
    }
  };

  const handleClose = () => {
    // Reset form and errors
    setTransactionName('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('');
    setNameError(false);
    setAmountError(false);
    setCategoryError(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
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
      <ModalHeader title="Manual Transaction Entry" onClose={handleClose} />

      <DialogContent style={{ padding: '0 24px 24px' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="manual transaction tabs"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '14px',
                minHeight: '48px',
                color: '#666',
                '&.Mui-selected': {
                  color: '#3b82f6',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#3b82f6',
              },
            }}
          >
            <Tab 
              icon={<TrendingUpIcon />} 
              label="Income" 
              iconPosition="start"
            />
            <Tab 
              icon={<TrendingDownIcon />} 
              label="Expense" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 2,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ecfeff 0%, #f0f9ff 60%)',
              border: '1px solid #e0f2fe',
              color: '#0c4a6e',
              boxShadow: '0 4px 16px rgba(12,74,110,0.06)'
            }}>
              <LightbulbOutlinedIcon sx={{ color: '#0284c7' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Manual income</div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>
                  Add manual income transactions. They will appear in Bank Transactions.
                </div>
              </div>
            </Box>
            
            <TextField
              label="Income Name"
              value={transactionName}
              onChange={(e) => setTransactionName(e.target.value)}
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
              onChange={(e) => setAmount(e.target.value)}
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
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 2,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #fff1f2 0%, #fef2f2 60%)',
              border: '1px solid #fee2e2',
              color: '#7f1d1d',
              boxShadow: '0 4px 16px rgba(127,29,29,0.06)'
            }}>
              <LightbulbOutlinedIcon sx={{ color: '#dc2626' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Manual expense</div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>
                  Add manual expenses to be categorized and included in reports.
                </div>
              </div>
            </Box>
            
            <TextField
              label="Expense Name"
              value={transactionName}
              onChange={(e) => setTransactionName(e.target.value)}
              fullWidth
              error={nameError}
              helperText={nameError ? "Expense name is required" : ""}
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
                    borderColor: '#ef4444',
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
              onChange={(e) => setAmount(e.target.value)}
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
                    borderColor: '#ef4444',
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: '#ef4444',
                },
              }}
            />

            <FormControl fullWidth error={categoryError}>
              <InputLabel style={{ color: '#666' }}>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
                style={{ color: '#333' }}
                disabled={loadingCategories}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#cbd5e1',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ef4444',
                  },
                }}
              >
                {loadingCategories ? (
                  <MenuItem disabled>Loading categories...</MenuItem>
                ) : (
                  categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))
                )}
              </Select>
              {categoryError && (
                <Typography variant="caption" color="error" style={{ marginTop: '4px', marginLeft: '14px' }}>
                  Category is required
                </Typography>
              )}
            </FormControl>
            
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
                    borderColor: '#ef4444',
                  },
                },
              }}
            />
          </div>
        </TabPanel>
      </DialogContent>

      <DialogActions style={{ padding: '0 24px 24px' }}>
        <Button 
          onClick={handleClose}
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
          variant="contained"
          onClick={handleSubmit}
          disabled={loadingCategories && tabValue === 1}
          sx={{
            backgroundColor: tabValue === 0 ? '#4ADE80' : '#ef4444',
            '&:hover': {
              backgroundColor: tabValue === 0 ? '#22c55e' : '#dc2626',
            },
            '&:disabled': {
              backgroundColor: '#9ca3af',
            },
          }}
        >
          Save {tabValue === 0 ? 'Income' : 'Expense'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManualModal; 