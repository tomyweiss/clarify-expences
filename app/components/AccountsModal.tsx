import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';

interface Account {
  id: number;
  vendor: string;
  username?: string;
  id_number?: string;
  card6_digits?: string;
  created_at: string;
}

interface AccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

export default function AccountsModal({ isOpen, onClose }: AccountsModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({
    vendor: 'isracard',
    username: '',
    id_number: '',
    card6_digits: '',
    password: ''
  });
  const [isAdding, setIsAdding] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/credentials');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      } else {
        throw new Error('Failed to fetch accounts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const handleAdd = async () => {
    if ((newAccount.vendor === 'visaCal' || newAccount.vendor === 'max') && !newAccount.username) {
      setError('Username is required for this vendor');
      return;
    }
    if ((newAccount.vendor === 'isracard' || newAccount.vendor === 'amex') && !newAccount.id_number) {
      setError('ID number is required for this vendor');
      return;
    }
    if (!newAccount.password) {
      setError('Password is required');
      return;
    }

    try {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAccount),
      });

      if (response.ok) {
        await fetchAccounts();
        setNewAccount({ vendor: 'isracard', username: '', id_number: '', card6_digits: '', password: '' });
        setIsAdding(false);
      } else {
        throw new Error('Failed to add account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (accountID: number) => {
    try {
      const response = await fetch(`/api/credentials/${accountID}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setAccounts(accounts.filter((account) => account.id !== accountID));
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="md"
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
          <span>Saved Accounts</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAdding(true)}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb',
              },
            }}
          >
            Add Account
          </Button>
          <IconButton onClick={onClose} style={{ color: '#888' }}>
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent style={{ padding: '0 24px 24px' }}>
        {error && (
          <Box sx={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {error}
          </Box>
        )}
        {isAdding && (
          <Box sx={{ 
            padding: '16px', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px',
            marginBottom: '16px',
            backgroundColor: '#f8fafc'
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormControl fullWidth>
                <InputLabel>Vendor</InputLabel>
                <Select
                  value={newAccount.vendor}
                  label="Vendor"
                  onChange={(e) => setNewAccount({...newAccount, vendor: e.target.value})}
                >
                  <MenuItem value="isracard">Isracard</MenuItem>
                  <MenuItem value="visaCal">VisaCal</MenuItem>
                  <MenuItem value="amex">American Express</MenuItem>
                  <MenuItem value="max">Max</MenuItem>
                </Select>
              </FormControl>

              {(newAccount.vendor === 'visaCal' || newAccount.vendor === 'max') ? (
                <TextField
                  label="Username"
                  value={newAccount.username}
                  onChange={(e) => setNewAccount({...newAccount, username: e.target.value})}
                  required
                  fullWidth
                />
              ) : (
                <>
                  <TextField
                    label="ID Number"
                    value={newAccount.id_number}
                    onChange={(e) => setNewAccount({...newAccount, id_number: e.target.value})}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Card Last 6 Digits"
                    value={newAccount.card6_digits}
                    onChange={(e) => setNewAccount({...newAccount, card6_digits: e.target.value})}
                    required
                    fullWidth
                  />
                </>
              )}

              <TextField
                label="Password"
                type="password"
                value={newAccount.password}
                onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                required
                fullWidth
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsAdding(false);
                    setNewAccount({ vendor: 'isracard', username: '', id_number: '', card6_digits: '', password: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleAdd}
                  sx={{
                    backgroundColor: '#3b82f6',
                    '&:hover': {
                      backgroundColor: '#2563eb',
                    },
                  }}
                >
                  Add Account
                </Button>
              </Box>
            </Box>
          </Box>
        )}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
            Loading accounts...
          </Box>
        ) : accounts.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
            No saved accounts found
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Username/ID</TableCell>
                <TableCell>Card Last Digits</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((account, index) => (
                <StyledTableRow key={account.id}>
                  <TableCell>{account.vendor}</TableCell>
                  <TableCell>{account.username || account.id_number}</TableCell>
                  <TableCell>{account.card6_digits || '-'}</TableCell>
                  <TableCell>{new Date(account.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      onClick={() => handleDelete(account.id)}
                      sx={{ color: '#ef4444' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions style={{ padding: '16px 24px' }}>
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
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 