import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, TextField, IconButton, Table, TableBody,
  TableCell, TableHead, TableRow, Button, Tooltip, CircularProgress, Tabs, Tab, Fade,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PersonIcon from '@mui/icons-material/Person';
import NumbersIcon from '@mui/icons-material/Numbers';
import BadgeIcon from '@mui/icons-material/Badge';
import { styled } from '@mui/material/styles';
import ScrapeModal from '../ScrapeModal';
import { CREDIT_CARD_VENDORS, BANK_VENDORS, BEINLEUMI_GROUP_VENDORS, STANDARD_BANK_VENDORS } from '../../utils/constants';
import { useNotification } from '../NotificationContext';
import { TABLE_HEADER_CELL_STYLE, TABLE_BODY_CELL_STYLE, TABLE_ROW_HOVER_STYLE, TABLE_ROW_HOVER_BACKGROUND } from '../CategoryDashboard/utils/tableStyles';

const VENDOR_LOGOS: Record<string, string> = {
  isracard: 'isracard.co.il', amex: 'americanexpress.co.il', visacal: 'cal-online.co.il',
  max: 'max.co.il', hapoalim: 'bankhapoalim.co.il', leumi: 'leumi.co.il',
  mizrahi: 'mizrahi-tefahot.co.il', discount: 'discountbank.co.il',
  otsarhahayal: 'fibi.co.il', beinleumi: 'fibi.co.il', massad: 'bankmassad.co.il',
  yahav: 'bank-yahav.co.il', union: 'unionbank.co.il',
};

const VENDOR_DISPLAY_NAMES: Record<string, string> = {
  isracard: 'Isracard', amex: 'American Express', visaCal: 'Visa Cal', max: 'Max',
  hapoalim: 'Bank Hapoalim', leumi: 'Bank Leumi', mizrahi: 'Mizrahi Tefahot',
  discount: 'Discount Bank', otsarHahayal: 'Otsar Hahayal', beinleumi: 'Beinleumi',
  massad: 'Massad', yahav: 'Yahav', union: 'Union Bank',
};

const VENDOR_GROUPS = [
  {
    label: 'Credit Cards',
    icon: <CreditCardIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />,
    vendors: [
      { value: 'isracard', label: 'Isracard' }, { value: 'amex', label: 'American Express' },
      { value: 'visaCal', label: 'Visa Cal' }, { value: 'max', label: 'Max' },
    ]
  },
  {
    label: 'Banks',
    icon: <AccountBalanceIcon sx={{ fontSize: 18, color: '#3b82f6' }} />,
    vendors: [
      { value: 'hapoalim', label: 'Bank Hapoalim' }, { value: 'leumi', label: 'Bank Leumi' },
      { value: 'mizrahi', label: 'Mizrahi Tefahot' }, { value: 'discount', label: 'Discount Bank' },
      { value: 'otsarHahayal', label: 'Otsar Hahayal' }, { value: 'beinleumi', label: 'Beinleumi' },
      { value: 'massad', label: 'Massad' }, { value: 'yahav', label: 'Yahav' },
      { value: 'union', label: 'Union Bank' },
    ]
  }
];

const StyledTableRow = styled(TableRow)({
  transition: 'all 0.2s', '&:nth-of-type(odd)': { backgroundColor: '#F9FAFB' }, '&:hover': { backgroundColor: '#F3F4F6' },
});

