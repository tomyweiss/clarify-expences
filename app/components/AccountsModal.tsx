import React, { useState, useEffect } from 'react';
import {
  Dialog,
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
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ScrapeModal from './ScrapeModal';
import { CREDIT_CARD_VENDORS, BANK_VENDORS, BEINLEUMI_GROUP_VENDORS, STANDARD_BANK_VENDORS } from '../utils/constants';
import { dateUtils } from './CategoryDashboard/utils/dateUtils';
import { useNotification } from './NotificationContext';
import ModalHeader from './ModalHeader';

interface Account {
  id: number;
  vendor: string;
  username?: string;
  id_number?: string;
  card6_digits?: string;
  bank_account_number?: string;
  nickname?: string;
  // SECURITY: password field removed - fetched separately when needed
  created_at: string;
}

interface AccountWithPassword extends Account {
  password: string;
}

interface AccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'all 0.2s ease-in-out',
  '&:nth-of-type(odd)': {
    backgroundColor: '#F9FAFB',
  },
  '&:hover': {
    backgroundColor: '#F3F4F6',
  },
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '16px 0',
  marginBottom: '16px',
  borderBottom: '1px solid #E5E7EB',
  paddingLeft: '12px',
  '& .MuiTypography-root': {
    fontWeight: 600,
    fontSize: '16px',
    color: '#111827',
  },
}));

const AccountSection = styled(Box)(({ theme }) => ({
  marginBottom: '32px',
  '&:last-child': {
    marginBottom: 0,
  },
}));

