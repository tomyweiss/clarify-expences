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
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { ExpensesModalProps, Expense } from '../types';
import { formatNumber, getCurrencySymbol } from '../utils/format';
import { dateUtils } from '../utils/dateUtils';
import { LineChart } from '@mui/x-charts/LineChart';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
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
  const [originalCategory, setOriginalCategory] = React.useState<string>('');
  const [createRule, setCreateRule] = React.useState(false);
  const { categories: availableCategories } = useCategories();

  React.useEffect(() => {
    if (!data.type) return;

    const applySeries = (payload: unknown) => {
      setTimeSeriesData(Array.isArray(payload) ? payload : []);
    };

    switch (data.type) {
      case "Total Expenses":
      case "Credit Card Expenses":
        fetch(`/api/expenses_by_month?month=10&groupByYear=false`)
          .then(async (res) => {
            const body = await res.json();
            if (!res.ok) {
              console.error("expenses_by_month error:", body);
              applySeries([]);
              return;
            }
            applySeries(body);
          })
          .catch((error) => {
            console.error("Error fetching expense time series data:", error);
            setTimeSeriesData([]);
          });
        break;
      case "Bank Transactions":
        setTimeSeriesData([]);
        break;
      default:
        fetch(
          `/api/category_by_month?category=${encodeURIComponent(data.type)}&month=10&groupByYear=false`
        )
          .then(async (res) => {
            const body = await res.json();
            if (!res.ok) {
              console.error("category_by_month error:", body);
              applySeries([]);
              return;
            }
            applySeries(body);
          })
          .catch((error) => {
            console.error("Error fetching time series data:", error);
            setTimeSeriesData([]);
          });
    }
  }, [data.type, data.data]);

  const getFormattedMonths = () =>
    timeSeriesData.map((row) => {
      if (!row.year_month) return new Date(parseInt(row.year, 10), 0);
      const [m, y] = row.year_month.split("-");
      return new Date(parseInt(y, 10), parseInt(m, 10) - 1);
    });

  const getAmounts = () => timeSeriesData.map((row) => row.amount);

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setEditPrice(Math.abs(expense.price).toString());
    const cat = expense.category || (data.type === "Bank Transactions" ? 'Bank' : data.type);
    setEditCategory(cat);
    setOriginalCategory(cat);
    setEditName(expense.name);
    setCreateRule(false);
  };

  const handleSaveClick = async () => {
    if (editingExpense && editPrice && editingExpense.identifier && editingExpense.vendor) {
      const newPrice = parseFloat(editPrice);
      if (!isNaN(newPrice)) {
        const priceWithSign = editingExpense.price < 0 ? -newPrice : newPrice;

        // Create categorization rule if requested
        if (createRule && editCategory && editCategory !== originalCategory) {
          try {
            await fetch('/api/categorization_rules', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name_pattern: editingExpense.name, target_category: editCategory }),
            });
          } catch (err) {
            console.error('Failed to create categorization rule:', err);
          }
        }
        
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
            const updatedData = data.data.map((item: Expense) => 
              item.identifier === editingExpense.identifier && item.vendor === editingExpense.vendor
                ? { ...item, price: priceWithSign, category: editCategory, name: editName }
                : item
            );
            
            setModalData?.({
              ...data,
              data: updatedData
            });
            
            window.dispatchEvent(new CustomEvent('dataRefresh'));
          } else {
            console.error('Failed to update transaction');
          }
        } catch (error) {
          console.error("Error updating transaction:", error);
        }
        
        setEditingExpense(null);
        setCreateRule(false);
      }
    }
  };

  const handleCancelClick = () => {
    setEditingExpense(null);
    setCreateRule(false);
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
                    valueFormatter: (value: number) => {
                      if (Math.abs(value) >= 1000) {
                        return `${getCurrencySymbol()}${new Intl.NumberFormat('en-US', {
                          notation: 'compact',
                          maximumFractionDigits: 1
                        }).format(value)}`;
                      }
                      return `${getCurrencySymbol()}${formatNumber(value)}`;
                    },
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
                margin={{ left: 80 }}
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
            <Box sx={{ width: '160px', flex: '0 0 160px' }}>Description</Box>
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
                  <Box sx={{ width: '160px', flex: '0 0 160px', display: 'flex', alignItems: 'center', gap: 2 }}>
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
                          <Typography sx={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {expense.vendor}
                            {expense.account_number && (
                              <>
                                <span style={{ fontSize: '10px', opacity: 0.5 }}>•</span>
                                <span style={{ 
                                  fontWeight: 600, 
                                  color: '#64748B',
                                  background: '#F1F5F9',
                                  padding: '0px 4px',
                                  borderRadius: '4px',
                                  fontSize: '10px'
                                }}>
                                  {expense.account_number.slice(-4)}
                                </span>
                              </>
                            )}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Category */}
                  <Box sx={{ flex: 1 }}>
                    {isEditing ? (
                      <Box>
                        <Autocomplete
                          size="small"
                          options={availableCategories}
                          value={editCategory}
                          onChange={(_, val) => setEditCategory(val || '')}
                          onInputChange={(_, val) => setEditCategory(val)}
                          freeSolo
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              variant="standard"
                              autoFocus
                              InputProps={{ ...params.InputProps, disableUnderline: true }}
                              inputProps={{ ...params.inputProps, onFocus: (e) => (e.target as HTMLInputElement).select() }}
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
                        {editCategory !== originalCategory && editCategory && (
                          <Tooltip title={`Always categorize "${expense.name}" as ${editCategory}`} arrow placement="bottom">
                            <Box
                              onClick={() => setCreateRule(r => !r)}
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                mt: '4px',
                                px: '6px',
                                py: '2px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                border: '1px solid',
                                borderColor: createRule ? '#6366F1' : '#E2E8F0',
                                bgcolor: createRule ? 'rgba(99,102,241,0.07)' : 'transparent',
                                transition: 'all 0.15s',
                              }}
                            >
                              <AutoFixHighIcon sx={{ fontSize: '10px', color: createRule ? '#6366F1' : '#94A3B8' }} />
                              <Typography sx={{ fontSize: '10px', fontWeight: 600, color: createRule ? '#6366F1' : '#94A3B8', userSelect: 'none' }}>
                                Save as rule
                              </Typography>
                              <Checkbox
                                checked={createRule}
                                onChange={() => setCreateRule(r => !r)}
                                size="small"
                                onClick={e => e.stopPropagation()}
                                sx={{
                                  p: 0,
                                  color: '#CBD5E1',
                                  '&.Mui-checked': { color: '#6366F1' },
                                  '& .MuiSvgIcon-root': { fontSize: '13px' },
                                }}
                              />
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
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