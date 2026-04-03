import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Grid, 
  Card, 
  CircularProgress,
  IconButton,
  Fade
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SavingsTable from './SavingsTable';
import AddSavingModal from './AddSavingModal';
import ConfirmDialog from './ConfirmDialog';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaidIcon from '@mui/icons-material/Paid';
import SavingsIcon from '@mui/icons-material/Savings';
import { useNotification } from '../NotificationContext';
import { formatNumber, getCurrencySymbol } from '../CategoryDashboard/utils/formatUtils';

const SavingsDashboard: React.FC = () => {
  const [savings, setSavings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingSaving, setEditingSaving] = React.useState<any | null>(null);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [filterType, setFilterType] = React.useState<string | null>(null);
  const { showNotification } = useNotification();

  const fetchSavings = async () => {
    try {
      const response = await fetch('/api/savings');
      if (response.ok) {
        const data = await response.json();
        setSavings(data);
      }
    } catch (error) {
      console.error('Error fetching savings:', error);
      showNotification('Failed to fetch savings', 'error');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSavings();
  }, []);

  const handleSave = async (savingData: any) => {
    try {
      const method = editingSaving ? 'PUT' : 'POST';
      const response = await fetch('/api/savings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...savingData,
          id: editingSaving?.id
        })
      });

      if (response.ok) {
        showNotification(`Saving ${editingSaving ? 'updated' : 'added'} successfully`, 'success');
        fetchSavings();
      } else {
        showNotification(`Failed to ${editingSaving ? 'update' : 'add'} saving`, 'error');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showNotification('An error occurred', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch('/api/savings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteId })
      });

      if (response.ok) {
        showNotification('Saving deleted successfully', 'success');
        setDeleteId(null);
        fetchSavings();
      } else {
        showNotification('Failed to delete saving', 'error');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      showNotification('An error occurred', 'error');
    }
  };

  const handleEdit = (saving: any) => {
    setEditingSaving(saving);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingSaving(null);
    setModalOpen(true);
  };

  // Calculate totals by currency
  const totalsByCurrency = savings.reduce((acc: any, s: any) => {
    acc[s.currency] = (acc[s.currency] || 0) + s.amount;
    return acc;
  }, {});

  const filteredSavings = savings.filter(s => {
    const typeMatch = !filterType || s.type === filterType;
    return typeMatch;
  });

  const clearFilters = () => {
    setFilterType(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress sx={{ color: '#6366F1' }} />
      </Box>
    );
  }

  return (
    <Fade in={!loading}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5 }}>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              fontFamily: "'Outfit', sans-serif", 
              color: '#1E293B',
              letterSpacing: '-0.02em',
              mb: 1
            }}>
              Savings & Investments
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '15px' }}>
              Track and manage all your long-term savings in one place.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ 
              bgcolor: '#6366F1', 
              '&:hover': { bgcolor: '#4F46E5' },
              borderRadius: '12px',
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
            }}
          >
            Add Saving
          </Button>
        </Box>

        {savings.length === 0 ? (
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
                <TrendingUpIcon sx={{ fontSize: '40px' }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ 
                  fontWeight: 800, 
                  fontFamily: "'Outfit', sans-serif", 
                  color: '#1E293B',
                  mb: 1
                }}>
                  No savings tracked yet
                </Typography>
                <Typography sx={{ color: '#64748B', maxWidth: '400px', mx: 'auto', lineHeight: 1.6 }}>
                  Start planning your financial future by tracking your deposits, pension funds, and other long-term investments in one clear view.
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
                Add Your First Saving
              </Button>
            </Box>
          </Fade>
        ) : (
          <>
            {/* Combined Summary & Breakdown Widgets */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
          {/* Currency Totals */}
          {Object.keys(totalsByCurrency).map(curr => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={`total-${curr}`}>
              <Card 
                sx={{ 
                  p: 3, 
                  borderRadius: '20px', 
                  boxShadow: 'none',
                  border: '1px solid #E2E8F0',
                  bgcolor: '#FFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: '8px', 
                    bgcolor: 'rgba(99, 102, 241, 0.08)',
                    color: '#6366F1',
                    display: 'flex'
                  }}>
                    <TrendingUpIcon fontSize="small" />
                  </Box>
                  <Typography sx={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: '#94A3B8', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em' 
                  }}>
                    Total in {curr}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B' }}>
                  {getCurrencySymbol(curr)}{formatNumber(totalsByCurrency[curr])}
                </Typography>
              </Card>
            </Grid>
          ))}

          {/* Category Breakdown */}
          {(() => {
            const totalsByType = savings.reduce((acc: any, s: any) => {
              const key = s.type;
              if (!acc[key]) acc[key] = {};
              acc[key][s.currency] = (acc[key][s.currency] || 0) + s.amount;
              return acc;
            }, {});

            const getInvestmentIcon = (type: string) => {
              switch (type) {
                case 'פיקדון': return <AccountBalanceIcon fontSize="small" />;
                case 'קופת גמל להשקעה': return <TrendingUpIcon fontSize="small" />;
                case 'קרן השתלמות': return <AccountBalanceWalletIcon fontSize="small" />;
                case 'אחר': return <PaidIcon fontSize="small" />;
                default: return <SavingsIcon fontSize="small" />;
              }
            };

              return Object.keys(totalsByType).map(type => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={`type-${type}`}>
                  <Card 
                    onClick={() => setFilterType(filterType === type ? null : type)}
                    sx={{ 
                      p: 3, 
                      borderRadius: '20px', 
                      boxShadow: 'none',
                      border: `2px solid ${filterType === type ? '#6366F1' : '#E2E8F0'}`,
                      bgcolor: filterType === type ? '#F5F5FF' : '#FFF',
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.05)',
                        borderColor: '#6366F1'
                      }
                    }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: '8px', 
                        bgcolor: filterType === type ? '#6366F1' : 'rgba(99, 102, 241, 0.08)',
                        color: filterType === type ? '#FFF' : '#6366F1',
                        display: 'flex',
                        transition: 'all 0.2s'
                      }}>
                        {getInvestmentIcon(type)}
                      </Box>
                      <Typography sx={{ 
                        fontSize: '14px', 
                        fontWeight: 700, 
                        color: filterType === type ? '#6366F1' : '#475569'
                      }}>
                        {type}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {Object.keys(totalsByType[type]).map(curr => (
                        <Typography key={curr} sx={{ fontWeight: 800, fontSize: '18px', color: '#1E293B' }}>
                          {getCurrencySymbol(curr)}{formatNumber(totalsByType[type][curr])}
                        </Typography>
                      ))}
                    </Box>
                  </Card>
                </Grid>
              ));
          })()}

              </Grid>
  
              <SavingsTable 
                savings={filteredSavings} 
                onEdit={handleEdit} 
                onDelete={(id) => setDeleteId(id)} 
                selectedCurrency={null}
                selectedType={filterType}
                onClearFilters={clearFilters}
              />
            </>
          )}

        <AddSavingModal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          onSave={handleSave}
          initialData={editingSaving}
        />

        <ConfirmDialog
          open={!!deleteId}
          title="Delete Saving"
          message="Are you sure you want to delete this saving? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          severity="error"
        />
      </Container>
    </Fade>
  );
};

export default SavingsDashboard;