export default function AccountsModal({ isOpen, onClose }: AccountsModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountWithPassword | null>(null);
  const { showNotification } = useNotification();
  const [newAccount, setNewAccount] = useState({
    vendor: 'isracard',
    username: '',
    id_number: '',
    card6_digits: '',
    bank_account_number: '',
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
      // SECURITY: Removed console.log to prevent sensitive data logging
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
    } else if (BEINLEUMI_GROUP_VENDORS.includes(newAccount.vendor)) {
      // Beinleumi Group banks only need username/ID, no account number
      if (!newAccount.username) {
        setError('Username/ID is required for Beinleumi Group banks');
        return;
      }
    } else if (STANDARD_BANK_VENDORS.includes(newAccount.vendor)) {
      // Standard banks need both username and account number
      if (!newAccount.username) {
        setError('Username is required for bank accounts');
        return;
      }
      if (!newAccount.bank_account_number) {
        setError('Bank account number is required for bank accounts');
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
          bank_account_number: '',
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

  const handleScrape = async (account: Account) => {
    try {
      // SECURITY: Fetch full credentials including password from secure endpoint
      const response = await fetch(`/api/credentials/${account.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch account credentials');
      }
      const accountWithPassword: AccountWithPassword = await response.json();
      
      setSelectedAccount(accountWithPassword);
      setIsScrapeModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credentials for scraping');
      showNotification('Failed to load credentials for scraping', 'error');
    }
  };

  const handleScrapeSuccess = () => {
    showNotification('Scraping process completed successfully!', 'success');
    window.dispatchEvent(new CustomEvent('dataRefresh'));
  };

  // Separate accounts by type
  const bankAccounts = accounts.filter(account => BANK_VENDORS.includes(account.vendor));
  const creditAccounts = accounts.filter(account => CREDIT_CARD_VENDORS.includes(account.vendor));

  const renderAccountTable = (accounts: Account[], type: 'bank' | 'credit') => {
    if (accounts.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '32px',
          color: '#666',
          fontStyle: 'italic'
        }}>
          No {type === 'bank' ? 'bank' : 'credit card'} accounts found
        </Box>
      );
    }

    return (
      <Box sx={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
        background: '#FFFFFF',
      }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell style={{
              color: '#6B7280',
              borderBottom: '1px solid #E5E7EB',
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: '#F9FAFB',
              padding: '16px'
            }}>Nickname</TableCell>
            <TableCell style={{
              color: '#6B7280',
              borderBottom: '1px solid #E5E7EB',
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: '#F9FAFB',
              padding: '16px'
            }}>Vendor</TableCell>
            <TableCell style={{
              color: '#6B7280',
              borderBottom: '1px solid #E5E7EB',
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: '#F9FAFB',
              padding: '16px'
            }}>{type === 'bank' ? 'Username' : 'ID Number'}</TableCell>
            {type === 'bank' ? (
              <TableCell style={{
                color: '#6B7280',
                borderBottom: '1px solid #E5E7EB',
                fontWeight: 600,
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: '#F9FAFB',
                padding: '16px'
              }}>Account Number</TableCell>
            ) : (
              <TableCell style={{
                color: '#6B7280',
                borderBottom: '1px solid #E5E7EB',
                fontWeight: 600,
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: '#F9FAFB',
                padding: '16px'
              }}>Card Last Digits</TableCell>
            )}
            <TableCell style={{
              color: '#6B7280',
              borderBottom: '1px solid #E5E7EB',
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: '#F9FAFB',
              padding: '16px'
            }}>Created At</TableCell>
            <TableCell align="right" style={{
              color: '#6B7280',
              borderBottom: '1px solid #E5E7EB',
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: '#F9FAFB',
              padding: '16px'
            }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accounts.map((account) => (
            <StyledTableRow key={account.id}>
              <TableCell style={{ color: '#1e293b' }}>{account.nickname}</TableCell>
              <TableCell style={{ color: '#475569' }}>{account.vendor}</TableCell>
              <TableCell style={{ color: '#475569' }}>{account.username || account.id_number}</TableCell>
              <TableCell style={{ color: '#475569' }}>{type === 'bank' ? account.bank_account_number : (account.card6_digits || '-')}</TableCell>
              <TableCell style={{ color: '#64748b' }}>{dateUtils.formatDate(account.created_at)}</TableCell>
              <TableCell align="right">
                <IconButton
                  onClick={() => handleScrape(account)}
                  sx={{ 
                    color: '#3b82f6',
                    '&:hover': {
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    },
                  }}
                >
                  <SyncIcon />
                </IconButton>
                <IconButton 
                  onClick={() => handleDelete(account.id)}
                  sx={{ 
                    color: '#ef4444',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
      </Box>
    );
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onClose={() => {
          if (isAdding) {
            setIsAdding(false);
          } else {
            onClose();
          }
        }} 
        maxWidth="md" 
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
        <ModalHeader 
          title="Accounts Management" 
          onClose={() => {
            if (isAdding) {
              setIsAdding(false);
            } else {
              onClose();
            }
          }}
          actions={
            !isAdding && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsAdding(true)}
                sx={{
                  backgroundColor: '#6366F1',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#4F46E5',
                    boxShadow: 'none',
                  },
                }}
              >
                Add Account
              </Button>
            )
          }
        />
        <DialogContent style={{ padding: '0 32px 32px', color: '#1e293b', minHeight: '550px' }}>
          {error && (
            <div style={{
              background: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
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
            <Box sx={{ p: 2, background: 'rgba(255, 255, 255, 0.5)', borderRadius: '20px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
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
                    username: vendor === 'visaCal' || vendor === 'max' || BANK_VENDORS.includes(vendor) ? newAccount.username : '',
                    id_number: vendor === 'isracard' || vendor === 'amex' ? newAccount.id_number : '',
                    bank_account_number: BANK_VENDORS.includes(vendor) ? newAccount.bank_account_number : '',
                  });
                }}
                margin="normal"
              >
                <MenuItem value="isracard">Isracard</MenuItem>
                <MenuItem value="amex">American Express</MenuItem>
                <MenuItem value="visaCal">Visa Cal</MenuItem>
                <MenuItem value="max">Max</MenuItem>
                <MenuItem value="hapoalim">Bank Hapoalim</MenuItem>
                <MenuItem value="leumi">Bank Leumi</MenuItem>
                <MenuItem value="mizrahi">Mizrahi Tefahot</MenuItem>
                <MenuItem value="discount">Discount Bank</MenuItem>
                <MenuItem value="otsarHahayal">Otsar Hahayal</MenuItem>
                <MenuItem value="beinleumi">Beinleumi</MenuItem>
                <MenuItem value="massad">Massad</MenuItem>
                <MenuItem value="pagi">Pagi</MenuItem>
                <MenuItem value="yahav">Yahav</MenuItem>
                <MenuItem value="union">Union Bank</MenuItem>
              </TextField>
              {(newAccount.vendor === 'visaCal' || newAccount.vendor === 'max' || BANK_VENDORS.includes(newAccount.vendor)) ? (
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
              {STANDARD_BANK_VENDORS.includes(newAccount.vendor) && (
                <TextField
                  fullWidth
                  label="Bank Account Number"
                  value={newAccount.bank_account_number}
                  onChange={(e) => setNewAccount({ ...newAccount, bank_account_number: e.target.value })}
                  margin="normal"
                  required
                  helperText="Required for standard banks"
                />
              )}
              {BEINLEUMI_GROUP_VENDORS.includes(newAccount.vendor) && (
                <TextField
                  fullWidth
                  label="Username / ID"
                  value={newAccount.username}
                  onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                  margin="normal"
                  required
                  helperText="Your ID number (no account number needed for this bank)"
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
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                <Button 
                  onClick={() => setIsAdding(false)}
                  sx={{ 
                    color: '#64748b',
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleAdd}
                  sx={{
                    backgroundColor: '#6366F1',
                    borderRadius: '8px',
                    padding: '8px 24px',
                    textTransform: 'none',
                    fontWeight: 500,
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: '#4F46E5',
                      boxShadow: 'none',
                    },
                  }}
                >
                  Add Account
                </Button>
              </Box>
            </Box>
          ) : (
            <Box style={{ maxHeight: '450px', overflow: 'auto', paddingRight: '12px' }}>
              {/* Bank Accounts Section */}
              <AccountSection>
                <SectionHeader>
                  <AccountBalanceIcon sx={{ color: '#3b82f6', fontSize: '24px' }} />
                  <Typography variant="h6" color="primary">
                    Bank Accounts ({bankAccounts.length})
                  </Typography>
                </SectionHeader>
                {renderAccountTable(bankAccounts, 'bank')}
              </AccountSection>

              {/* Credit Card Accounts Section */}
              <AccountSection>
                <SectionHeader>
                  <CreditCardIcon sx={{ color: '#8b5cf6', fontSize: '24px' }} />
                  <Typography variant="h6" sx={{ color: '#8b5cf6' }}>
                    Credit Card Accounts ({creditAccounts.length})
                  </Typography>
                </SectionHeader>
                {renderAccountTable(creditAccounts, 'credit')}
              </AccountSection>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      <ScrapeModal
        isOpen={isScrapeModalOpen}
        onClose={() => {
          setIsScrapeModalOpen(false);
          setSelectedAccount(null);
        }}
        onSuccess={handleScrapeSuccess}
        initialConfig={selectedAccount ? {
          options: {
            companyId: selectedAccount.vendor,
            startDate: new Date(),
            combineInstallments: false,
            showBrowser: true,
            additionalTransactionInformation: true
          },
          credentials: {
            id: selectedAccount.id_number,
            card6Digits: selectedAccount.card6_digits,
            password: selectedAccount.password,
            username: selectedAccount.username,
            bankAccountNumber: selectedAccount.bank_account_number,
            nickname: selectedAccount.nickname
          }
        } : undefined}
      />
    </>
  );
}