const VendorGrid = styled(Box)({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' });
const VendorCard = styled(Box)<{ selected?: boolean }>(({ selected }) => ({
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: '10px 8px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
  border: selected ? '2px solid #6366F1' : '1px solid #E5E7EB',
  background: selected ? 'linear-gradient(135deg, #EEF2FF, #E0E7FF)' : '#FFFFFF',
  '&:hover': { borderColor: '#6366F1', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(99,102,241,0.15)' },
}));

interface Account {
  id: number; vendor: string; username?: string; id_number?: string;
  card6_digits?: string; card_suffixes?: string; bank_account_number?: string;
  nickname?: string; password?: string; created_at: string;
}

const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [addStep, setAddStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({ vendor: '', username: '', password: '', id_number: '', card6_digits: '', nickname: '', bank_account_number: '' });
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const { showNotification } = useNotification();

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/credentials');
      if (response.ok) setAccounts(await response.json());
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleAdd = async () => {
    const response = await fetch('/api/credentials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAccount) });
    if (response.ok) { showNotification('Account added', 'success'); fetchAccounts(); resetForm(); }
  };

  const handleSaveEdit = async () => {
    if (!editingAccountId) return;
    setIsSaving(true);
    const response = await fetch(`/api/credentials/${editingAccountId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAccount) });
    if (response.ok) { showNotification('Account updated', 'success'); fetchAccounts(); resetForm(); }
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this account?')) return;
    const response = await fetch(`/api/credentials/${id}`, { method: 'DELETE' });
    if (response.ok) { showNotification('Account deleted', 'success'); fetchAccounts(); }
  };

  const resetForm = () => {
    setNewAccount({ vendor: '', username: '', password: '', id_number: '', card6_digits: '', nickname: '', bank_account_number: '' });
    setIsAdding(false); setEditingAccountId(null); setAddStep(0);
  };

  const handleEdit = async (account: Account) => {
    const response = await fetch(`/api/credentials/${account.id}`);
    if (response.ok) {
      const data = await response.json();
      setNewAccount({ ...account, password: data.password });
      setEditingAccountId(account.id); setIsAdding(true); setAddStep(1); setTabValue(2);
    }
  };

  const creditAccounts = accounts.filter(a => CREDIT_CARD_VENDORS.includes(a.vendor));
  const bankAccounts = accounts.filter(a => BANK_VENDORS.includes(a.vendor));

  const renderTable = (list: Account[]) => (
    <Box sx={{ width: '100%', mt: 2 }}>
      {/* Table Header */}
      <Box sx={{ 
        display: 'flex', 
        px: 3, 
        py: 1.5, 
        borderBottom: '1px solid #F1F5F9',
        color: '#94A3B8',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        <Box sx={{ flex: 1.5 }}>Description</Box>
        <Box sx={{ flex: 1 }}>User / ID</Box>
        <Box sx={{ flex: 1, textAlign: 'center' }}>Added At</Box>
        <Box sx={{ width: '120px', textAlign: 'right' }}>Actions</Box>
      </Box>

      {/* Table Body */}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {list.map((a) => (
          <Box
            key={a.id}
            onClick={async () => {
              const response = await fetch(`/api/credentials/${a.id}`);
              if (response.ok) {
                const fullAccount = await response.json();
                setSelectedAccount(fullAccount); 
                setIsScrapeModalOpen(true); 
              } else {
                setSelectedAccount(a);
                setIsScrapeModalOpen(true);
              }
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 3,
              py: 2,
              borderBottom: '1px solid #F8FAFC',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              '&:hover': {
                background: '#F8FAFC',
              }
            }}
          >
            {/* Nickname & Provider */}
            <Box sx={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 56, 
                height: 56, 
                borderRadius: '14px', 
                backgroundColor: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden'
              }}>
                <img 
                  src={`/icons/providers/${a.vendor.toLowerCase()}.png?v=${new Date().getTime()}`} 
                  alt="" 
                  style={{ width: '92%', height: '92%', objectFit: 'contain' }} 
                  onError={(e) => { 
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('/icons/providers/')) {
                      target.src = `https://logo.clearbit.com/${VENDOR_LOGOS[a.vendor.toLowerCase()] || 'generic'}`;
                    } else {
                      target.src = 'https://ui-avatars.com/api/?name=' + a.vendor;
                    }
                  }} 
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#1E293B' }}>
                  {a.nickname || VENDOR_DISPLAY_NAMES[a.vendor] || a.vendor}
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>
                  {VENDOR_DISPLAY_NAMES[a.vendor] || a.vendor}
                </Typography>
              </Box>
            </Box>

            {/* Username / ID */}
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
                {a.username || a.id_number || '—'}
              </Typography>
            </Box>

            {/* Added Date */}
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '13px', color: '#94A3B8' }}>
                {new Date(a.created_at).toLocaleDateString()}
              </Typography>
            </Box>

            {/* Actions */}
            <Box sx={{ width: '120px', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Tooltip title="Edit" arrow>
                <IconButton 
                  size="small" 
                  onClick={(e) => { e.stopPropagation(); handleEdit(a); } } 
                  sx={{ color: '#3B82F6', '&:hover': { background: '#EFF6FF' } }}
                >
                  <EditIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete" arrow>
                <IconButton 
                  size="small" 
                  onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }} 
                  sx={{ color: '#EF4444', '&:hover': { background: '#FEF2F2' } }}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const renderAddForm = () => {
    if (addStep === 0) {
      return (
        <Box>
          {VENDOR_GROUPS.map((g, i) => (
            <Box key={g.label} sx={{ mt: i ? 3 : 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>{g.icon}<Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#6B7280', textTransform: 'uppercase' }}>{g.label}</Typography></Box>
              <VendorGrid>
                {g.vendors.map(v => (
                  <VendorCard key={v.value} selected={newAccount.vendor === v.value} onClick={() => { setNewAccount({ ...newAccount, vendor: v.value }); setAddStep(1); }}>
                    <img 
                      src={`/icons/providers/${v.value.toLowerCase()}.png?v=${new Date().getTime()}`} 
                      alt="" 
                      style={{ width: 42, height: 42, marginBottom: 6, borderRadius: '8px' }} 
                      onError={(e) => { 
                        const tgt = e.target as HTMLImageElement;
                        if (tgt.src.includes('/icons/providers/')) {
                          tgt.src = `https://logo.clearbit.com/${VENDOR_LOGOS[v.value.toLowerCase()] || 'generic'}`;
                        } else {
                          tgt.style.display = 'none';
                        }
                      }} 
                    />
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>{v.label}</Typography>
                  </VendorCard>
                ))}
              </VendorGrid>
            </Box>
          ))}
        </Box>
      );
    }
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 1.5,
          mb: 0.5,
          background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
          borderRadius: '12px',
          border: '1px solid #C7D2FE',
        }}>
          <Box sx={{ 
            width: 56, 
            height: 56, 
            borderRadius: '14px', 
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
            boxShadow: '0 8px 16px rgba(0,0,0,0.06)'
          }}>
            <img 
              src={`/icons/providers/${newAccount.vendor?.toLowerCase()}.png?v=${new Date().getTime()}`} 
              alt="" 
              style={{ width: '90%', height: '90%', objectFit: 'contain' }} 
              onError={(e) => { 
                const tgt = e.target as HTMLImageElement;
                if (tgt.src.includes('/icons/providers/')) {
                  tgt.src = `https://logo.clearbit.com/${VENDOR_LOGOS[newAccount.vendor?.toLowerCase() || ''] || 'generic'}`;
                } else {
                  tgt.src = 'https://ui-avatars.com/api/?name=' + newAccount.vendor;
                }
              }} 
            />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#1E1B4B' }}>
              {VENDOR_DISPLAY_NAMES[newAccount.vendor || ''] || newAccount.vendor}
            </Typography>
            <Typography sx={{ fontSize: '13px', color: '#6366F1', fontWeight: 600 }}>
              Configuration Profile
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.8 }}>
          {!STANDARD_BANK_VENDORS.includes(newAccount.vendor || '') && <TextField fullWidth label="User ID" value={newAccount.id_number} onChange={(e) => setNewAccount({ ...newAccount, id_number: e.target.value })} />}
          {(BEINLEUMI_GROUP_VENDORS.includes(newAccount.vendor || '') || (newAccount.vendor !== 'isracard' && newAccount.vendor !== 'amex')) && <TextField fullWidth label="Username" value={newAccount.username} onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })} />}
          <TextField fullWidth label="Password" type="password" value={newAccount.password} onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })} autoComplete="new-password" />
          <TextField fullWidth label="Nickname" value={newAccount.nickname} onChange={(e) => setNewAccount({ ...newAccount, nickname: e.target.value })} />
          {newAccount.vendor === 'isracard' && (
            <>
              <TextField fullWidth label="First 6 Card Digits" value={newAccount.card6_digits} onChange={(e) => setNewAccount({ ...newAccount, card6_digits: e.target.value })} helperText="e.g. 123456" />
              <TextField fullWidth label="Card Suffixes" value={newAccount.card_suffixes} onChange={(e) => setNewAccount({ ...newAccount, card_suffixes: e.target.value })} helperText="Last 4 digits, comma-separated (e.g. 1111, 2222)" />
            </>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: '1px solid #E5E7EB' }}>
          <Button onClick={resetForm} sx={{ color: '#64748b', textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={editingAccountId ? handleSaveEdit : handleAdd}
            sx={{ backgroundColor: '#6366F1', borderRadius: '8px', px: 4, textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { backgroundColor: '#4F46E5' } }}>
            {editingAccountId ? 'Save Changes' : 'Add Account'}
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Accounts</h1>
      <p style={{ color: '#6B7280', margin: '0 0 24px', fontSize: '14px' }}>Manage your bank and credit card connections.</p>

      <Tabs value={tabValue} onChange={(_, v) => { setTabValue(v); if (v !== 2) resetForm(); else { setIsAdding(true); setAddStep(0); } }}
        sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '14px', minHeight: '36px' }, '& .Mui-selected': { fontWeight: 600 }, '& .MuiTabs-indicator': { backgroundColor: '#6366F1' } }}>
        <Tab icon={<CreditCardIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Credit Cards" />
        <Tab icon={<AccountBalanceIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Bank Accounts" />
        <Tab icon={<AddIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={editingAccountId ? "Edit Account" : "Add Account"} />
      </Tabs>

      <Box sx={{ maxWidth: '800px' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress sx={{ color: '#6366F1' }} /></Box>
        ) : tabValue <= 1 ? (
          <>
            {(tabValue === 0 ? creditAccounts : bankAccounts).length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 8, background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <Typography sx={{ color: '#6B7280', mb: 2 }}>No {tabValue === 0 ? 'credit cards' : 'bank accounts'} found</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setTabValue(2); setIsAdding(true); setAddStep(0); }}
                  sx={{ backgroundColor: '#6366F1', borderRadius: '8px', textTransform: 'none', boxShadow: 'none' }}>
                  Add Your First {tabValue === 0 ? 'Card' : 'Bank'}
                </Button>
              </Box>
            ) : renderTable(tabValue === 0 ? creditAccounts : bankAccounts)}
          </>
        ) : (
          <Box sx={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              {(editingAccountId || addStep > 0) && (
                <IconButton 
                  onClick={() => {
                    if (editingAccountId) {
                      const isCredit = CREDIT_CARD_VENDORS.includes(newAccount.vendor || '');
                      resetForm();
                      setTabValue(isCredit ? 0 : 1);
                    } else {
                      setAddStep(0);
                    }
                  }} 
                  size="small" 
                  sx={{ color: '#64748b' }}
                >
                  <ArrowBackIcon sx={{ fontSize: 20 }} />
                </IconButton>
              )}
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                {editingAccountId ? "Update Account" : addStep === 0 ? "Select Provider" : "Configure Connection"}
              </Typography>
            </Box>
            {renderAddForm()}
          </Box>
        )}
      </Box>

      <ScrapeModal
        isOpen={isScrapeModalOpen}
        onClose={() => { setIsScrapeModalOpen(false); setSelectedAccount(null); }}
        initialConfig={selectedAccount ? {
          options: { companyId: selectedAccount.vendor, startDate: new Date(), combineInstallments: false, showBrowser: false, additionalTransactionInformation: true, cardSuffixes: selectedAccount.card_suffixes?.split(',').map(s => s.trim()).filter(Boolean) || [] },
          credentials: { id: selectedAccount.id_number, card6Digits: selectedAccount.card6_digits, password: selectedAccount.password, username: selectedAccount.username, bankAccountNumber: selectedAccount.bank_account_number, nickname: selectedAccount.nickname }
        } : undefined}
      />
    </>
  );
};

export default AccountsPage;
