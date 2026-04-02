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
  Chip,
  Tooltip,
  Fade,
  CircularProgress,
} from '@mui/material';
import DialogActions from '@mui/material/DialogActions';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import EditIcon from '@mui/icons-material/Edit';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import BadgeIcon from '@mui/icons-material/Badge';

import PersonIcon from '@mui/icons-material/Person';
import NumbersIcon from '@mui/icons-material/Numbers';
import ScrapeModal from './ScrapeModal';
import { CREDIT_CARD_VENDORS, BANK_VENDORS, BEINLEUMI_GROUP_VENDORS, STANDARD_BANK_VENDORS } from '../utils/constants';
import { dateUtils } from './CategoryDashboard/utils/dateUtils';
import { useNotification } from './NotificationContext';
import ModalHeader from './ModalHeader';

const VENDOR_LOGOS: Record<string, string> = {
  isracard: 'isracard.co.il',
  amex: 'americanexpress.co.il',
  visaCal: 'cal-online.co.il',
  max: 'max.co.il',
  hapoalim: 'bankhapoalim.co.il',
  leumi: 'leumi.co.il',
  mizrahi: 'mizrahi-tefahot.co.il',
  discount: 'discountbank.co.il',
  otsarHahayal: 'fibi.co.il',
  beinleumi: 'fibi.co.il',
  massad: 'bankmassad.co.il',
  pagi: 'pagi.co.il',
  yahav: 'bank-yahav.co.il',
  union: 'unionbank.co.il',
};

interface Account {
  id: number;
  vendor: string;
  username?: string;
  id_number?: string;
  card6_digits?: string;
  card_suffixes?: string;
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

// Vendor display names mapping
const VENDOR_DISPLAY_NAMES: Record<string, string> = {
  isracard: 'Isracard',
  amex: 'American Express',
  visaCal: 'Visa Cal',
  max: 'Max',
  hapoalim: 'Bank Hapoalim',
  leumi: 'Bank Leumi',
  mizrahi: 'Mizrahi Tefahot',
  discount: 'Discount Bank',
  otsarHahayal: 'Otsar Hahayal',
  beinleumi: 'Beinleumi',
  massad: 'Massad',
  pagi: 'Pagi',
  yahav: 'Yahav',
  union: 'Union Bank',
};

const VENDOR_GROUPS = [
  {
    label: 'Credit Cards',
    icon: <CreditCardIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />,
    vendors: [
      { value: 'isracard', label: 'Isracard' },
      { value: 'amex', label: 'American Express' },
      { value: 'visaCal', label: 'Visa Cal' },
      { value: 'max', label: 'Max' },
    ]
  },
  {
    label: 'Banks',
    icon: <AccountBalanceIcon sx={{ fontSize: 18, color: '#3b82f6' }} />,
    vendors: [
      { value: 'hapoalim', label: 'Bank Hapoalim' },
      { value: 'leumi', label: 'Bank Leumi' },
      { value: 'mizrahi', label: 'Mizrahi Tefahot' },
      { value: 'discount', label: 'Discount Bank' },
      { value: 'otsarHahayal', label: 'Otsar Hahayal' },
      { value: 'beinleumi', label: 'Beinleumi' },
      { value: 'massad', label: 'Massad' },
      { value: 'pagi', label: 'Pagi' },
      { value: 'yahav', label: 'Yahav' },
      { value: 'union', label: 'Union Bank' },
    ]
  }
];

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

// --- Styled form components for the redesigned add/edit form ---
const FormSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
});

const FormSectionTitle = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
  '& .section-icon': {
    width: 32,
    height: 32,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const VendorGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: '10px',
});

const VendorCard = styled(Box)<{ selected?: boolean }>(({ selected }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '14px 10px',
  borderRadius: '10px',
  border: selected ? '2px solid #6366F1' : '1px solid #E5E7EB',
  background: selected ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' : '#FFFFFF',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: '#6366F1',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
  },
}));

