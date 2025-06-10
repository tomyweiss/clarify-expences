import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { ExpensesModalProps, Expense } from '../types';
import { formatNumber } from '../utils/format';
import { LineChart } from '@mui/x-charts/LineChart';
import Box from '@mui/material/Box';
import DeleteIcon from '@mui/icons-material/Delete';

interface CategoryOverTimeData {
  year_month: string;
  amount: number;
  year: string;
  year_sort?: string;
}

const ExpensesModal: React.FC<ExpensesModalProps> = ({ open, onClose, data, color, setModalData, currentMonth }) => {
  const [timeSeriesData, setTimeSeriesData] = React.useState<CategoryOverTimeData[]>([]);

  React.useEffect(() => {
    if (data.type) {
      switch (data.type) {
        case "Total Expenses":
          fetch(`/api/expenses_by_month?month=10&groupByYear=false`)
            .then((response) => response.json())
            .then((data) => setTimeSeriesData(data))
            .catch((error) => console.error("Error fetching expense time series data:", error));
          break;
        case "Credit Card Expenses":
          fetch(`/api/expenses_by_month?month=10&groupByYear=false`)
            .then((response) => response.json())
            .then((data) => setTimeSeriesData(data))
            .catch((error) => console.error("Error fetching credit card expense time series data:", error));
          break;
        case "Bank Transactions":
          // Don't fetch time series data for Bank Transactions - no graph needed
          setTimeSeriesData([]);
          break;
        default:
          fetch(`/api/category_by_month?category=${data.type}&month=10&groupByYear=false`)
            .then((response) => response.json())
            .then((data) => setTimeSeriesData(data))
            .catch((error) => console.error("Error fetching time series data:", error));
      }
    }
  }, [data.type, data.data]);

  const getFormattedMonths = () =>
    timeSeriesData.map((data) => {
      if (!data.year_month) return new Date(parseInt(data.year), 0);
      const [month, year] = data.year_month.split("-");
      return new Date(parseInt(year), parseInt(month) - 1);
    });

  const getAmounts = () => timeSeriesData.map((data) => data.amount);

  const handleDeleteTransaction = async (expense: Expense) => {
    try {
      // For all transaction types, we need to find the transaction by name, date, and price
      const response = await fetch(`/api/transactions/delete_transaction`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: expense.name,
          date: expense.date,
          price: expense.price,
          category: data.type === "Bank Transactions" ? 'Bank' : (expense.category || data.type)
        }),
      });
      
      if (response.ok) {
        // Remove the transaction from the local data
        const updatedData = data.data.filter((item: Expense) => 
          !(item.name === expense.name && 
            item.date === expense.date && 
            item.price === expense.price)
        );
        
        // Update the modal data if setModalData is provided
        setModalData?.({
          ...data,
          data: updatedData
        });
        
        // Trigger a refresh of the dashboard data
        window.dispatchEvent(new CustomEvent('dataRefresh'));
      } else {
        console.error('Failed to delete transaction');
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle style={{ 
        color: '#333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#555', fontSize: '14px' }}>{data.type}</span>
        </div>
        <IconButton onClick={onClose} style={{ color: '#888' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent style={{ padding: '24px' }}>
        {data.type !== "Bank Transactions" && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ width: '100%', overflow: 'hidden' }}>
              <LineChart
                xAxis={[
                  {
                    data: getFormattedMonths(),
                    valueFormatter: (value) => {
                      return new Intl.DateTimeFormat("en-US", {
                        year: "numeric",
                        month: "short",
                      }).format(value);
                    },
                    tickLabelStyle: { fill: '#666' },
                    scaleType: 'time',
                  },
                ]}
                yAxis={[
                  {
                    tickLabelStyle: { fill: '#666' },
                    valueFormatter: (value) => `₪${formatNumber(value)}`,
                  },
                ]}
                series={[
                  {
                    data: getAmounts(),
                    color: color,
                    area: true,
                    showMark: true,
                    label: data.type,
                  },
                ]}
                height={300}
                margin={{ left: 70 }}
                grid={{ horizontal: true, vertical: false }}
                sx={{
                  '.MuiLineElement-root': {
                    stroke: color,
                    strokeWidth: 2,
                  },
                  '.MuiAreaElement-root': {
                    fill: color,
                    opacity: 0.1,
                  },
                  '.MuiMarkElement-root': {
                    stroke: color,
                    strokeWidth: 2,
                    fill: '#ffffff',
                  },
                  '.MuiChartsAxis-line': {
                    stroke: '#e2e8f0',
                  },
                  '.MuiChartsAxis-tick': {
                    stroke: '#e2e8f0',
                  },
                  '.MuiChartsGrid-root': {
                    stroke: '#e2e8f0',
                  },
                }}
              />
            </Box>
          </Box>
        )}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ color: '#555', borderBottom: '1px solid #e2e8f0' }}>Date</TableCell>
              <TableCell style={{ color: '#555', borderBottom: '1px solid #e2e8f0', width: '200px', maxWidth: '200px' }}>Description</TableCell>
              <TableCell align="right" style={{ color: '#555', borderBottom: '1px solid #e2e8f0' }}>Amount</TableCell>
              <TableCell align="center" style={{ color: '#555', borderBottom: '1px solid #e2e8f0', width: '80px' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(data.data) ? data.data.map((expense: Expense, index) => (
              <TableRow key={index}>
                <TableCell style={{ color: '#333', borderBottom: '1px solid #e2e8f0' }}>
                  {new Date(expense.date).toLocaleDateString()}
                </TableCell>
                <TableCell style={{ color: '#333', borderBottom: '1px solid #e2e8f0' }}>
                  {expense.name}
                </TableCell>
                <TableCell align="right" style={{ 
                  color: data.type === "Bank Transactions" 
                    ? (expense.price >= 0 ? '#4ADE80' : '#F87171')
                    : color, 
                  borderBottom: '1px solid #e2e8f0',
                  fontWeight: '600'
                }}>
                  {data.type === "Bank Transactions" 
                    ? `${expense.price >= 0 ? '+' : ''}₪${formatNumber(Math.abs(expense.price))}`
                    : `₪${formatNumber(Math.abs(expense.price))}`
                  }
                </TableCell>
                <TableCell align="center" style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <IconButton
                    onClick={() => handleDeleteTransaction(expense)}
                    size="small"
                    sx={{ 
                      color: '#ef4444',
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={4} style={{ textAlign: 'center' }}>No data available</TableCell></TableRow>}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};

export default ExpensesModal; 