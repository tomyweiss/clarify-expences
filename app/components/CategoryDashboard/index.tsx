import React from 'react';
import IconButton from '@mui/material/IconButton';
import SortIcon from '@mui/icons-material/Sort';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Button from '@mui/material/Button';
import { ResponseData, Expense, Income, ModalData } from './types';
import { useCategoryIcons, useCategoryColors } from './utils/categoryUtils';
import Card from './components/Card';
import ExpensesModal from './components/ExpensesModal';
import MetricsPanel from './components/MetricsPanel';

const CategoryDashboard: React.FC = () => {
  const [sumPerCategory, setSumPerCategory] = React.useState<ResponseData[]>([]);
  const [selectedYear, setSelectedYear] = React.useState<string>("");
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [uniqueYears, setUniqueYears] = React.useState<string[]>([]);
  const [uniqueMonths, setUniqueMonths] = React.useState<string[]>([]);
  const [totalIncome, setTotalIncome] = React.useState(0);
  const [totalExpenses, setTotalExpenses] = React.useState(0);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSorted, setIsSorted] = React.useState(true);
  const [loadingCategory, setLoadingCategory] = React.useState<string | null>(null);
  const [loadingIncome, setLoadingIncome] = React.useState(false);
  const [modalData, setModalData] = React.useState<ModalData>();
  const categoryIcons = useCategoryIcons();
  const categoryColors = useCategoryColors();
  const [allAvailableDates, setAllAvailableDates] = React.useState<string[]>([]);

  React.useEffect(() => {
    getAvailableMonths();

    // Add event listener for data refresh
    const handleDataRefresh = () => {
      getAvailableMonths();
    };

    window.addEventListener('dataRefresh', handleDataRefresh);

    // Cleanup
    return () => {
      window.removeEventListener('dataRefresh', handleDataRefresh);
    };
  }, []);

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
      
      // Calculate totals using the value field
      const expenses = data.reduce((acc: number, curr: ResponseData) => 
        acc + Math.abs(curr.value), 0);
      
      setTotalExpenses(expenses);
      
      // Fetch income data
      const incomeURL = new URL("/api/income", window.location.origin);
      const incomeParams = new URLSearchParams();
      incomeParams.append("month", month);
      incomeParams.append("groupByYear", "false");
      incomeURL.search = incomeParams.toString();
      
      const incomeResponse = await fetch(incomeURL.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!incomeResponse.ok) {
        throw new Error(`HTTP error! status: ${incomeResponse.status}`);
      }
      
      const incomeData = await incomeResponse.json();
      
      let totalIncome = 0;
      incomeData.forEach((income: Income) => {
        totalIncome += income.amount;
      });
      
      setTotalIncome(totalIncome);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Reset states in case of error
      setSumPerCategory([]);
      setTotalExpenses(0);
      setTotalIncome(0);
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

  const handleTotalIncomeClick = async () => {
      setLoadingIncome(true);
      try {
        const url = new URL("/api/income", window.location.origin);
        const params = new URLSearchParams();
        params.append("month", `${selectedYear}-${selectedMonth}`);
        url.search = params.toString();
        
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const incomeData = await response.json();
        
        let totalIncome = 0;
        let data: Expense[] = [];
        incomeData.forEach((income: Income) => {
          totalIncome += income.amount;
          data.push({
            name: income.income_type,
            price: income.amount,
            date: `${selectedYear}-${selectedMonth}`,
          });
        });
        
        setTotalIncome(totalIncome);
        setModalData({
          type: "Income",
          data: data,
        });
        setIsModalOpen(true);
      } catch (error) {
        console.error("Error fetching income data:", error);
      } finally {
        setLoadingIncome(false);
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

  const handleTotalExpensesClick = async () => {
    try {
      // Fetch latest expense data for the current month and year
      const url = new URL("/api/category_expenses", window.location.origin);
      const params = new URLSearchParams();
      const fullMonth = `${selectedYear}-${selectedMonth}`;
      params.append("month", fullMonth);
      params.append("all", "true");
      url.search = params.toString();

      const response = await fetch(url.toString());
      const expensesData = await response.json();
      
      // Format the data correctly
      setModalData({
        type: "Total Expenses",
        data: expensesData.map((expense: any) => ({
          name: expense.description || "Expense",
          price: expense.price,
          date: expense.date
        }))
      });

      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching total expenses data:", error);
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
          title="Total Income" 
          value={totalIncome}
          color="#4ADE80"
          icon={MonetizationOnIcon}
          onClick={handleTotalIncomeClick}
          isLoading={loadingIncome}
          size="large"
        />
        <Card 
          title="Total Expenses" 
          value={totalExpenses} 
          color="#F87171"
          icon={ShoppingCartIcon}
          onClick={handleTotalExpensesClick}
          size="large"
        />
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        columnGap: '64px',
        rowGap: '32px',
        width: '100%',
        maxWidth: '1360px',
        boxSizing: 'border-box'
      }}>
        {categories.map((category, index) => (
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
        ))}
      </div>

      {modalData && (
        <ExpensesModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={modalData}
          color={categoryColors[modalData?.type] || '#94a3b8'}
        />
      )}
    </div>
  );
};

export default CategoryDashboard; 