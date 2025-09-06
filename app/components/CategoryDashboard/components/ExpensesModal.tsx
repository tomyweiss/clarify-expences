import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import ModalHeader from '../../ModalHeader';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import { ExpensesModalProps, Expense } from '../types';
import { formatNumber } from '../utils/format';
import { dateUtils } from '../utils/dateUtils';
import dynamic from 'next/dynamic';
const LineChart = dynamic(() => import('@mui/x-charts').then(m => m.LineChart), { ssr: false });
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
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [editPrice, setEditPrice] = React.useState<string>('');
  const [editCategory, setEditCategory] = React.useState<string>('');
  const [availableCategories, setAvailableCategories] = React.useState<string[]>([]);

  // Fetch available categories when component mounts
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/get_all_categories');
        if (response.ok) {
          const categories = await response.json();
          setAvailableCategories(categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

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

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setEditPrice(Math.abs(expense.price).toString());
    setEditCategory(expense.category || data.type);
  };

  const handleSaveClick = async () => {
    if (editingExpense && editPrice && editingExpense.identifier && editingExpense.vendor) {
      const newPrice = parseFloat(editPrice);
      if (!isNaN(newPrice)) {
        const priceWithSign = editingExpense.price < 0 ? -newPrice : newPrice;
        
        try {
          const updateData: any = { price: priceWithSign };
          if (editCategory !== editingExpense.category) {
            updateData.category = editCategory;
          }

          const response = await fetch(`/api/transactions/${editingExpense.identifier}|${editingExpense.vendor}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          });
          
          if (response.ok) {
            // Update the local data
            const updatedData = data.data.map((item: Expense) => 
              item.identifier === editingExpense.identifier && item.vendor === editingExpense.vendor
                ? { ...item, price: priceWithSign, category: editCategory }
                : item
            );
            
            setModalData?.({
              ...data,
              data: updatedData
            });
            
            // Trigger a refresh of the dashboard data
            window.dispatchEvent(new CustomEvent('dataRefresh'));
          } else {
            console.error('Failed to update transaction');
          }
        } catch (error) {
          console.error("Error updating transaction:", error);
        }
        
        setEditingExpense(null);
      }
    }
  };

  const handleCancelClick = () => {
    setEditingExpense(null);
  };

  const handleRowClick = (expense: Expense) => {
    // If clicking on a different row while editing, save the current changes
    if (editingExpense && (editingExpense.identifier !== expense.identifier || editingExpense.vendor !== expense.vendor)) {
      handleSaveClick();
    }
  };

  const handleTableClick = (e: React.MouseEvent) => {
    // If clicking on the table background (not on a row), save current changes
    if (editingExpense && (e.target as HTMLElement).tagName === 'TABLE') {
      handleSaveClick();
    }
  };

  const handleDeleteTransaction = async (expense: Expense) => {
    try {
      // Use identifier-based delete if available, otherwise fall back to name-based delete
      if (expense.identifier && expense.vendor) {
        const response = await fetch(`/api/transactions/${expense.identifier}|${expense.vendor}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Remove the transaction from the local data
          const updatedData = data.data.filter((item: Expense) => 
            !(item.identifier === expense.identifier && item.vendor === expense.vendor)
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
      } else {
        // Fallback to name-based delete for backward compatibility
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
      <ModalHeader title={data.type} onClose={onClose} />
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
        <Table
          onClick={handleTableClick}
        >
          <TableHead>
            <TableRow>
              <TableCell style={{ color: '#555', borderBottom: '1px solid #e2e8f0', width: '200px', maxWidth: '200px' }}>Description</TableCell>
              <TableCell style={{ color: '#555', borderBottom: '1px solid #e2e8f0' }}>Category</TableCell>
              <TableCell align="right" style={{ color: '#555', borderBottom: '1px solid #e2e8f0' }}>Amount</TableCell>
              <TableCell style={{ color: '#555', borderBottom: '1px solid #e2e8f0' }}>Date</TableCell>
              <TableCell align="center" style={{ color: '#555', borderBottom: '1px solid #e2e8f0', width: '120px' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(data.data) ? data.data.map((expense: Expense, index) => (
              <TableRow 
                key={index}
                onClick={() => handleRowClick(expense)}
                style={{ cursor: 'pointer' }}
              >
                <TableCell style={{ color: '#333', borderBottom: '1px solid #e2e8f0' }}>
                  {expense.name}
                </TableCell>
                <TableCell style={{ color: '#333', borderBottom: '1px solid #e2e8f0' }}>
                  {editingExpense?.identifier === expense.identifier && 
                   editingExpense?.vendor === expense.vendor ? (
                    <Autocomplete
                      value={editCategory}
                      onChange={(event, newValue) => setEditCategory(newValue || '')}
                      onInputChange={(event, newInputValue) => setEditCategory(newInputValue)}
                      freeSolo
                      options={availableCategories}
                      size="small"
                      sx={{
                        minWidth: 120,
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
                              padding: '6px 10px',
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
                        fontWeight: '500',
                        fontSize: '13px'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(expense);
                        handleEditClick(expense);
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
                      {expense.category || data.type}
                    </span>
                  )}
                </TableCell>
                <TableCell align="right" style={{ 
                  color: data.type === "Bank Transactions" 
                    ? (expense.price >= 0 ? '#4ADE80' : '#F87171')
                    : color, 
                  borderBottom: '1px solid #e2e8f0',
                  fontWeight: '600'
                }}>
                  {editingExpense?.identifier === expense.identifier && 
                   editingExpense?.vendor === expense.vendor ? (
                    <TextField
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      size="small"
                      type="number"
                      inputProps={{ 
                        style: { 
                          textAlign: 'right',
                          color: data.type === "Bank Transactions" 
                            ? (expense.price >= 0 ? '#4ADE80' : '#F87171')
                            : color
                        } 
                      }}
                      sx={{ 
                        width: '100px',
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: data.type === "Bank Transactions" 
                              ? (expense.price >= 0 ? '#4ADE80' : '#F87171')
                              : color,
                          },
                        },
                      }}
                    />
                  ) : (
                    data.type === "Bank Transactions" 
                      ? `${expense.price >= 0 ? '+' : ''}₪${formatNumber(Math.abs(expense.price))}`
                      : `₪${formatNumber(Math.abs(expense.price))}`
                  )}
                </TableCell>
                <TableCell style={{ color: '#333', borderBottom: '1px solid #e2e8f0' }}>
                  {dateUtils.formatDate(expense.date)}
                </TableCell>
                <TableCell align="center" style={{ borderBottom: '1px solid #e2e8f0' }}>
                  {editingExpense?.identifier === expense.identifier && 
                   editingExpense?.vendor === expense.vendor ? (
                    <>
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveClick();
                        }}
                        size="small"
                        sx={{ color: '#4ADE80' }}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelClick();
                        }}
                        size="small"
                        sx={{ color: '#ef4444' }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(expense);
                          handleEditClick(expense);
                        }}
                        size="small"
                        sx={{ 
                          color: '#3b82f6',
                          '&:hover': {
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTransaction(expense);
                        }}
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
                    </>
                  )}
                </TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={5} style={{ textAlign: 'center' }}>No data available</TableCell></TableRow>}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};

export default ExpensesModal; 