export default function AccountsModal({ isOpen, onClose }: AccountsModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountWithPassword | null>(null);
  const { showNotification } = useNotification();
  const [addStep, setAddStep] = useState(0); // 0 = vendor, 1 = credentials
  const [newAccount, setNewAccount] = useState({
    vendor: '',
    username: '',
    id_number: '',
    card6_digits: '',
    card_suffixes: '',
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
      if (!newAccount.username) {
        setError('Username/ID is required for Beinleumi Group banks');
        return;
      }
    } else if (STANDARD_BANK_VENDORS.includes(newAccount.vendor)) {
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
        resetAddForm();
        showNotification('Account added successfully!', 'success');
      } else {
        throw new Error('Failed to add account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const resetAddForm = () => {
    setNewAccount({
      vendor: '',
      username: '',
      id_number: '',
      card6_digits: '',
      card_suffixes: '',
      bank_account_number: '',
      password: '',
      nickname: '',
      id: 0,
      created_at: new Date().toISOString(),
    });
    setAddStep(0);
    setIsAdding(false);
    setEditingAccountId(null);
    setError(null);
  };

  const handleDelete = async (accountID: number) => {
    try {
      const response = await fetch(`/api/credentials/${accountID}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setAccounts(accounts.filter((account) => account.id !== accountID));
        showNotification('Account deleted', 'success');
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // --- EDIT MODE ---
  const handleStartEdit = async (account: Account) => {
    try {
      setEditingAccountId(account.id);
      setNewAccount({
        vendor: account.vendor,
        username: account.username || '',
        id_number: account.id_number || '',
        card6_digits: account.card6_digits || '',
        card_suffixes: account.card_suffixes || '',
        bank_account_number: account.bank_account_number || '',
        nickname: account.nickname || '',
        password: '', // Empty — only send if user wants to change it
        id: account.id,
        created_at: account.created_at,
      });
      setIsAdding(true);
      setAddStep(1); // skip vendor selection
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account for editing');
    }
  };

  const handleCancelEdit = () => {
    resetAddForm();
  };

  const handleSaveEdit = async () => {
    if (!editingAccountId || !newAccount) return;

    if (!newAccount.nickname) {
      setError('Account nickname is required');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/credentials/${editingAccountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAccount),
      });

      if (response.ok) {
        await fetchAccounts();
        resetAddForm();
        setError(null);
        showNotification('Account updated successfully!', 'success');
      } else {
        throw new Error('Failed to update account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleScrape = async (account: Account) => {
    try {
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

    const headerStyle = {
      color: '#6B7280',
      borderBottom: '1px solid #E5E7EB',
      fontWeight: 600,
      fontSize: '13px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      background: '#F9FAFB',
      padding: '16px'
    };

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
            <TableCell style={headerStyle}>Nickname</TableCell>
            <TableCell style={headerStyle}>Vendor</TableCell>
            <TableCell style={headerStyle}>{type === 'bank' ? 'Username' : 'ID Number'}</TableCell>
            <TableCell style={headerStyle}>{type === 'bank' ? 'Account Number' : 'Card Digits'}</TableCell>
            <TableCell style={headerStyle}>Created At</TableCell>
            <TableCell align="right" style={headerStyle}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accounts.map((account) => (
            <StyledTableRow key={account.id}>
              <TableCell style={{ color: '#1e293b', fontWeight: 500 }}>{account.nickname}</TableCell>
              <TableCell>
                <Chip
                  label={VENDOR_DISPLAY_NAMES[account.vendor] || account.vendor}
                  size="small"
                  sx={{
                    backgroundColor: CREDIT_CARD_VENDORS.includes(account.vendor) ? '#F3E8FF' : '#DBEAFE',
                    color: CREDIT_CARD_VENDORS.includes(account.vendor) ? '#7C3AED' : '#2563EB',
                    fontWeight: 500,
                    fontSize: '12px',
                  }}
                />
              </TableCell>
              <TableCell style={{ color: '#475569' }}>{account.username || account.id_number}</TableCell>
              <TableCell style={{ color: '#475569' }}>{type === 'bank' ? account.bank_account_number : (account.card6_digits || '-')}</TableCell>
              <TableCell style={{ color: '#64748b' }}>{dateUtils.formatDate(account.created_at)}</TableCell>
              <TableCell align="right">
                <Tooltip title="Edit account">
                  <IconButton
                    onClick={() => handleStartEdit(account)}
                    sx={{ 
                      color: '#f59e0b',
                      '&:hover': {
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Scrape transactions">
                  <IconButton
                    onClick={() => handleScrape(account)}
                    sx={{ 
                      color: '#3b82f6',
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      },
                    }}
                  >
                    <SyncIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete account">
                  <IconButton 
                    onClick={() => handleDelete(account.id)}
                    sx={{ 
                      color: '#ef4444',
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
      </Box>
    );
  };

  // --- REDESIGNED ADD ACCOUNT FORM ---
  const renderAddAccountForm = () => {
    // Step 0: Vendor Selection
    if (addStep === 0) {
      return (
        <Fade in={true} timeout={300}>
          <FormSection>
            {VENDOR_GROUPS.map((group) => (
              <Box key={group.label}>
                <FormSectionTitle>
                  <Box className="section-icon" sx={{
                    background: group.label === 'Credit Cards' 
                      ? 'linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)'
                      : 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                  }}>
                    {group.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>
                    {group.label}
                  </Typography>
                </FormSectionTitle>
                <VendorGrid>
                  {group.vendors.map((vendor) => (
                    <VendorCard
                      key={vendor.value}
                      selected={newAccount.vendor === vendor.value}
                      onClick={() => {
                        setNewAccount({
                          ...newAccount,
                          vendor: vendor.value,
                          username: '',
                          id_number: '',
                          bank_account_number: '',
                          card6_digits: '',
                          card_suffixes: '',
                        });
                        setError(null);
                        setAddStep(1);
                      }}
                    >
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        mb: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#FFFFFF',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        overflow: 'hidden'
                      }}>
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${VENDOR_LOGOS[vendor.value]}&sz=64`} 
                          alt={vendor.label}
                          style={{ width: '28px', height: '28px', borderRadius: '4px' }}
                          onError={(e: any) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <Box sx={{ display: 'none' }}>
                          {CREDIT_CARD_VENDORS.includes(vendor.value) 
                            ? <CreditCardIcon sx={{ fontSize: 20, color: '#8B5CF6' }} />
                            : <AccountBalanceIcon sx={{ fontSize: 20, color: '#3B82F6' }} />
                          }
                        </Box>
                      </Box>
                      <Typography sx={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#374151',
                        textAlign: 'center',
                        lineHeight: 1.2,
                      }}>
                        {vendor.label}
                      </Typography>
                    </VendorCard>
                  ))}
                </VendorGrid>
              </Box>
            ))}
          </FormSection>
        </Fade>
      );
    }

    // Step 1: Credentials Form
    const vendorLabel = VENDOR_DISPLAY_NAMES[newAccount.vendor] || newAccount.vendor;
    const isBank = BANK_VENDORS.includes(newAccount.vendor);
    const isCreditCard = CREDIT_CARD_VENDORS.includes(newAccount.vendor);

    return (
      <Fade in={true} timeout={300}>
        <FormSection>
          {/* Header with selected vendor */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            background: isBank 
              ? 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)'
              : 'linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)',
            borderRadius: '12px',
            border: isBank ? '1px solid #93C5FD' : '1px solid #C4B5FD',
          }}>
            <Box sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}>
              <img 
                src={`https://www.google.com/s2/favicons?domain=${VENDOR_LOGOS[newAccount.vendor]}&sz=64`} 
                alt={vendorLabel}
                style={{ width: '30px', height: '30px', borderRadius: '4px' }}
                onError={(e: any) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
              <Box sx={{ display: 'none' }}>
                {isBank 
                  ? <AccountBalanceIcon sx={{ fontSize: 22, color: '#3B82F6' }} />
                  : <CreditCardIcon sx={{ fontSize: 22, color: '#8B5CF6' }} />
                }
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#1E1B4B' }}>
                {vendorLabel}
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                {isBank ? 'Bank Account' : 'Credit Card'}
              </Typography>
            </Box>
            {!editingAccountId && (
              <Button
                onClick={() => { setAddStep(0); setError(null); }}
                size="small"
                sx={{
                  textTransform: 'none',
                  color: '#6B7280',
                  fontSize: '13px',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' }
                }}
              >
                Change
              </Button>
            )}
          </Box>

          {/* Account Info Section */}
          <Box>
            <FormSectionTitle>
              <Box className="section-icon" sx={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' }}>
                <BadgeIcon sx={{ fontSize: 18, color: '#D97706' }} />
              </Box>
              <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>
                Account Info
              </Typography>
            </FormSectionTitle>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Account Nickname"
                value={newAccount.nickname}
                onChange={(e) => setNewAccount({ ...newAccount, nickname: e.target.value })}
                required
                placeholder="e.g. My Main Card"
              />
            </Box>
          </Box>

          {/* Credentials Section */}
          <Box>
            <FormSectionTitle>
              <Box className="section-icon" sx={{ background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)' }}>
                <PersonIcon sx={{ fontSize: 18, color: '#16A34A' }} />
              </Box>
              <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>
                Login Credentials
              </Typography>
            </FormSectionTitle>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {(newAccount.vendor === 'visaCal' || newAccount.vendor === 'max' || BANK_VENDORS.includes(newAccount.vendor)) ? (
                <TextField
                  fullWidth
                  label="Username"
                  value={newAccount.username}
                  onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                  required
                />
              ) : (
                <TextField
                  fullWidth
                  label="ID Number"
                  value={newAccount.id_number}
                  onChange={(e) => setNewAccount({ ...newAccount, id_number: e.target.value })}
                  required
                />
              )}

              {STANDARD_BANK_VENDORS.includes(newAccount.vendor) && (
                <TextField
                  fullWidth
                  label="Bank Account Number"
                  value={newAccount.bank_account_number}
                  onChange={(e) => setNewAccount({ ...newAccount, bank_account_number: e.target.value })}
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
                  required
                  helperText="Your ID number (no account number needed for this bank)"
                />
              )}

              <TextField
                fullWidth
                label={editingAccountId ? "New Password" : "Password"}
                type="password"
                value={newAccount.password}
                onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                required={!editingAccountId}
                placeholder={editingAccountId ? "Leave empty to keep current password" : ""}
                helperText={editingAccountId ? "Only fill this if you want to change the password" : ""}
              />
            </Box>
          </Box>

          {/* Optional Card Details Section (credit cards only) */}
          {(newAccount.vendor === 'isracard' || newAccount.vendor === 'amex') && (
            <Box>
              <FormSectionTitle>
                <Box className="section-icon" sx={{ background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)' }}>
                  <NumbersIcon sx={{ fontSize: 18, color: '#DC2626' }} />
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>
                  Card Details
                </Typography>
                <Chip label="Optional" size="small" sx={{ 
                  fontSize: '11px', 
                  height: '22px',
                  backgroundColor: '#F3F4F6',
                  color: '#6B7280',
                }} />
              </FormSectionTitle>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  fullWidth
                  label="Card Last 6 Digits"
                  value={newAccount.card6_digits}
                  onChange={(e) => setNewAccount({ ...newAccount, card6_digits: e.target.value })}
                />
                {newAccount.vendor === 'isracard' && (
                  <TextField
                    fullWidth
                    label="Card Suffixes"
                    value={newAccount.card_suffixes}
                    onChange={(e) => setNewAccount({ ...newAccount, card_suffixes: e.target.value })}
                    placeholder="e.g. 1111, 2222"
                    helperText="Last 4 digits of each card, comma-separated"
                  />
                )}
              </Box>
            </Box>
          )}
        </FormSection>
      </Fade>
    );
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onClose={() => {
          if (isAdding) {
            resetAddForm();
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
          title={isAdding 
            ? (editingAccountId 
                ? "Edit Account" 
                : (addStep === 0 ? "Select Provider" : "Add Account")) 
            : "Accounts Management"
          }
          onClose={() => {
            if (isAdding) {
              resetAddForm();
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
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
            }}>
              ⚠️ {error}
            </div>
          )}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px', flexDirection: 'column', gap: 2 }}>
              <CircularProgress size={32} sx={{ color: '#6366F1' }} />
              <Typography sx={{ color: '#6B7280', fontSize: '14px' }}>Loading accounts...</Typography>
            </Box>
          ) : accounts.length === 0 && !isAdding ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center',
              padding: '48px',
              gap: 2,
            }}>
              <Box sx={{
                width: 64,
                height: 64,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AccountBalanceIcon sx={{ fontSize: 32, color: '#6366F1' }} />
              </Box>
              <Typography sx={{ color: '#6B7280', fontSize: '15px' }}>No saved accounts found</Typography>
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
                  mt: 1,
                  '&:hover': {
                    backgroundColor: '#4F46E5',
                    boxShadow: 'none',
                  },
                }}
              >
                Add Your First Account
              </Button>
            </Box>
          ) : isAdding ? (
            <Box sx={{ 
              p: 1, 
              mt: 1,
            }}>
              {renderAddAccountForm()}

              {addStep === 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2, pt: 2, borderTop: '1px solid #E5E7EB' }}>
                  <Button 
                    onClick={resetAddForm}
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
                    onClick={editingAccountId ? handleSaveEdit : handleAdd}
                    disabled={editingAccountId ? isSaving : false}
                    startIcon={editingAccountId ? (isSaving ? <CircularProgress size={18} color="inherit" /> : <EditIcon />) : <AddIcon />}
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
                    {editingAccountId ? (isSaving ? 'Saving...' : 'Save Changes') : 'Add Account'}
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <Box style={{ maxHeight: '450px', overflow: 'auto', paddingRight: '12px' }}>
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
            additionalTransactionInformation: true,
            cardSuffixes: selectedAccount.card_suffixes
              ? selectedAccount.card_suffixes.split(',').map((s: string) => s.trim()).filter(Boolean)
              : []
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