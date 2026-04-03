import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  Chip,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatNumber, getCurrencySymbol } from '../CategoryDashboard/utils/formatUtils';
import RepeatIcon from '@mui/icons-material/Repeat';

interface RecurrentTableProps {
  transactions: any[];
  onEdit: (transaction: any) => void;
  onDelete: (id: number) => void;
}

const RecurrentTable: React.FC<RecurrentTableProps> = ({ transactions, onEdit, onDelete }) => {
  if (transactions.length === 0) {
    return null;
  }

  return (
    <TableContainer component={Paper} sx={{ 
      borderRadius: '20px', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      border: '1px solid #E2E8F0',
      overflow: 'hidden'
    }}>
      <Table sx={{ minWidth: 650 }} aria-label="recurrent transactions table">
        <TableHead sx={{ bgcolor: '#F8FAFC' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Description</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Amount</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Start Date</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>End Date</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((row) => (
            <TableRow
              key={row.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#F1F5F9' } }}
            >
              <TableCell component="th" scope="row">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: '8px', 
                    bgcolor: 'rgba(99, 102, 241, 0.08)',
                    color: '#6366F1',
                    display: 'flex'
                  }}>
                    <RepeatIcon fontSize="small" />
                  </Box>
                  <Typography sx={{ fontWeight: 600, color: '#1E293B', fontSize: '14px' }}>
                    {row.name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip 
                  label={row.category || 'Uncategorized'} 
                  size="small" 
                  sx={{ 
                    bgcolor: '#F1F5F9', 
                    color: '#475569', 
                    fontWeight: 600,
                    fontSize: '11px'
                  }} 
                />
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700, color: row.type === 'income' ? '#059669' : '#DC2626', fontSize: '14px' }}>
                  {getCurrencySymbol('ILS')}{formatNumber(row.amount)}
                </Typography>
              </TableCell>
              <TableCell sx={{ color: '#64748B', fontSize: '13px' }}>
                {new Date(row.start_date).toLocaleDateString('he-IL', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              </TableCell>
              <TableCell sx={{ color: '#64748B', fontSize: '13px' }}>
                {row.end_date 
                  ? new Date(row.end_date).toLocaleDateString('he-IL', { year: 'numeric', month: '2-digit', day: '2-digit' })
                  : <Typography sx={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>No end date</Typography>
                }
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit(row)} sx={{ color: '#6366F1' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => onDelete(row.id)} sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RecurrentTable;
