import React from 'react';
import Dialog from '@mui/material/Dialog';
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
import { formatNumber, getCurrencySymbol } from '../utils/format';
import { dateUtils } from '../utils/dateUtils';
import { LineChart } from '@mui/x-charts/LineChart';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCategories } from '../utils/useCategories';
import { TABLE_HEADER_CELL_STYLE, TABLE_BODY_CELL_STYLE, TABLE_ROW_HOVER_STYLE, TABLE_ROW_HOVER_BACKGROUND } from '../utils/tableStyles';

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
  const [editName, setEditName] = React.useState<string>('');
  const { categories: availableCategories } = useCategories();

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
    setEditCategory(expense.category || (data.type === "Bank Transactions" ? 'Bank' : data.type));
    setEditName(expense.name);
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
          if (editName !== editingExpense.name) {
            updateData.name = editName;
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
                ? { ...item, price: priceWithSign, category: editCategory, name: editName }
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
      onClose={() => {
        if (!editingExpense) onClose();
      }}
      disableEscapeKeyDown={!!editingExpense}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
          background: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #E5E7EB'
        }
      }}
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(17, 24, 39, 0.5)',
          backdropFilter: 'blur(4px)'
        }
      }}
    >
      <ModalHeader title={data.type} onClose={onClose} />
      <DialogContent style={{ padding: '0 32px 32px', color: '#111827', minHeight: '550px' }}>
        {data.type !== "Bank Transactions" && (
          <Box sx={{ 
            mb: 4, 
            p: 3,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(10px)'
          }}>
            <Box sx={{ width: '100%', overflow: 'hidden' }}>
              <LineChart
                xAxis={[
                  {
                    data: getFormattedMonths(),
                    valueFormatter: (value: Date) => {
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
                    valueFormatter: (value: number) => `${getCurrencySymbol()}${formatNumber(value)}`,
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
        <Box sx={{
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(10px)'
        }}>
        <Box sx={{ width: '100%' }}>
          {/* Table Header */}
          <Box sx={{ 
            display: 'flex', 
            px: 3, 
            py: 1.5, 
            borderBottom: '1px solid #F1F5F9',
            color: '#94A3B8',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Box sx={{ width: '240px', flex: '0 0 240px' }}>Description</Box>
            <Box sx={{ flex: 1 }}>Category</Box>
            <Box sx={{ flex: 1, textAlign: 'right' }}>Amount</Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>Date</Box>
            <Box sx={{ width: '100px', textAlign: 'right' }}>Actions</Box>
          </Box>

          {/* Table Body */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {Array.isArray(data.data) && data.data.length > 0 ? data.data.map((expense: Expense, index) => {
              const isEditing = editingExpense?.identifier === expense.identifier && editingExpense?.vendor === expense.vendor;
              
              return (
                <Box
                  key={index}
                  onClick={() => !isEditing && handleRowClick(expense)}
                  onDoubleClick={() => !isEditing && handleEditClick(expense)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 3,
                    py: isEditing ? 1.5 : 2,
                    borderBottom: '1px solid #F8FAFC',
                    transition: 'all 0.2s ease',
                    cursor: isEditing ? 'default' : 'pointer',
                    '&:hover': {
                      background: '#F8FAFC',
                    }
                  }}
                >
                  {/* Description */}
                  <Box sx={{ width: '240px', flex: '0 0 240px', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '8px', 
                      backgroundColor: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#64748B',
                      flexShrink: 0
                    }}>
                      {expense.name.charAt(0).toUpperCase()}
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      {isEditing ? (
                        <TextField
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          size="small"
                          variant="standard"
                          autoFocus
                          InputProps={{ disableUnderline: true }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveClick();
                            if (e.key === 'Escape') {
                              e.stopPropagation();
                              handleCancelClick();
                            }
                          }}
                          sx={{ 
                            '& .MuiInputBase-input': { 
                              fontWeight: 600, 
                              fontSize: '14px', 
                              p: '4px 8px', 
                              bgcolor: '#FFF', 
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0'
                            } 
                          }}
                        />
                      ) : (
                        <>
                          <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {expense.name}
                          </Typography>
                          <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>{expense.vendor}</Typography>
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Category */}
                  <Box sx={{ flex: 1 }}>
                    {isEditing ? (
                      <Autocomplete
                        size="small"
                        options={availableCategories}
                        value={editCategory}
                        onChange={(_, val) => setEditCategory(val || '')}
                        freeSolo
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            variant="standard" 
                            InputProps={{ ...params.InputProps, disableUnderline: true }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveClick();
                              if (e.key === 'Escape') {
                                e.stopPropagation();
                                handleCancelClick();
                              }
                            }}
                            sx={{ 
                              '& .MuiInputBase-input': { 
                                fontSize: '11px', 
                                fontWeight: 700,
                                p: '4px 8px !important', 
                                bgcolor: '#FFF', 
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0',
                                textTransform: 'uppercase'
                              } 
                            }}
                          />
                        )}
                      />
                    ) : (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.08)',
                        color: '#6366F1',
                        textTransform: 'uppercase'
                      }}>{expense.category || data.type}</span>
                    )}
                  </Box>

                  {/* Amount */}
                  <Box sx={{ flex: 1, textAlign: 'right' }}>
                    {isEditing ? (
                      <TextField 
                        size="small" 
                        type="number" 
                        value={editPrice} 
                        onChange={e => setEditPrice(e.target.value)}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveClick();
                          if (e.key === 'Escape') {
                            e.stopPropagation();
                            handleCancelClick();
                          }
                        }}
                        sx={{ 
                          width: '100px',
                          '& .MuiInputBase-input': { 
                            fontWeight: 700, 
                            fontSize: '15px', 
                            p: '4px 8px', 
                            bgcolor: '#FFF', 
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            textAlign: 'right',
                            color: expense.price < 0 ? '#EF4444' : '#10B981'
                          } 
                        }}
                      />
                    ) : (
                      <Typography sx={{ 
                        fontWeight: 700, 
                        fontSize: '15px',
                        color: expense.price < 0 ? '#EF4444' : '#10B981'
                      }}>
                        {expense.price < 0 ? '-' : '+'}{getCurrencySymbol()}{formatNumber(Math.abs(expense.price))}
                      </Typography>
                    )}
                  </Box>

                  {/* Date */}
                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '13px', color: '#94A3B8' }}>
                      {dateUtils.formatDate(expense.date)}
                    </Typography>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ width: '100px', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    {isEditing ? (
                      <>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleSaveClick(); }} sx={{ color: '#10B981' }}><CheckIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleCancelClick(); }} sx={{ color: '#EF4444' }}><CloseIcon fontSize="small" /></IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton 
                          size="small" 
                          onClick={(e) => { e.stopPropagation(); handleEditClick(expense); }} 
                          sx={{ color: '#3B82F6', '&:hover': { background: '#EFF6FF' } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(expense); }} 
                          sx={{ color: '#EF4444', '&:hover': { background: '#FEF2F2' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Box>
              );
            }) : (
              <Box sx={{ p: 4, textAlign: 'center', color: '#94A3B8' }}>No data available</Box>
            )}
          </Box>
        </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ExpensesModal; 