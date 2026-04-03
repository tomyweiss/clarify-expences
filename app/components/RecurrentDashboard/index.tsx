import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Fade,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RepeatIcon from '@mui/icons-material/Repeat';
import RecurrentTable from './RecurrentTable';
import AddRecurrentModal from './AddRecurrentModal';
import { useNotification } from '../NotificationContext';
import { formatNumber, getCurrencySymbol } from '../CategoryDashboard/utils/formatUtils';
import ConfirmDialog from '../SavingsDashboard/ConfirmDialog';

const RecurrentDashboard: React.FC = () => {
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<any | null>(null);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const { showNotification } = useNotification();

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/recurrent_transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching recurrent transactions:', error);
      showNotification('Failed to fetch transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSave = async (data: any) => {
    try {
      const method = editingTransaction ? 'PUT' : 'POST';
      const response = await fetch('/api/recurrent_transactions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          id: editingTransaction?.id
        })
      });

      if (response.ok) {
        showNotification(`Transaction ${editingTransaction ? 'updated' : 'added'} successfully`, 'success');
        fetchTransactions();
        window.dispatchEvent(new CustomEvent('dataRefresh'));
      } else {
        const err = await response.json();
        showNotification(err.error || `Failed to ${editingTransaction ? 'update' : 'add'} transaction`, 'error');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showNotification('An error occurred', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/recurrent_transactions?id=${deleteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showNotification('Transaction deleted successfully', 'success');
        setDeleteId(null);
        fetchTransactions();
        window.dispatchEvent(new CustomEvent('dataRefresh'));
      } else {
        showNotification('Failed to delete transaction', 'error');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      showNotification('An error occurred', 'error');
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5 }}>
        <CircularProgress sx={{ color: '#6366F1' }} />
      </Box>
    );
  }

  return (
    <Fade in={!loading}>
      <Box sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ 
              fontWeight: 800, 
              fontFamily: "'Outfit', sans-serif", 
              color: '#1E293B',
              letterSpacing: '-0.02em',
              mb: 0.5
            }}>
              Recurrent Transactions
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '14px' }}>
              Monthly transactions added automatically.
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ 
              bgcolor: '#6366F1', 
              '&:hover': { bgcolor: '#4F46E5' },
              borderRadius: '10px',
              px: 2.5,
              py: 0.75,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
            }}
          >
            Add New
          </Button>
        </Box>


        {transactions.length === 0 ? (
          <Fade in={true} timeout={800}>
            <Box sx={{ 
              mt: 4,
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
              minHeight: '400px'
            }}>
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '24px', 
                bgcolor: 'rgba(99, 102, 241, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366F1',
                mb: 1
              }}>
                <RepeatIcon sx={{ fontSize: '40px' }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ 
                  fontWeight: 800, 
                  fontFamily: "'Outfit', sans-serif", 
                  color: '#1E293B',
                  mb: 1
                }}>
                  No recurrent transactions yet
                </Typography>
                <Typography sx={{ color: '#64748B', maxWidth: '400px', mx: 'auto', lineHeight: 1.6 }}>
                  Set up rent, subscriptions, or salaries to see them automatically included in your monthly finance dashboards.
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={handleAdd}
                startIcon={<AddIcon />}
                sx={{ 
                  bgcolor: '#6366F1', 
                  '&:hover': { bgcolor: '#4F46E5' },
                  borderRadius: '12px',
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '16px',
                  boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
                }}
              >
                Create Your First Recurrent Row
              </Button>
            </Box>
          </Fade>
        ) : (
          <RecurrentTable 
            transactions={transactions} 
            onEdit={handleEdit} 
            onDelete={setDeleteId} 
          />
        )}

        <AddRecurrentModal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          onSave={handleSave}
          initialData={editingTransaction}
        />

        <ConfirmDialog
          open={!!deleteId}
          title="Delete Recurrent Transaction"
          message="Are you sure you want to delete this recurrent transaction? It will no longer be added to your monthly reports."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          severity="error"
        />
      </Box>
    </Fade>
  );
};


export default RecurrentDashboard;
