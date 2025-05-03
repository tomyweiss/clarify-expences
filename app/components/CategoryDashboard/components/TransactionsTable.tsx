import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  IconButton,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { formatNumber } from '../utils/formatUtils';

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
  onUpdate?: (transaction: Transaction, newPrice: number) => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, isLoading, onDelete, onUpdate }) => {
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [editPrice, setEditPrice] = React.useState<string>('');

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditPrice(Math.abs(transaction.price).toString());
  };

  const handleSaveClick = () => {
    if (editingTransaction && editPrice) {
      const newPrice = parseFloat(editPrice);
      if (!isNaN(newPrice)) {
        const priceWithSign = editingTransaction.price < 0 ? -newPrice : newPrice;
        onUpdate?.(editingTransaction, priceWithSign);
        setEditingTransaction(null);
      }
    }
  };

  const handleCancelClick = () => {
    setEditingTransaction(null);
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
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '16px' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell style={{ color: '#555', borderBottom: '1px solid #e2e8f0' }}>Date</TableCell>
            <TableCell style={{ color: '#555', borderBottom: '1px solid #e2e8f0' }}>Description</TableCell>
            <TableCell style={{ color: '#555', borderBottom: '1px solid #e2e8f0' }}>Category</TableCell>
            <TableCell align="right" style={{ color: '#555', borderBottom: '1px solid #e2e8f0' }}>Amount</TableCell>
            <TableCell align="right" style={{ color: '#555', borderBottom: '1px solid #e2e8f0' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction, index) => (
            <TableRow key={index}>
              <TableCell style={{ color: '#333', borderBottom: '1px solid #e2e8f0' }}>
                {new Date(transaction.date).toLocaleDateString()}
              </TableCell>
              <TableCell style={{ color: '#333', borderBottom: '1px solid #e2e8f0' }}>
                {transaction.name}
              </TableCell>
              <TableCell style={{ color: '#333', borderBottom: '1px solid #e2e8f0' }}>
                {transaction.category}
              </TableCell>
              <TableCell 
                align="right" 
                style={{ 
                  color: transaction.price < 0 ? '#F87171' : '#4ADE80',
                  borderBottom: '1px solid #e2e8f0'
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
              <TableCell align="right" style={{ borderBottom: '1px solid #e2e8f0' }}>
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
                      onClick={() => handleEditClick(transaction)}
                      sx={{ color: '#3b82f6' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => onDelete?.(transaction)}
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