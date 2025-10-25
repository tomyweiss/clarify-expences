import React from 'react';
import IconButton from '@mui/material/IconButton';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TableChartIcon from '@mui/icons-material/TableChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ResponseData, Expense, ModalData } from './types';
import { useCategoryIcons, useCategoryColors } from './utils/categoryUtils';
import Card from './components/Card';
import ExpensesModal from './components/ExpensesModal';
import TransactionsTable from './components/TransactionsTable';

// Common styles
const BUTTON_STYLE = {
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  padding: '14px',
  borderRadius: '16px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  color: '#475569',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
};

const HOVER_BUTTON_STYLE = {
  transform: 'translateY(-2px) scale(1.05)',
  boxShadow: '0 8px 24px rgba(96, 165, 250, 0.3)',
  background: 'rgba(96, 165, 250, 0.15)',
  color: '#3b82f6'
};

const SELECT_STYLE = {
  padding: '14px 28px',
  borderRadius: '16px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  color: '#1e293b',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  outline: 'none',
  textAlign: 'right' as const,
  direction: 'rtl' as const,
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
  const [sumPerCategory, setSumPerCategory] = React.useState<ResponseData[]>([]);
  const [selectedYear, setSelectedYear] = React.useState<string>("");
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [uniqueYears, setUniqueYears] = React.useState<string[]>([]);
  const [uniqueMonths, setUniqueMonths] = React.useState<string[]>([]);
  const [bankTransactions, setBankTransactions] = React.useState({ income: 0, expenses: 0 });
  const [creditCardTransactions, setCreditCardTransactions] = React.useState(0);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [loadingCategory, setLoadingCategory] = React.useState<string | null>(null);
  const [loadingBankTransactions, setLoadingBankTransactions] = React.useState(false);
  const [modalData, setModalData] = React.useState<ModalData>();
  const [showTransactionsTable, setShowTransactionsTable] = React.useState(false);
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = React.useState(false);
  const categoryIcons = useCategoryIcons();
  const categoryColors = useCategoryColors();
  const [allAvailableDates, setAllAvailableDates] = React.useState<string[]>([]);

  // Use refs to store current values for the event listener
  const currentYearRef = React.useRef(selectedYear);
  const currentMonthRef = React.useRef(selectedMonth);

  // Update refs when values change
  React.useEffect(() => {
    currentYearRef.current = selectedYear;
    currentMonthRef.current = selectedMonth;
  }, [selectedYear, selectedMonth]);

  const handleDataRefresh = React.useCallback(() => {
    if (currentYearRef.current && currentMonthRef.current) {
      setTimeout(() => {
        fetchData(`${currentYearRef.current}-${currentMonthRef.current}`);
      }, 0);
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
  }, []);

  React.useEffect(() => {
    if (showTransactionsTable) {
      fetchTransactions();
    }
  }, [selectedYear, selectedMonth]);

  const getAvailableMonths = async () => {
    try {
      const response = await fetch("/api/available_months");
      const transactionsData = await response.json();
      setAllAvailableDates(transactionsData);
      
      // Sort dates in descending order to get the most recent first
      const sortedDates = transactionsData.sort((a: string, b: string) => b.localeCompare(a));
      const lastDate = sortedDates[0];
      
      const years = Array.from(new Set(transactionsData.map((date: string) => date.substring(0, 4)))) as string[];
      const lastYear = lastDate.substring(0, 4);
      
      setUniqueYears(years);
      setSelectedYear(lastYear);

      // Get months for the last year
      const monthsForLastYear = transactionsData
        .filter((date: string) => date.startsWith(lastYear))
        .map((date: string) => date.substring(5, 7));
      
      const months = Array.from(new Set(monthsForLastYear)) as string[];
      const lastMonth = lastDate.substring(5, 7);
      
      setUniqueMonths(months);
      setSelectedMonth(lastMonth);

      // Fetch data for initial selection
      fetchData(`${lastYear}-${lastMonth}`);
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

  const handleRefreshClick = () => {
    if (selectedYear && selectedMonth) {
      const currentMonth = `${selectedYear}-${selectedMonth}`;
      fetchData(currentMonth);
      if (showTransactionsTable) {
        fetchTransactions();
      }
    }
  };

  const fetchData = async (month: string) => {
    try {
      const url = new URL("/api/month_by_categories", window.location.origin);
      url.searchParams.append("month", month);

      const response = await fetch(url.toString(), {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSumPerCategory(data);
      
      // Fetch all transactions to calculate income and expenses properly
      const allTransactions = await fetchAllTransactions(month);
      
      // Calculate total income: Bank category with positive values
      const totalIncome = allTransactions
        .filter((transaction: any) => transaction.category === 'Bank' && transaction.price > 0)
        .reduce((acc: number, transaction: any) => acc + transaction.price, 0);
      
      // Calculate total expenses: All negative values
      const totalExpenses = allTransactions
        .filter((transaction: any) => transaction.category === 'Bank' && transaction.price < 0)
        .reduce((acc: number, transaction: any) => acc + Math.abs(transaction.price), 0);
      
      // Calculate credit card expenses: All transactions excluding Bank and Income categories
      const creditCardExpenses = allTransactions
        .filter((transaction: any) => transaction.category !== 'Bank' && transaction.category !== 'Income')
        .reduce((acc: number, transaction: any) => acc + Math.abs(transaction.price), 0);
      
      setBankTransactions({ income: totalIncome, expenses: totalExpenses });
      setCreditCardTransactions(creditCardExpenses);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Reset states in case of error
      setSumPerCategory([]);
      setBankTransactions({ income: 0, expenses: 0 });
      setCreditCardTransactions(0);
    }
  };
  
  const categories = sumPerCategory.map((item) => {
    return {
      name: item.name,
      value: item.value,
      color: categoryColors[item.name] || '#94a3b8',
      icon: categoryIcons[item.name] || MonetizationOnIcon
    };
  });

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
          vendor: transaction.vendor
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
      
      // Filter out 'Bank' and 'Income' category transactions to get credit card expenses
      const creditCardData = allExpensesData.filter((transaction: any) => 
        transaction.category !== 'Bank' && transaction.category !== 'Income'
      );
      
      // Format the data correctly - include identifier and vendor for editing/deleting
      setModalData({
        type: "Credit Card Expenses",
        data: creditCardData.map((transaction: any) => ({
          name: transaction.name,
          price: transaction.price,
          date: transaction.date,
          category: transaction.category,
          identifier: transaction.identifier,
          vendor: transaction.vendor
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
    try {
      setLoadingCategory(category);
      const url = new URL("/api/category_expenses", window.location.origin);
      const params = new URLSearchParams();
      const fullMonth = `${selectedYear}-${selectedMonth}`;
      params.append("month", fullMonth);
      params.append("category", category);
      url.search = params.toString();

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      setModalData({
        type: category,
        data: data,
      });

      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching category expenses:", error);
    } finally {
      setLoadingCategory(null);
    }
  };

  const handleTransactionsTableClick = async () => {
    const newShowTransactionsTable = !showTransactionsTable;
    setShowTransactionsTable(newShowTransactionsTable);
    if (!newShowTransactionsTable){
      return;
    }

    fetchTransactions();
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const fullMonth = `${selectedYear}-${selectedMonth}`;
      const transactionsData = await fetchAllTransactions(fullMonth);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error fetching transactions data:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleDeleteTransaction = async (transaction: any) => {
    try {
      const response = await fetch(`/api/transactions/${transaction.identifier}|${transaction.vendor}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the transaction from the local state
        setTransactions(transactions.filter(t => 
          t.identifier !== transaction.identifier || t.vendor !== transaction.vendor
        ));
        // Refresh the data to update the metrics
        fetchData(`${selectedYear}-${selectedMonth}`);
      } else {
        throw new Error('Failed to delete transaction');
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleUpdateTransaction = async (transaction: any, newPrice: number, newCategory?: string) => {
    try {
      const updateData: any = { price: newPrice };
      if (newCategory !== undefined) {
        updateData.category = newCategory;
      }

      const response = await fetch(`/api/transactions/${transaction.identifier}|${transaction.vendor}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (response.ok) {
        // Update the transaction in the local state
        setTransactions(transactions.map(t => 
          t.identifier === transaction.identifier && t.vendor === transaction.vendor
            ? { ...t, price: newPrice, ...(newCategory !== undefined && { category: newCategory }) }
            : t
        ));
        // Refresh the data to update the metrics
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
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(96, 165, 250, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 20s ease-in-out infinite',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(167, 139, 250, 0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 25s ease-in-out infinite reverse',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '20%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 30s ease-in-out infinite',
        zIndex: 0
      }} />
      
      {/* Main content container */}
      <div style={{ 
        padding: '24px 16px',
        maxWidth: '1440px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>

      {/* Hero Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '32px',
        padding: '36px',
        marginBottom: '90px',
        marginTop: '40px',
        marginLeft: '24px',
        marginRight: '24px',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '300px',
          height: '300px',  
          background: 'radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
          zIndex: 0
        }} />
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Financial Overview</h1>
          </div>
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center'
          }}>
            <IconButton
              onClick={handleRefreshClick}
              style={BUTTON_STYLE}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, HOVER_BUTTON_STYLE)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, BUTTON_STYLE)}
            >
              <RefreshIcon />
            </IconButton>
            <IconButton
              onClick={handleTransactionsTableClick}
              style={{
                ...BUTTON_STYLE,
                ...(showTransactionsTable ? {
                  background: 'rgba(96, 165, 250, 0.2)',
                  border: '1px solid rgba(96, 165, 250, 0.4)',
                  color: '#3b82f6',
                  boxShadow: '0 8px 24px rgba(96, 165, 250, 0.3)'
                } : {})
              }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, {
                transform: 'translateY(-2px) scale(1.05)',
                boxShadow: '0 8px 24px rgba(96, 165, 250, 0.3)',
                color: '#3b82f6'
              })}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, {
                transform: 'translateY(0) scale(1)',
                color: showTransactionsTable ? '#3b82f6' : '#475569',
                boxShadow: showTransactionsTable 
                  ? '0 8px 24px rgba(96, 165, 250, 0.3)' 
                  : '0 4px 16px rgba(0, 0, 0, 0.08)'
              })}
            >
              <TableChartIcon />
            </IconButton>
            <select 
              value={selectedYear}
              onChange={handleYearChange}
              style={{ ...SELECT_STYLE, minWidth: '120px' }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(96, 165, 250, 0.3)',
                background: 'rgba(96, 165, 250, 0.15)'
              })}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, {
                transform: 'translateY(0)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                background: 'rgba(255, 255, 255, 0.8)'
              })}
            >
              {uniqueYears.map((year) => (
                <option key={year} value={year} style={{ background: '#ffffff', color: '#1e293b' }}>
                  {year}
                </option>
              ))}
            </select>
            <select 
              value={selectedMonth}
              onChange={handleMonthChange}
              style={{ ...SELECT_STYLE, minWidth: '160px' }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(96, 165, 250, 0.3)',
                background: 'rgba(96, 165, 250, 0.15)'
              })}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, {
                transform: 'translateY(0)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                background: 'rgba(255, 255, 255, 0.8)'
              })}
            >
              {uniqueMonths.map((month) => (
                <option key={month} value={month} style={{ background: '#ffffff', color: '#1e293b' }}>
                  {new Date(`2024-${month}-01`).toLocaleDateString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>


      {/* Summary Cards Section */}
      <div style={{ 
        display: 'flex',
        gap: '32px',
        marginTop: '48px',
        marginBottom: '40px'
      }}>
        <Card
          title="Bank Transactions" 
          value={bankTransactions.income}
          color="#4ADE80"
          icon={MonetizationOnIcon}
          onClick={handleBankTransactionsClick}
          isLoading={loadingBankTransactions}
          size="medium"
          secondaryValue={bankTransactions.expenses}
          secondaryColor="#F87171"
        />
        <Card 
          title="Credit Card Transactions" 
          value={creditCardTransactions} 
          color="#3B82F6"
          icon={CreditCardIcon}
          onClick={handleTotalCreditCardExpensesClick}
          isLoading={loadingBankTransactions}
          size="medium"
        />
      </div>

      {showTransactionsTable ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '32px',
          padding: '32px',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
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
          {/* Categories Section Header */}
          <div style={{
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              height: '2px',
              flex: 1,
              background: 'linear-gradient(90deg, transparent 0%, rgba(96, 165, 250, 0.3) 50%, transparent 100%)',
              borderRadius: '2px'
            }} />
            <h2 style={{
              fontSize: '14px',
              fontWeight: 700,
              margin: 0,
              color: '#475569',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}>Expense Categories</h2>
            <div style={{
              height: '2px',
              flex: 1,
              background: 'linear-gradient(90deg, transparent 0%, rgba(96, 165, 250, 0.3) 50%, transparent 100%)',
              borderRadius: '2px'
            }} />
          </div>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '32px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
          {categories.length > 0 ? (
            categories.map((category, index) => (
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
            ))
          ) : (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '64px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '24px',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
                opacity: 0.6
              }}>📊</div>
              <div style={{
                color: '#475569',
                fontSize: '18px',
                fontWeight: 600
              }}>No transactions found for {new Date(`2024-${selectedMonth}-01`).toLocaleDateString('default', { month: 'long' })} {selectedYear}</div>
            </div>
          )}
        </div>
        </>
      )}
      </div>
    </div>

      {modalData && (
        <ExpensesModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={modalData}
          color={categoryColors[modalData?.type] || '#94a3b8'}
          setModalData={setModalData}
          currentMonth={`${selectedYear}-${selectedMonth}`}
        />
      )}
    </div>
  );
};

export default CategoryDashboard; 