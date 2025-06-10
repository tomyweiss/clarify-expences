import React from 'react';
import IconButton from '@mui/material/IconButton';
import SortIcon from '@mui/icons-material/Sort';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TableChartIcon from '@mui/icons-material/TableChart';
import Button from '@mui/material/Button';
import { ResponseData, Expense, ModalData } from './types';
import { useCategoryIcons, useCategoryColors } from './utils/categoryUtils';
import Card from './components/Card';
import ExpensesModal from './components/ExpensesModal';
import MetricsPanel from './components/MetricsPanel';
import TransactionsTable from './components/TransactionsTable';

const CategoryDashboard: React.FC = () => {
  const [sumPerCategory, setSumPerCategory] = React.useState<ResponseData[]>([]);
  const [selectedYear, setSelectedYear] = React.useState<string>("");
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [uniqueYears, setUniqueYears] = React.useState<string[]>([]);
  const [uniqueMonths, setUniqueMonths] = React.useState<string[]>([]);
  const [bankTransactions, setBankTransactions] = React.useState({ income: 0, expenses: 0 });
  const [creditCardTransactions, setCreditCardTransactions] = React.useState(0);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSorted, setIsSorted] = React.useState(true);
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
    console.log('handleDataRefresh called with:', { 
      selectedYear: currentYearRef.current, 
      selectedMonth: currentMonthRef.current 
    });
    // Only refresh if we have valid year and month values
    if (currentYearRef.current && currentMonthRef.current && 
        currentYearRef.current !== '' && currentMonthRef.current !== '') {
      console.log('Calling fetchData with:', `${currentYearRef.current}-${currentMonthRef.current}`);
      // Use setTimeout to ensure fetchData is available
      setTimeout(() => {
        fetchData(`${currentYearRef.current}-${currentMonthRef.current}`);
      }, 0);
    } else {
      console.log('Invalid year or month values, skipping refresh');
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

  const fetchData = async (month: string) => {
    try {
      const url = new URL("/api/month_by_categories", window.location.origin);
      const params = new URLSearchParams();
      params.append("month", month);
      url.search = params.toString();

      const response = await fetch(url.toString(), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSumPerCategory(data);
      
      // Fetch all transactions to calculate income and expenses properly
      const allTransactionsURL = new URL("/api/category_expenses", window.location.origin);
      const allTransactionsParams = new URLSearchParams();
      allTransactionsParams.append("month", month);
      allTransactionsParams.append("all", "true");
      allTransactionsURL.search = allTransactionsParams.toString();
      
      const allTransactionsResponse = await fetch(allTransactionsURL.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!allTransactionsResponse.ok) {
        throw new Error(`HTTP error! status: ${allTransactionsResponse.status}`);
      }

      const allTransactions = await allTransactionsResponse.json();
      
      // Calculate total income: Bank category with positive values
      const totalIncome = allTransactions
        .filter((transaction: any) => transaction.category === 'Bank' && transaction.price > 0)
        .reduce((acc: number, transaction: any) => acc + transaction.price, 0);
      
      // Calculate total expenses: All negative values
      const totalExpenses = allTransactions
        .filter((transaction: any) => transaction.price < 0)
        .reduce((acc: number, transaction: any) => acc + Math.abs(transaction.price), 0);
      
      // Calculate credit card expenses: All transactions excluding Bank and Income categories
      const creditCardTransactions = allTransactions.filter((transaction: any) => 
        transaction.category !== 'Bank' && transaction.category !== 'Income'
      );
      
      console.log('Credit card calculation debug:', {
        allTransactionsCount: allTransactions.length,
        creditCardTransactionsCount: creditCardTransactions.length,
        creditCardTransactions: creditCardTransactions,
        categories: creditCardTransactions.map((t: any) => ({ name: t.name, category: t.category, price: t.price }))
      });
      
      const creditCardExpenses = creditCardTransactions
        .reduce((acc: number, transaction: any) => acc + Math.abs(transaction.price), 0);
      
      console.log('Credit card expenses total:', creditCardExpenses);
      
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
  }).sort((a, b) => isSorted ? Math.abs(b.value) - Math.abs(a.value) : 0);

  const handleBankTransactionsClick = async () => {
    setLoadingBankTransactions(true);
    try {
      const url = new URL("/api/category_expenses", window.location.origin);
      const params = new URLSearchParams();
      const fullMonth = `${selectedYear}-${selectedMonth}`;
      params.append("month", fullMonth);
      params.append("all", "true");
      url.search = params.toString();
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allTransactions = await response.json();
      
      // Filter for Bank category transactions (both positive and negative)
      const bankTransactions = allTransactions.filter((transaction: any) => 
        transaction.category === 'Bank'
      );
      
      // Format the data correctly
      setModalData({
        type: "Bank Transactions",
        data: bankTransactions.map((transaction: any) => ({
          name: transaction.name,
          price: transaction.price,
          date: transaction.date
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
    try {
      setLoadingBankTransactions(true);
      const url = new URL("/api/category_expenses", window.location.origin);
      const params = new URLSearchParams();
      const fullMonth = `${selectedYear}-${selectedMonth}`;
      params.append("month", fullMonth);
      params.append("all", "true");
      url.search = params.toString();

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const allExpensesData = await response.json();
      
      // Filter out 'Bank' and 'Income' category transactions to get credit card expenses
      const creditCardData = allExpensesData.filter((transaction: any) => 
        transaction.category !== 'Bank' && transaction.category !== 'Income'
      );
      
      // Format the data correctly
      setModalData({
        type: "Credit Card Expenses",
        data: creditCardData.map((transaction: any) => ({
          name: transaction.name,
          price: transaction.price,
          date: transaction.date,
          category: transaction.category
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
    try {
      setLoadingTransactions(true);
      const url = new URL("/api/category_expenses", window.location.origin);
      const params = new URLSearchParams();
      const fullMonth = `${selectedYear}-${selectedMonth}`;
      params.append("month", fullMonth);
      params.append("all", "true");
      url.search = params.toString();

      const response = await fetch(url.toString());
      const transactionsData = await response.json();
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

  const handleUpdateTransaction = async (transaction: any, newPrice: number) => {
    try {
      const response = await fetch(`/api/transactions/${transaction.identifier}|${transaction.vendor}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: newPrice }),
      });
      
      if (response.ok) {
        // Update the transaction in the local state
        setTransactions(transactions.map(t => 
          t.identifier === transaction.identifier && t.vendor === transaction.vendor
            ? { ...t, price: newPrice }
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
      padding: '24px',
      maxWidth: '1400px',
      margin: '32px auto 0',
      background: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <MetricsPanel />
      
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: '16px',
        marginTop: '16px',
        gap: '12px'
      }}>
        <IconButton
          onClick={handleTransactionsTableClick}
          style={{
            backgroundColor: showTransactionsTable ? '#edf2f7' : '#ffffff',
            padding: '12px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            color: showTransactionsTable ? '#333' : '#888',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <TableChartIcon />
        </IconButton>
        <IconButton
          onClick={() => setIsSorted(!isSorted)}
          style={{
            backgroundColor: isSorted ? '#edf2f7' : '#ffffff',
            padding: '12px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            color: isSorted ? '#333' : '#888',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <SortIcon />
        </IconButton>
        <select 
          value={selectedYear}
          onChange={handleYearChange}
          style={{
            padding: '12px 24px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#333',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            outline: 'none',
            textAlign: 'right',
            direction: 'rtl',
            minWidth: '100px'
          }}
        >
          {uniqueYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select 
          value={selectedMonth}
          onChange={handleMonthChange}
          style={{
            padding: '12px 24px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#333',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            outline: 'none',
            textAlign: 'right',
            direction: 'rtl',
            minWidth: '120px'
          }}
        >
          {uniqueMonths.map((month) => (
            <option key={month} value={month}>
              {new Date(`2024-${month}-01`).toLocaleDateString('default', { month: 'long' })}
            </option>
          ))}
        </select>
      </div>

      <div style={{ 
        display: 'flex',
        gap: '24px',
        marginBottom: '24px'
      }}>
        <Card
          title="Bank Transactions" 
          value={bankTransactions.income}
          color="#4ADE80"
          icon={MonetizationOnIcon}
          onClick={handleBankTransactionsClick}
          isLoading={loadingBankTransactions}
          size="large"
          secondaryValue={bankTransactions.expenses}
          secondaryColor="#F87171"
        />
        <Card 
          title="Credit Card Transactions" 
          value={creditCardTransactions} 
          color="#8B5CF6"
          icon={CreditCardIcon}
          onClick={handleTotalCreditCardExpensesClick}
          isLoading={loadingBankTransactions}
          size="large"
        />
      </div>

      {showTransactionsTable ? (
        <TransactionsTable 
          transactions={transactions} 
          isLoading={loadingTransactions}
          onDelete={handleDeleteTransaction}
          onUpdate={handleUpdateTransaction}
        />
      ) : (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          columnGap: '64px',
          rowGap: '32px',
          width: '100%',
          maxWidth: '1360px',
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
              padding: '48px',
              color: '#666',
              fontSize: '16px'
            }}>
              No transactions found for {new Date(`2024-${selectedMonth}-01`).toLocaleDateString('default', { month: 'long' })} {selectedYear}
            </div>
          )}
        </div>
      )}

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