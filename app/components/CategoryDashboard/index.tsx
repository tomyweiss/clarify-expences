import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TableChartIcon from '@mui/icons-material/TableChart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaidIcon from '@mui/icons-material/Paid';
import SavingsIcon from '@mui/icons-material/Savings';
import SettingsIcon from '@mui/icons-material/Settings';
import RepeatIcon from '@mui/icons-material/Repeat';
import CloseIcon from '@mui/icons-material/Close';
import { 
  Typography, 
  Box, 
  Button, 
  Fade, 
  Container, 
  Grid, 
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  FormControl,
} from '@mui/material';
import { ResponseData, Expense, ModalData } from './types';
import { useCategoryIcons, useCategoryColors } from './utils/categoryUtils';
import Card from './components/Card';
import ExpensesModal from './components/ExpensesModal';
import TransactionsTable from './components/TransactionsTable';
import RecurrentDashboard from '../RecurrentDashboard';

// Unified Control Strip styles
const STRIP_CONTAINER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  background: '#FFFFFF',
  borderRadius: '14px',
  padding: '4px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 6px -1px rgba(0, 0, 0, 0.02)',
  gap: '4px'
};

const STRIP_ITEM_STYLE = {
  height: '36px',
  borderRadius: '10px',
  border: 'none',
  background: 'transparent',
  color: '#475569',
  fontSize: '13px',
  fontWeight: '600',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  padding: '0 12px',
  display: 'flex',
  alignItems: 'center',
  outline: 'none',
  '&:hover': {
    background: '#F8FAFC',
    color: '#1E293B'
  }
};

const STRIP_DIVIDER_STYLE = {
  width: '1px',
  height: '20px',
  background: '#E2E8F0',
  margin: '0 6px'
};

const SELECT_STRIP_STYLE = {
  ...STRIP_ITEM_STYLE,
  appearance: 'none' as const,
  paddingRight: '32px',
  paddingLeft: '12px',
  textAlign: 'right' as const,
  direction: 'rtl' as const,
  position: 'relative' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'left 8px center',
  backgroundSize: '13px',
};

