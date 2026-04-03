import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SavingsIcon from '@mui/icons-material/Savings';
import PaidIcon from '@mui/icons-material/Paid';
import { formatNumber, getCurrencySymbol } from '../CategoryDashboard/utils/formatUtils';
import { dateUtils } from '../CategoryDashboard/utils/dateUtils';

interface Saving {
  id: number;
  type: string;
  amount: number;
  currency: string;
  date_created: string;
  institution: string;
  risk_level: string;
  notes: string;
  last_updated: string;
}

interface SavingsTableProps {
  savings: Saving[];
  onEdit: (saving: Saving) => void;
  onDelete: (id: number) => void;
  selectedCurrency: string | null;
  selectedType: string | null;
  onClearFilters: () => void;
}

const SavingsTable: React.FC<SavingsTableProps> = ({ 
  savings, 
  onEdit, 
  onDelete, 
  selectedCurrency, 
  selectedType, 
  onClearFilters 
}) => {
  const [filter, setFilter] = React.useState('');

  const filteredSavings = savings.filter(s => 
    s.institution.toLowerCase().includes(filter.toLowerCase()) ||
    s.type.toLowerCase().includes(filter.toLowerCase()) ||
    s.risk_level.toLowerCase().includes(filter.toLowerCase())
  );

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'נמוך': return '#10B981';
      case 'בינוני-נמוך': return '#34D399';
      case 'בינוני': return '#F59E0B';
      case 'בינוני-גבוה': return '#F87171';
      case 'גבוה': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getInvestmentIcon = (type: string) => {
    switch (type) {
      case 'פיקדון':
        return <AccountBalanceIcon sx={{ fontSize: '18px' }} />;
      case 'קופת גמל להשקעה':
        return <TrendingUpIcon sx={{ fontSize: '18px' }} />;
      case 'קרן השתלמות':
        return <AccountBalanceWalletIcon sx={{ fontSize: '18px' }} />;
      case 'אחר':
        return <PaidIcon sx={{ fontSize: '18px' }} />;
      default:
        return <SavingsIcon sx={{ fontSize: '18px' }} />;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Filter by institution, type, or risk..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ 
              width: '350px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: '#FFF',
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#6366F1' },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8', fontSize: '20px' }} />
                </InputAdornment>
              ),
            }}
          />
          {(selectedCurrency || selectedType) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: '#64748B', fontSize: '13px', fontWeight: 500 }}>
                Filtering by: 
                {selectedCurrency && <Chip label={selectedCurrency} size="small" sx={{ ml: 1, bgcolor: '#EEF2FF', color: '#6366F1', fontWeight: 600 }} />}
                {selectedType && <Chip label={selectedType} size="small" sx={{ ml: 1, bgcolor: '#EEF2FF', color: '#6366F1', fontWeight: 600 }} />}
              </Typography>
            </Box>
          )}
        </Box>
        
        {(selectedCurrency || selectedType || filter) && (
          <Button 
            size="small" 
            onClick={() => {
              onClearFilters();
              setFilter('');
            }}
            sx={{ 
              color: '#6366F1', 
              textTransform: 'none', 
              fontWeight: 600,
              '&:hover': { bgcolor: '#EEF2FF' }
            }}
          >
            Clear all filters
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} sx={{ 
        boxShadow: 'none', 
        border: '1px solid #E2E8F0', 
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ color: '#64748B', fontWeight: 600, width: '22%' }}>Type</TableCell>
              <TableCell sx={{ color: '#64748B', fontWeight: 600, width: '23%' }}>Institution</TableCell>
              <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600, width: '15%' }}>Amount</TableCell>
              <TableCell sx={{ color: '#64748B', fontWeight: 600, width: '18%' }}>Date Created</TableCell>
              <TableCell sx={{ color: '#64748B', fontWeight: 600, width: '15%' }}>Risk Level</TableCell>
              <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600, width: '7%' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSavings.length > 0 ? (
              filteredSavings.map((saving) => (
                <TableRow
                  key={saving.id}
                  onClick={() => onEdit(saving)}
                  sx={{ 
                    '&:hover': { bgcolor: '#F1F5F9' }, 
                    transition: 'background-color 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '8px', 
                        bgcolor: 'rgba(99, 102, 241, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#6366F1'
                      }}>
                        {getInvestmentIcon(saving.type)}
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#1E293B' }}>
                        {saving.type}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '14px', color: '#475569' }}>
                      {saving.institution}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#1E293B' }}>
                      {getCurrencySymbol(saving.currency)}{formatNumber(saving.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '13px', color: '#64748B' }}>
                      {dateUtils.formatDate(saving.date_created)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={saving.risk_level} 
                      size="small" 
                      sx={{ 
                        bgcolor: `${getRiskColor(saving.risk_level)}15`, 
                        color: getRiskColor(saving.risk_level),
                        fontWeight: 700,
                        fontSize: '11px',
                        border: `1px solid ${getRiskColor(saving.risk_level)}30`
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(saving.id);
                          }}
                          sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography sx={{ color: '#94A3B8' }}>No savings found with the current filter.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SavingsTable;
