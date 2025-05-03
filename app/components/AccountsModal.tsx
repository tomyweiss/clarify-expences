import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  Button,
  TextField,
  MenuItem,
  styled,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface Account {
  id: number;
  vendor: string;
  username?: string;
  id_number?: string;
  card6_digits?: string;
  nickname?: string;
  password?: string;
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
}));

export default function AccountsModal({ isOpen, onClose }: AccountsModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState<Account>({
    vendor: 'isracard',
    username: '',
    id_number: '',
    card6_digits: '',
    password: '',
    nickname: '',
    id: 0,
    created_at: new Date().toISOString(),
  });

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/credentials');
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    // Validate based on vendor type
    if (newAccount.vendor === 'visaCal' || newAccount.vendor === 'max') {
      if (!newAccount.username) {
        setError('Username is required for Visa Cal and Max');
        return;
      }
      if (newAccount.id_number) {
        setError('ID number is not used for Visa Cal and Max');
        return;
      }
    } else if (newAccount.vendor === 'isracard' || newAccount.vendor === 'amex') {
      if (!newAccount.id_number) {
        setError('ID number is required for Isracard and American Express');
        return;
      }
      if (newAccount.username) {
        setError('Username is not used for Isracard and American Express');
        return;
      }
    }

    if (!newAccount.password) {
      setError('Password is required');
      return;
    }
    if (!newAccount.nickname) {
      setError('Account nickname is required');
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
        setNewAccount({
          vendor: 'isracard',
          username: '',
          id_number: '',
          card6_digits: '',
          password: '',
          nickname: '',
          id: 0,
          created_at: new Date().toISOString(),
        });
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
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle style={{ 
        color: '#333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Bank Accounts</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
            Loading accounts...
          </Box>
        ) : accounts.length === 0 && !isAdding ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
            No saved accounts found
          </Box>
        ) : isAdding ? (
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              label="Account Nickname"
              value={newAccount.nickname}
              onChange={(e) => setNewAccount({ ...newAccount, nickname: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              select
              label="Vendor"
              value={newAccount.vendor}
              onChange={(e) => {
                const vendor = e.target.value;
                setNewAccount({
                  ...newAccount,
                  vendor,
                  // Clear fields that are not used for the selected vendor
                  username: vendor === 'visaCal' || vendor === 'max' ? newAccount.username : '',
                  id_number: vendor === 'isracard' || vendor === 'amex' ? newAccount.id_number : '',
                });
              }}
              margin="normal"
            >
              <MenuItem value="isracard">Isracard</MenuItem>
              <MenuItem value="amex">American Express</MenuItem>
              <MenuItem value="visaCal">Visa Cal</MenuItem>
              <MenuItem value="max">Max</MenuItem>
            </TextField>
            {(newAccount.vendor === 'visaCal' || newAccount.vendor === 'max') ? (
              <TextField
                fullWidth
                label="Username"
                value={newAccount.username}
                onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                margin="normal"
                required
              />
            ) : (
              <TextField
                fullWidth
                label="ID Number"
                value={newAccount.id_number}
                onChange={(e) => setNewAccount({ ...newAccount, id_number: e.target.value })}
                margin="normal"
                required
              />
            )}
            {(newAccount.vendor === 'isracard' || newAccount.vendor === 'amex') && (
              <TextField
                fullWidth
                label="Card Last 6 Digits"
                value={newAccount.card6_digits}
                onChange={(e) => setNewAccount({ ...newAccount, card6_digits: e.target.value })}
                margin="normal"
              />
            )}
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={newAccount.password}
              onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
              margin="normal"
              required
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={() => setIsAdding(false)} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleAdd}>
                Add
              </Button>
            </Box>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nickname</TableCell>
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
                  <TableCell>{account.nickname}</TableCell>
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
    </Dialog>
  );
} 