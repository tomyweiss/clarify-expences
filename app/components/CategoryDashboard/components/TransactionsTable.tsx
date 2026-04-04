import React from 'react';
import { Box, Typography, IconButton, TextField, Autocomplete, Tooltip, Avatar } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { formatNumber, getCurrencySymbol } from '../utils/formatUtils';
import { dateUtils } from '../utils/dateUtils';
import { useCategories } from '../utils/useCategories';

const VENDOR_LOGOS: Record<string, string> = {
  isracard: 'isracard.co.il', amex: 'americanexpress.co.il', visacal: 'cal-online.co.il',
  max: 'max.co.il', hapoalim: 'bankhapoalim.co.il', leumi: 'leumi.co.il',
  mizrahi: 'mizrahi-tefahot.co.il', discount: 'discountbank.co.il',
  otsarhahayal: 'fibi.co.il', beinleumi: 'fibi.co.il', massad: 'bankmassad.co.il',
  yahav: 'bank-yahav.co.il', union: 'unionbank.co.il',
};

interface Transaction {
  name: string;
  price: number;
  date: string;
  category: string;
  identifier: string;
  vendor: string;
  account_number?: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onDelete?: (transaction: Transaction) => void;
  onUpdate?: (transaction: Transaction, newPrice: number, newCategory?: string, newName?: string) => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, isLoading, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editPrice, setEditPrice] = React.useState<string>('');
  const [editCategory, setEditCategory] = React.useState<string>('');
  const [editName, setEditName] = React.useState<string>('');
  const { categories: availableCategories } = useCategories();

  const handleEditClick = (tx: Transaction) => {
    setEditingId(tx.identifier);
    setEditPrice(Math.abs(tx.price).toString());
    setEditCategory(tx.category);
    setEditName(tx.name);
  };

  const handleSaveClick = (tx: Transaction) => {
    if (editingId && editPrice) {
      const newPrice = parseFloat(editPrice);
      if (!isNaN(newPrice)) {
        onUpdate?.(tx, tx.price < 0 ? -newPrice : newPrice, editCategory, editName);
        setEditingId(null);
      }
    }
  };

  if (isLoading) return <Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box>;
  if (!transactions?.length) return <Box sx={{ p: 4, textAlign: 'center', color: '#64748b' }}>No transactions found</Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 150px 120px 100px 90px', 
        px: 3, 
        pb: 1.5, 
        borderBottom: '1px solid rgba(229, 231, 235, 0.5)' 
      }}>
        <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</Typography>
        <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</Typography>
        <Typography align="right" sx={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</Typography>
        <Typography align="right" sx={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</Typography>
        <Typography align="right" sx={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</Typography>
      </Box>

      {/* Rows */}
      {transactions.map((tx) => {
        const isEditing = editingId === tx.identifier;
        const vendorKey = tx.vendor?.toLowerCase().replace(/\s/g, '');
        const logoUrl = VENDOR_LOGOS[vendorKey] ? `https://logo.clearbit.com/${VENDOR_LOGOS[vendorKey]}` : null;

        return (
          <Box
            key={tx.identifier}
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 150px 120px 100px 90px',
              alignItems: 'center',
              px: 3,
              py: 1.5,
              background: isEditing ? '#F8FAFC' : '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: isEditing ? '#6366F1' : 'transparent',
              transition: 'all 0.2s ease',
              cursor: isEditing ? 'default' : 'pointer',
              '&:hover': {
                background: '#F8FAFC',
              }
            }}
            onDoubleClick={() => !isEditing && handleEditClick(tx)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                src={logoUrl || undefined}
                sx={{ 
                  width: 32, 
                  height: 32, 
                  fontSize: '14px', 
                  bgcolor: '#F1F5F9', 
                  color: '#64748b',
                  border: '1px solid #E2E8F0'
                }}
              >
                {tx.name?.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                  <TextField 
                    size="small" 
                    fullWidth 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    variant="standard" 
                    autoFocus 
                    InputProps={{ disableUnderline: true }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        handleSaveClick(tx);
                      }
                    }}
                    sx={{ 
                      '& .MuiInputBase-input': { 
                        fontWeight: 600, 
                        fontSize: '14px', 
                        p: '4px 8px', 
                        bgcolor: '#FFF', 
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0'
                      } 
                    }}
                  />
                ) : (
                  <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.name}
                  </Typography>
                )}
                {!isEditing && (
                  <Typography sx={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {tx.vendor}
                    {tx.account_number && (
                      <>
                        <span style={{ fontSize: '10px', opacity: 0.5 }}>•</span>
                        <span style={{ 
                          fontWeight: 600, 
                          color: '#64748B',
                          background: '#F1F5F9',
                          padding: '0px 4px',
                          borderRadius: '4px',
                          fontSize: '10px'
                        }}>
                          {tx.account_number.slice(-4)}
                        </span>
                      </>
                    )}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box>
              {isEditing ? (
                <Autocomplete
                  size="small"
                  options={availableCategories}
                  value={editCategory}
                  onChange={(_, val) => setEditCategory(val || '')}
                  freeSolo
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      variant="standard" 
                      InputProps={{ ...params.InputProps, disableUnderline: true }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          handleSaveClick(tx);
                        }
                      }}
                      sx={{ 
                        '& .MuiInputBase-input': { 
                          fontSize: '11px', 
                          fontWeight: 700,
                          p: '4px 8px !important', 
                          bgcolor: '#FFF', 
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          textTransform: 'uppercase'
                        } 
                      }}
                    />
                  )}
                />
              ) : (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  color: '#6366F1',
                  textTransform: 'uppercase'
                }}>{tx.category}</span>
              )}
            </Box>

            <Typography align="right" sx={{ 
              fontWeight: 700, 
              fontSize: '15px'
            }}>
              {isEditing ? (
                <TextField 
                  size="small" 
                  type="number" 
                  value={editPrice} 
                  onChange={e => setEditPrice(e.target.value)}
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      handleSaveClick(tx);
                    }
                  }}
                  sx={{ 
                    width: '100px',
                    '& .MuiInputBase-input': { 
                      fontWeight: 700, 
                      fontSize: '15px', 
                      p: '4px 8px', 
                      bgcolor: '#FFF', 
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      textAlign: 'right',
                      color: tx.price < 0 ? '#EF4444' : '#10B981'
                    } 
                  }}
                />
              ) : (
                <span style={{ color: tx.price < 0 ? '#EF4444' : '#10B981' }}>
                  {getCurrencySymbol()}{formatNumber(Math.abs(tx.price))}
                </span>
              )}
            </Typography>

            <Typography align="right" sx={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
              {dateUtils.formatDate(tx.date)}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
              {isEditing ? (
                <>
                  <IconButton size="small" color="success" onClick={() => handleSaveClick(tx)}><CheckIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setEditingId(null)}><CloseIcon fontSize="small" /></IconButton>
                </>
              ) : (
                <>
                  <IconButton size="small" sx={{ color: '#94A3B8', '&:hover': { color: '#6366F1', background: '#EEF2FF' } }} onClick={() => handleEditClick(tx)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444', background: '#FEF2F2' } }} onClick={() => onDelete?.(tx)}><DeleteIcon fontSize="small" /></IconButton>
                </>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default TransactionsTable;