import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, Box, Typography, IconButton, TextField, Autocomplete } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { formatNumber } from '../utils/formatUtils';
import { dateUtils } from '../utils/dateUtils';
import { useCategories } from '../utils/useCategories';
import { TABLE_HEADER_CELL_STYLE, TABLE_BODY_CELL_STYLE, TABLE_ROW_HOVER_STYLE, TABLE_ROW_HOVER_BACKGROUND } from '../utils/tableStyles';

interface Transaction {
  name: string;
  price: number;
  date: string;
  category: string;
  identifier: string;
  vendor: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onDelete?: (transaction: Transaction) => void;
  onUpdate?: (transaction: Transaction, newPrice: number, newCategory?: string) => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, isLoading, onDelete, onUpdate }) => {
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [editPrice, setEditPrice] = React.useState<string>('');
  const [editCategory, setEditCategory] = React.useState<string>('');
  const { categories: availableCategories } = useCategories();

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditPrice(Math.abs(transaction.price).toString());
    setEditCategory(transaction.category);
  };

  const handleSaveClick = () => {
    if (editingTransaction && editPrice) {
      const newPrice = parseFloat(editPrice);
      if (!isNaN(newPrice)) {
        const priceWithSign = editingTransaction.price < 0 ? -newPrice : newPrice;
        onUpdate?.(editingTransaction, priceWithSign, editCategory);
        setEditingTransaction(null);
      }
    }
  };

  const handleCancelClick = () => {
    setEditingTransaction(null);
  };

  const handleRowClick = (transaction: Transaction) => {
    // If clicking on a different row while editing, save the current changes
    if (editingTransaction && editingTransaction.identifier !== transaction.identifier) {
      handleSaveClick();
    }
  };

  const handleTableClick = (e: React.MouseEvent) => {
    // If clicking on the table background (not on a row), save current changes
    if (editingTransaction && (e.target as HTMLElement).tagName === 'TABLE') {
      handleSaveClick();
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
        <Typography>Loading transactions...</Typography>
      </Box>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
        <Typography>No transactions found</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ 
      width: '100%', 
      overflow: 'hidden', 
      borderRadius: '24px',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(148, 163, 184, 0.2)'
    }}>
      <Table
        onClick={handleTableClick}
      >
        <TableHead>
          <TableRow>
            <TableCell style={TABLE_HEADER_CELL_STYLE}>Description</TableCell>
            <TableCell style={TABLE_HEADER_CELL_STYLE}>Category</TableCell>
            <TableCell align="right" style={TABLE_HEADER_CELL_STYLE}>Amount</TableCell>
            <TableCell style={TABLE_HEADER_CELL_STYLE}>Date</TableCell>
            <TableCell align="right" style={TABLE_HEADER_CELL_STYLE}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction, index) => (
            <TableRow 
              key={index}
              onClick={() => handleRowClick(transaction)}
              style={TABLE_ROW_HOVER_STYLE}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = TABLE_ROW_HOVER_BACKGROUND;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <TableCell style={TABLE_BODY_CELL_STYLE}>
                {transaction.name}
              </TableCell>
              <TableCell style={TABLE_BODY_CELL_STYLE}>
                {editingTransaction?.identifier === transaction.identifier ? (
                  <Autocomplete
                    value={editCategory}
                    onChange={(event, newValue) => setEditCategory(newValue || '')}
                    onInputChange={(event, newInputValue) => setEditCategory(newInputValue)}
                    freeSolo
                    options={availableCategories}
                    size="small"
                    sx={{
                      minWidth: 150,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#e2e8f0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#3b82f6',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#3b82f6',
                        },
                      },
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Enter category..."
                        sx={{
                          '& .MuiInputBase-input': {
                            fontSize: '14px',
                            padding: '8px 12px',
                          },
                        }}
                      />
                    )}
                  />
                ) : (
                  <span
                    style={{
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease-in-out',
                      display: 'inline-block',
                      minWidth: '60px',
                      textAlign: 'center',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      fontWeight: '400',
                      fontSize: '13px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(transaction);
                      handleEditClick(transaction);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {transaction.category}
                  </span>
                )}
              </TableCell>
              <TableCell 
                align="right" 
                style={{ 
                  ...TABLE_BODY_CELL_STYLE,
                  color: transaction.price < 0 ? '#ef4444' : '#10b981',
                  fontWeight: 600
                }}
              >
                {editingTransaction?.identifier === transaction.identifier ? (
                  <TextField
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    size="small"
                    type="number"
                    inputProps={{ 
                      style: { 
                        textAlign: 'right',
                        color: transaction.price < 0 ? '#F87171' : '#4ADE80'
                      } 
                    }}
                    sx={{ 
                      width: '100px',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: transaction.price < 0 ? '#F87171' : '#4ADE80',
                        },
                      },
                    }}
                  />
                ) : (
                  `₪${formatNumber(Math.abs(transaction.price))}`
                )}
              </TableCell>
              <TableCell style={{ ...TABLE_BODY_CELL_STYLE, color: '#64748b' }}>
                {dateUtils.formatDate(transaction.date)}
              </TableCell>
              <TableCell align="right" style={TABLE_BODY_CELL_STYLE}>
                {editingTransaction?.identifier === transaction.identifier ? (
                  <>
                    <IconButton 
                      onClick={handleSaveClick}
                      sx={{ color: '#4ADE80' }}
                    >
                      <CheckIcon />
                    </IconButton>
                    <IconButton 
                      onClick={handleCancelClick}
                      sx={{ color: '#ef4444' }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(transaction);
                        handleEditClick(transaction);
                      }}
                      sx={{ color: '#3b82f6' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(transaction);
                      }}
                      sx={{ color: '#ef4444' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default TransactionsTable; 