// Helper function to fetch all transactions for a month
const fetchAllTransactions = async (month: string) => {
  const url = new URL("/api/category_expenses", window.location.origin);
  url.searchParams.append("month", month);
  url.searchParams.append("all", "true");
  
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

const CategoryDashboard: React.FC = () => {
  const [allTransactionsForMonth, setAllTransactionsForMonth] = React.useState<any[]>([]);
  const [loadingData, setLoadingData] = React.useState(false);
  const [cardFilter, setCardFilter] = React.useState<string[]>([]);
  const categoryIcons = useCategoryIcons();
  const categoryColors = useCategoryColors();
  const [allAvailableDates, setAllAvailableDates] = React.useState<string[]>([]);
  const [availableCards, setAvailableCards] = React.useState<string[]>([]);

  // Add missing state back
  const [selectedYear, setSelectedYear] = React.useState<string>("");
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [uniqueYears, setUniqueYears] = React.useState<string[]>([]);
  const [uniqueMonths, setUniqueMonths] = React.useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [loadingCategory, setLoadingCategory] = React.useState<string | null>(null);
  const [loadingBankTransactions, setLoadingBankTransactions] = React.useState(false);
  const [modalData, setModalData] = React.useState<ModalData>();
  const [showTransactionsTable, setShowTransactionsTable] = React.useState(false);
  const [recurrentModalOpen, setRecurrentModalOpen] = React.useState(false);

  // Use refs to store current values for the event listener
  const currentYearRef = React.useRef(selectedYear);
  const currentMonthRef = React.useRef(selectedMonth);

  // Update refs when values change
  React.useEffect(() => {
    currentYearRef.current = selectedYear;
    currentMonthRef.current = selectedMonth;
  }, [selectedYear, selectedMonth]);

  const handleDataRefresh = React.useCallback(() => {
    getAvailableMonths(currentYearRef.current, currentMonthRef.current);
  }, []);

  React.useEffect(() => {
    // Inject animation styles
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes elegantFadeInUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .elegant-card-entrance {
          animation: elegantFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `;
      document.head.appendChild(style);
      return () => { document.head.removeChild(style); };
    }
  }, []);

  React.useEffect(() => {
    getAvailableMonths();

    // Add event listener for data refresh
    window.addEventListener('dataRefresh', handleDataRefresh);

    // Cleanup
    return () => {
      window.removeEventListener('dataRefresh', handleDataRefresh);
    };
  }, [handleDataRefresh]);

  React.useEffect(() => {
    // No need to fetchTransactions separately anymore as allData is already synced
  }, [selectedYear, selectedMonth]);

  const getAvailableMonths = async (preserveYear?: string, preserveMonth?: string) => {
    try {
      const response = await fetch("/api/available_months");
      const transactionsData = await response.json();
      setAllAvailableDates(transactionsData);
      
      // Sort dates in descending order to get the most recent first
      const sortedDates = transactionsData.sort((a: string, b: string) => b.localeCompare(a));
      
      if (sortedDates.length === 0) {
        setUniqueYears([]);
        setUniqueMonths([]);
        setSelectedYear("");
        setSelectedMonth("");
        return;
      }

      const lastDate = sortedDates[0];
      const lastYear = lastDate.substring(0, 4);
      const lastMonth = lastDate.substring(5, 7);
      
      const years = Array.from(new Set(transactionsData.map((date: string) => date.substring(0, 4)))) as string[];
      setUniqueYears(years);

      // Keep the user's current selection if it still exists in the data, otherwise fall back to most recent
      const yearToSelect = preserveYear && years.includes(preserveYear) ? preserveYear : lastYear;
      setSelectedYear(yearToSelect);

      const monthsForYear = transactionsData
        .filter((date: string) => date.startsWith(yearToSelect))
        .map((date: string) => date.substring(5, 7));
      
      const months = Array.from(new Set(monthsForYear)) as string[];
      const monthToSelect = preserveMonth && months.includes(preserveMonth) ? preserveMonth : lastMonth;

      setUniqueMonths(months);
      setSelectedMonth(monthToSelect);

      fetchData(`${yearToSelect}-${monthToSelect}`);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = event.target.value;
    setSelectedYear(newYear);

    // Update available months for the selected year
    const monthsForYear = allAvailableDates
      .filter((date: string) => date.startsWith(newYear))
      .map((date: string) => date.substring(5, 7));
    
    const uniqueMonthsForYear = Array.from(new Set(monthsForYear)) as string[];
    setUniqueMonths(uniqueMonthsForYear);
    
    // If current month is not available in new year, select the first available month
    if (!uniqueMonthsForYear.includes(selectedMonth)) {
      setSelectedMonth(uniqueMonthsForYear[0]);
      fetchData(`${newYear}-${uniqueMonthsForYear[0]}`);
    } else {
      fetchData(`${newYear}-${selectedMonth}`);
    }
  };

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = event.target.value;
    setSelectedMonth(newMonth);
    fetchData(`${selectedYear}-${newMonth}`);
  };


  const fetchData = async (month: string) => {
    setLoadingData(true);
    try {
      // Single source of truth: Fetch all transactions (including recurrent)
      const allTransactions = await fetchAllTransactions(month);
      setAllTransactionsForMonth(allTransactions);

      // Extract unique cards for the month as "Vendor (Digits)"
      const cardLabels = Array.from(new Set(allTransactions
        .filter((tx: any) => tx.account_number && tx.account_number.trim() !== '')
        .map((tx: any) => `${tx.vendor || 'Unknown'} (${tx.account_number})`)
      )) as string[];
      setAvailableCards(cardLabels.sort());
      
      // Clear filters not available in current month
      setCardFilter(prev => prev.filter(c => cardLabels.includes(c)));

    } catch (error) {
      console.error("Error fetching data:", error);
      setAllTransactionsForMonth([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Derive all dashboard metrics client-side from the single source of truth
  const filteredTransactions = React.useMemo(() => {
    return allTransactionsForMonth.filter(tx => 
      cardFilter.length === 0 || 
      (tx.account_number && cardFilter.includes(`${tx.vendor || 'Unknown'} (${tx.account_number})`))
    );
  }, [allTransactionsForMonth, cardFilter]);

  const sumPerCategory = React.useMemo(() => {
    const groups: Record<string, number> = {};
    filteredTransactions
      .filter(tx => tx.category !== 'Bank' && tx.category !== 'Income')
      .forEach(tx => {
        const cat = tx.category || 'Uncategorized';
        groups[cat] = (groups[cat] || 0) + Math.abs(tx.price);
      });
    
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const { bankTransactions, creditCardTransactions } = React.useMemo(() => {
    // Calculate total income: Bank category with positive values
    const income = filteredTransactions
      .filter((tx: any) => tx.category === 'Bank' && tx.price > 0)
      .reduce((acc: number, tx: any) => acc + tx.price, 0);
    
    // Calculate total bank expenses: Bank category with negative values
    const bankExpenses = filteredTransactions
      .filter((tx: any) => tx.category === 'Bank' && tx.price < 0)
      .reduce((acc: number, tx: any) => acc + Math.abs(tx.price), 0);
    
    // Calculate credit card expenses: All transactions excluding Bank and Income categories
    const cardExpenses = filteredTransactions
      .filter((tx: any) => tx.category !== 'Bank' && tx.category !== 'Income')
      .reduce((acc: number, tx: any) => acc + Math.abs(tx.price), 0);

    return {
      bankTransactions: { income, expenses: bankExpenses },
      creditCardTransactions: cardExpenses
    };
  }, [filteredTransactions]);
  
  const transactions = filteredTransactions; // Alias for the table
  const loadingTransactions = loadingData; // Alias for the table loading
  
  const categories = sumPerCategory
    .map((item) => {
      return {
        name: item.name,
        value: item.value,
        color: categoryColors[item.name] || '#94a3b8',
        icon: categoryIcons[item.name] || MonetizationOnIcon
      };
    })
    .sort((a, b) => b.value - a.value);

  const handleBankTransactionsClick = async () => {
    setLoadingBankTransactions(true);
    try {
      const fullMonth = `${selectedYear}-${selectedMonth}`;
      const allTransactions = await fetchAllTransactions(fullMonth);
      
      // Filter for Bank category transactions (both positive and negative)
      const bankTransactions = allTransactions.filter((transaction: any) => 
        transaction.category === 'Bank'
      );
      
      // Format the data correctly - include identifier and vendor for editing/deleting
      setModalData({
        type: "Bank Transactions",
        data: bankTransactions.map((transaction: any) => ({
          name: transaction.name,
          price: transaction.price,
          date: transaction.date,
          category: transaction.category,
          identifier: transaction.identifier,
          vendor: transaction.vendor,
          account_number: transaction.account_number
        }))
      });
      
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching bank transactions data:", error);
    } finally {
      setLoadingBankTransactions(false);
    }
  };

  const handleTotalCreditCardExpensesClick = async () => {
    setLoadingBankTransactions(true);
    try {
      const fullMonth = `${selectedYear}-${selectedMonth}`;
      const allExpensesData = await fetchAllTransactions(fullMonth);

      // Match the "Total Expenses" card: non-Income spending including bank debits
      // (card = non-Bank/non-Income amounts + Bank outflows where price < 0)
      const totalExpenseRows = allExpensesData.filter((transaction: any) => {
        if (transaction.category === 'Income') return false;
        if (transaction.category === 'Bank') return transaction.price < 0;
        return true;
      });

      // Format the data correctly - include identifier and vendor for editing/deleting
      setModalData({
        type: "Total Expenses",
        data: totalExpenseRows.map((transaction: any) => ({
          name: transaction.name,
          price: transaction.price,
          date: transaction.date,
          category: transaction.category,
          identifier: transaction.identifier,
          vendor: transaction.vendor,
          account_number: transaction.account_number
        }))
      });

      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching credit card expenses data:", error);
    } finally {
      setLoadingBankTransactions(false);
    }
  };

  const handleCategoryClick = async (category: string) => {
    setLoadingCategory(category);
    try {
      // Use the same source as the tiles (respects card filter) instead of a category-only API fetch
      const rows = filteredTransactions
        .filter((tx: any) => {
          if (tx.category === 'Bank' || tx.category === 'Income') return false;
          const cat = tx.category || 'Uncategorized';
          return cat === category;
        })
        .slice()
        .sort((a: any, b: any) => {
          const ta = new Date(a.date).getTime();
          const tb = new Date(b.date).getTime();
          return tb - ta;
        })
        .map((transaction: any) => ({
          name: transaction.name,
          price: transaction.price,
          date: transaction.date,
          category: transaction.category,
          identifier: transaction.identifier,
          vendor: transaction.vendor,
          account_number: transaction.account_number
        }));

      setModalData({
        type: category,
        data: rows,
      });

      setIsModalOpen(true);
    } catch (error) {
      console.error("Error opening category expenses:", error);
    } finally {
      setLoadingCategory(null);
    }
  };

  const handleTransactionsTableClick = async () => {
    setShowTransactionsTable(!showTransactionsTable);
  };

  const fetchTransactions = async () => {
    // This is now handled by fetchData which syncs allTransactionsForMonth
  };

  const handleDeleteTransaction = async (transaction: any) => {
    try {
      const response = await fetch(`/api/transactions/${transaction.identifier}|${transaction.vendor}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Refresh the data to update the metrics and table
        fetchData(`${selectedYear}-${selectedMonth}`);
      } else {
        throw new Error('Failed to delete transaction');
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleUpdateTransaction = async (transaction: any, newPrice: number, newCategory?: string, newName?: string) => {
    try {
      const updateData: any = { price: newPrice };
      if (newCategory !== undefined) {
        updateData.category = newCategory;
      }
      if (newName !== undefined) {
        updateData.name = newName;
      }

      const response = await fetch(`/api/transactions/${transaction.identifier}|${transaction.vendor}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (response.ok) {
        // Refresh the data to update the metrics and table
        fetchData(`${selectedYear}-${selectedMonth}`);
      } else {
        throw new Error('Failed to update transaction');
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      position: 'relative',
      background: '#F5F5F5',
      overflow: 'hidden',
      fontSize: '14px'
    }}>
      
      {/* Main content container */}
      <div style={{ 
        padding: '32px 40px',
        maxWidth: '1400px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>

      {allAvailableDates.length === 0 ? (
        <Fade in={true} timeout={800}>
          <Box sx={{ 
            mt: 8,
            p: 8, 
            borderRadius: '32px', 
            bgcolor: '#FFF', 
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            textAlign: 'center',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
            minHeight: '450px'
          }}>
            <Box sx={{ 
              width: 100, 
              height: 100, 
              borderRadius: '28px', 
              bgcolor: 'rgba(99, 102, 241, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6366F1',
              mb: 1
            }}>
              <MonetizationOnIcon sx={{ fontSize: '50px' }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 800, 
                fontFamily: "'Outfit', sans-serif", 
                color: '#1E293B',
                mb: 1,
                letterSpacing: '-0.02em',
                fontSize: '1.5rem'
              }}>
                Welcome to Finance
              </Typography>
              <Typography sx={{ color: '#64748B', maxWidth: '450px', mx: 'auto', lineHeight: 1.6, fontSize: '14px' }}>
                Go to the <strong>Management</strong> tab to connect your bank accounts or upload transactions and start tracking your income and expenses.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button
                variant="contained"
                onClick={() => window.dispatchEvent(new CustomEvent('openManagement'))}
                startIcon={<SettingsIcon />}
                sx={{ 
                  bgcolor: '#6366F1', 
                  '&:hover': { bgcolor: '#4F46E5' },
                  borderRadius: '12px',
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '14px'
                }}
              >
                Go to Management
              </Button>
            </Box>
          </Box>
        </Fade>
      ) : (
        <>
          {/* Hero Section */}
          <div style={{
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '24px',
              paddingBottom: '24px',
              borderBottom: '1px solid rgba(229, 231, 235, 0.5)'
            }}>
              <div>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: 0,
                  color: '#111827'
                }}>Finance</h1>
              </div>
              <div style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center'
              }}>
              <div style={STRIP_CONTAINER_STYLE}>
                {/* View Actions Group (Table / Repeat) */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Tooltip title={showTransactionsTable ? "Hide Transactions Table" : "Show Transactions Table"} arrow>
                    <IconButton
                      onClick={handleTransactionsTableClick}
                      disableRipple
                      sx={{
                        ...STRIP_ITEM_STYLE,
                        width: '36px',
                        padding: 0,
                        bgcolor: showTransactionsTable ? '#6366F1 !important' : 'transparent',
                        color: showTransactionsTable ? '#FFFFFF !important' : '#475569',
                        '&:hover': {
                          bgcolor: showTransactionsTable ? '#4F46E5 !important' : '#F1F5F9'
                        }
                      }}
                    >
                      <TableChartIcon sx={{ fontSize: '18px' }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Recurrent Transactions" arrow>
                    <IconButton
                      onClick={() => setRecurrentModalOpen(true)}
                      disableRipple
                      sx={{ 
                        ...STRIP_ITEM_STYLE,
                        width: '36px',
                        padding: 0,
                        '&:hover': { bgcolor: '#F1F5F9' }
                      }}
                    >
                      <RepeatIcon sx={{ fontSize: '18px' }} />
                    </IconButton>
                  </Tooltip>
                </div>

                <div style={STRIP_DIVIDER_STYLE} />

                {/* Search / Filter Group (Card Dropdown) */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <CreditCardIcon sx={{ 
                    position: 'absolute', 
                    left: '12px', 
                    zIndex: 1,
                    fontSize: '16px', 
                    color: cardFilter.length > 0 ? '#6366F1' : '#94A3B8',
                    transition: 'color 0.2s',
                    pointerEvents: 'none'
                  }} />
                  
                  <Select
                    multiple
                    displayEmpty
                    value={cardFilter}
                    onChange={(e) => setCardFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                    renderValue={(selected) => {
                      if (selected.length === 0) {
                        return <span style={{ color: '#94A3B8', fontWeight: 500 }}>Cards</span>;
                      }
                      if (selected.length === 1) {
                        return <span style={{ color: '#111827', fontWeight: 700, fontSize: '12px' }}>{selected[0]}</span>;
                      }
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#111827', fontWeight: 700 }}>{selected.length}</span>
                          <span style={{ color: '#64748B', fontSize: '11px' }}>Cards</span>
                        </div>
                      );
                    }}
                    sx={{
                      ...STRIP_ITEM_STYLE,
                      paddingLeft: '38px',
                      paddingRight: cardFilter.length > 0 ? '30px' : '32px',
                      width: '180px',
                      '& .MuiSelect-select': {
                        padding: 0,
                        paddingRight: '0 !important',
                        display: 'flex',
                        alignItems: 'center'
                      },
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      '& .MuiSvgIcon-root': { 
                        fontSize: '16px', 
                        right: cardFilter.length > 0 ? '24px' : '8px',
                        color: '#94A3B8'
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          mt: 1,
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          '& .MuiMenuItem-root': {
                            fontSize: '13px',
                            fontWeight: 500,
                            py: 1,
                            '&.Mui-selected': { bgcolor: '#F1F5F9' },
                            '&:hover': { bgcolor: '#F8FAFC' }
                          }
                        }
                      }
                    }}
                  >
                    {availableCards.length === 0 ? (
                      <MenuItem disabled value="">
                        <Typography variant="body2" sx={{ color: '#94A3B8' }}>No cards found</Typography>
                      </MenuItem>
                    ) : (
                      availableCards.map((card) => (
                        <MenuItem key={card} value={card}>
                          <Checkbox checked={cardFilter.includes(card)} size="small" sx={{ color: '#E2E8F0', '&.Mui-checked': { color: '#6366F1' } }} />
                          <ListItemText primary={card} />
                        </MenuItem>
                      ))
                    )}
                  </Select>

                  {cardFilter.length > 0 && (
                    <IconButton
                      onClick={() => setCardFilter([])}
                      size="small"
                      sx={{
                        position: 'absolute',
                        right: '6px',
                        padding: '4px',
                        zIndex: 2,
                        color: '#94A3B8',
                        '&:hover': { color: '#64748B' }
                      }}
                    >
                      <CloseIcon sx={{ fontSize: '14px' }} />
                    </IconButton>
                  )}
                </div>

                <div style={STRIP_DIVIDER_STYLE} />

                {/* Time Selection Group (Date Picker) */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <select 
                    value={selectedYear}
                    onChange={handleYearChange}
                    style={{ ...SELECT_STRIP_STYLE, minWidth: '85px' }}
                  >
                    {uniqueYears.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <select 
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    style={{ ...SELECT_STRIP_STYLE, minWidth: '110px' }}
                  >
                    {uniqueMonths.map((month) => (
                      <option key={month} value={month}>
                        {new Date(`2024-${month}-01`).toLocaleDateString('default', { month: 'short' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Summary Cards Section */}
          <div style={{ 
            display: 'flex',
            gap: '24px',
            marginTop: '32px',
            marginBottom: '32px'
          }}>
            <div className="elegant-card-entrance" style={{ flex: 1, animationDelay: '0.1s' }}>
              <Card
                title="Overview & Balance" 
                value={bankTransactions.income}
                color="#4ADE80"
                icon={MonetizationOnIcon}
                onClick={handleBankTransactionsClick}
                isLoading={loadingBankTransactions}
                size="medium"
                secondaryValue={bankTransactions.expenses}
                secondaryColor="#F87171"
                secondaryLabel="Expenses"
                layout="split"
              />
            </div>
            <div className="elegant-card-entrance" style={{ flex: 1, animationDelay: '0.2s' }}>
              <Card 
                title="Total Expenses" 
                value={creditCardTransactions + (bankTransactions.expenses || 0)} 
                color="#3B82F6"
                icon={CreditCardIcon}
                onClick={handleTotalCreditCardExpensesClick}
                isLoading={loadingBankTransactions}
                size="medium"
                secondaryValue={creditCardTransactions}
                secondaryLabel="Card"
                secondaryColor="#6366F1"
                layout="split"
              />
            </div>
          </div>

          {showTransactionsTable ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <TransactionsTable 
                transactions={transactions} 
                isLoading={loadingTransactions}
                onDelete={handleDeleteTransaction}
                onUpdate={handleUpdateTransaction}
              />
            </div>
          ) : (
            <>
              <div style={{
                marginBottom: '40px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '16px'
              }}>
                <div style={{ 
                  height: '1px', 
                  flex: 1, 
                  background: 'linear-gradient(to right, transparent, rgba(229, 231, 235, 0.8))',
                }} />
                <h2 style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  margin: 0,
                  color: '#94A3B8',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  padding: '0 8px'
                }}>Expense Categories</h2>
                <div style={{ 
                  height: '1px', 
                  flex: 1, 
                  background: 'linear-gradient(to left, transparent, rgba(229, 231, 235, 0.8))',
                }} />
              </div>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {categories.length > 0 ? (
                  categories.map((category, index) => (
                    <div 
                      key={"category-container-" + index} 
                      className="elegant-card-entrance" 
                      style={{ animationDelay: `${0.3 + (index * 0.05)}s` }}
                    >
                      <Card
                        key={"category-" + index}
                        title={category.name}
                        value={category.value}
                        color={category.color}
                        icon={category.icon}
                        onClick={() => handleCategoryClick(category.name)}
                        isLoading={loadingCategory === category.name}
                        size="medium"
                      />
                    </div>
                  ))
                ) : (
                  <Fade in={true} timeout={500}>
                    <Box sx={{
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      p: 8,
                      bgcolor: '#FFFFFF',
                      borderRadius: '24px',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: '16px', 
                        bgcolor: '#F8FAFC', 
                        color: '#CBD5E1',
                        mb: 1
                      }}>
                        <TableChartIcon sx={{ fontSize: '40px' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.5, fontSize: '1rem' }}>
                          No transactions found
                        </Typography>
                        <Typography sx={{ color: '#64748B', maxWidth: '300px', fontSize: '13px' }}>
                          There are no recorded transactions for {new Date(`${selectedYear}-${selectedMonth}-01`).toLocaleDateString('default', { month: 'long', year: 'numeric' })}.
                        </Typography>
                      </Box>
                    </Box>
                  </Fade>
                )}
              </div>
            </>
          )}
        </>
      )}
      </div>

      {modalData && (
        <ExpensesModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={modalData}
          color={categoryColors[modalData?.type || ''] || '#94a3b8'}
          setModalData={setModalData}
          currentMonth={`${selectedYear}-${selectedMonth}`}
        />
      )}

      <Dialog 
        open={recurrentModalOpen} 
        onClose={() => setRecurrentModalOpen(false)}
        disableRestoreFocus
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '24px', p: 1 }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            aria-label="close"
            onClick={() => setRecurrentModalOpen(false)}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: -4 }}>
          <RecurrentDashboard />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryDashboard;