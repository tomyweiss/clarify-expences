import React, { useState, useEffect } from 'react';
import {
  Button, Chip, Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableHead, TableRow, Box, Tabs, Tab, Typography
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SecurityIcon from '@mui/icons-material/Security';
import { getCurrency, setCurrency } from '../CategoryDashboard/utils/format';
import { useNotification } from '../NotificationContext';
import DatabaseIndicator from '../DatabaseIndicator';

interface ScrapeEvent {
  id: number;
  triggered_by: string | null;
  vendor: string;
  start_date: string;
  status: string;
  message: string | null;
  created_at: string;
}

const SettingsPage: React.FC = () => {
  const [currencyPref, setCurrencyPref] = useState('ILS');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionTarget, setDeletionTarget] = useState<'all' | 'transactions' | 'month' | null>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonthToDelete, setSelectedMonthToDelete] = useState<string>('');
  const [events, setEvents] = useState<ScrapeEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const { showNotification } = useNotification();

  useEffect(() => {
    setCurrencyPref(getCurrency());
    fetchAvailableMonths();
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await fetch('/api/scrape_events?limit=50');
      const data = await res.json();
      setEvents(data);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchAvailableMonths = async () => {
    try {
      const response = await fetch('/api/available_months');
      if (response.ok) {
        const data = await response.json();
        setAvailableMonths(data.sort((a: string, b: string) => b.localeCompare(a)));
        if (data.length > 0) setSelectedMonthToDelete(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch available months:', error);
    }
  };

  const handleCurrencyChange = (event: any) => {
    const newCurrency = event.target.value;
    setCurrencyPref(newCurrency);
    setCurrency(newCurrency);
    showNotification('Currency updated successfully', 'success');
    window.dispatchEvent(new CustomEvent('dataRefresh'));
  };

  const handleDelete = async (endpoint: string, label: string) => {
    setIsDeleting(true);
    try {
      const body = endpoint.includes('month_data') ? JSON.stringify({ month: selectedMonthToDelete }) : undefined;
      const response = await fetch(`/api/settings/${endpoint}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body,
      });
      if (response.ok) {
        showNotification(`${label} deleted successfully`, 'success');
        setDeletionTarget(null);
        window.location.reload();
      }
    } catch (err) {
      showNotification('Error: ' + (err instanceof Error ? err.message : 'Unknown'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => { window.location.href = '/api/settings/export_csv'; };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const response = await fetch('/api/settings/import_csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvContent: e.target?.result }),
        });
        const result = await response.json();
        if (response.ok) {
          showNotification(`Import: ${result.importedCount} new, ${result.skippedCount} skipped`, 'success');
          window.dispatchEvent(new CustomEvent('dataRefresh'));
        }
      } catch (err) {
        showNotification('Import error', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const statusColor = (status: string) => {
    if (status === 'success') return 'success';
    if (status === 'failed') return 'error';
    return 'default';
  };

  return (
    <>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Settings</h1>
      <p style={{ color: '#6B7280', margin: '0 0 32px', fontSize: '14px' }}>Manage your preferences, view logs, and control your data.</p>

      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        sx={{
          mb: 4,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '14px', minHeight: '40px' },
          '& .Mui-selected': { fontWeight: 600 },
          '& .MuiTabs-indicator': { backgroundColor: '#6366F1' },
        }}
      >
        <Tab icon={<SettingsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Preferences" />
        <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Audit Logs" />
        <Tab icon={<SecurityIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Privacy" />
      </Tabs>

      <Box sx={{ maxWidth: '800px' }}>
        {/* Preferences */}
        {tabValue === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box sx={{ p: 3, borderRadius: '12px', background: '#fff', border: '1px solid #E5E7EB' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#111827' }}>Currency</h3>
              <FormControl fullWidth size="small">
                <Select value={currencyPref} onChange={handleCurrencyChange} sx={{ borderRadius: '8px' }}>
                  <MenuItem value="ILS">Israeli Shekel (₪)</MenuItem>
                  <MenuItem value="USD">US Dollar ($)</MenuItem>
                  <MenuItem value="EUR">Euro (€)</MenuItem>
                  <MenuItem value="GBP">British Pound (£)</MenuItem>
                </Select>
              </FormControl>
              <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#6B7280' }}>
                Choose the currency symbol used throughout the dashboard.
              </p>
            </Box>

            <Box sx={{ p: 3, borderRadius: '12px', background: '#fff', border: '1px solid #E5E7EB' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#111827' }}>Database Connection</h3>
              <DatabaseIndicator />
            </Box>
          </Box>
        )}

        {/* Audit Logs */}
        {tabValue === 1 && (
          <Box sx={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            {loadingEvents ? (
              <Box sx={{ p: 4, textAlign: 'center', color: '#94A3B8' }}>Loading logs...</Box>
            ) : events.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', color: '#6B7280' }}>No recent activities found</Box>
            ) : (
              <Box sx={{ width: '100%' }}>
                {/* Header */}
                <Box sx={{ 
                  display: 'grid', gridTemplateColumns: '160px 120px 100px 1fr', px: 3, py: 1.5, borderBottom: '1px solid #F1F5F9',
                  color: '#94A3B8', fontSize: '11px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  <Box>Time</Box>
                  <Box>Vendor</Box>
                  <Box>Status</Box>
                  <Box>Details</Box>
                </Box>
                {/* Rows */}
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {events.map((ev) => (
                    <Box key={ev.id} sx={{ 
                      display: 'grid', gridTemplateColumns: '160px 120px 100px 1fr', alignItems: 'center', px: 3, py: 1.8, borderBottom: '1px solid #F8FAFC',
                      transition: '0.2s', '&:hover': { background: '#F8FAFC' }
                    }}>
                      <Box>
                        <Typography sx={{ fontSize: '13px', color: '#64748B' }}>
                          {new Date(ev.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', textTransform: 'capitalize' }}>
                          {ev.vendor}
                        </Typography>
                      </Box>
                      <Box>
                        <Chip label={ev.status} size="small" sx={{ 
                          height: '22px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                          backgroundColor: ev.status === 'success' ? '#ECFDF5' : ev.status === 'failed' ? '#FEF2F2' : '#F1F5F9',
                          color: ev.status === 'success' ? '#10B981' : ev.status === 'failed' ? '#EF4444' : '#64748B',
                          border: '1px solid', borderColor: ev.status === 'success' ? '#A7F3D0' : ev.status === 'failed' ? '#FECACA' : '#E2E8F0'
                        }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '13px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.message || 'Synced'}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Privacy */}
        {tabValue === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box sx={{ p: 3, borderRadius: '12px', background: '#fff', border: '1px solid #E5E7EB' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>Backup & Import</h3>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B7280' }}>Export or import your transaction data as CSV.</p>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" fullWidth startIcon={<DownloadIcon />} onClick={handleExportCSV}
                  sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#6366F1', color: '#6366F1', borderRadius: '8px' }}>
                  Export CSV
                </Button>
                <input type="file" accept=".csv" id="import-csv-input" style={{ display: 'none' }} onChange={handleImportCSV} />
                <label htmlFor="import-csv-input" style={{ flex: 1 }}>
                  <Button component="span" variant="outlined" fullWidth startIcon={<UploadIcon />}
                    sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#10B981', color: '#10B981', borderRadius: '8px', '&:hover': { backgroundColor: '#ECFDF5' } }}>
                    Import CSV
                  </Button>
                </label>
              </Box>
            </Box>

            <Box sx={{ p: 3, borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <WarningAmberIcon sx={{ fontSize: 20 }} /> Danger Zone
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#991B1B' }}>These actions are permanent and cannot be undone.</p>

              {!deletionTarget ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button variant="outlined" fullWidth onClick={() => setDeletionTarget('transactions')} startIcon={<DeleteForeverIcon />}
                      sx={{ color: '#DC2626', borderColor: '#FCA5A5', textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: 'white' } }}>
                      Delete Transactions
                    </Button>
                    <Button variant="outlined" fullWidth onClick={() => setDeletionTarget('month')} disabled={availableMonths.length === 0} startIcon={<DeleteForeverIcon />}
                      sx={{ color: '#DC2626', borderColor: '#FCA5A5', textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: 'white' } }}>
                      Delete Month...
                    </Button>
                  </Box>
                  <Button variant="contained" fullWidth onClick={() => setDeletionTarget('all')} startIcon={<DeleteForeverIcon />}
                    sx={{ backgroundColor: '#DC2626', textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { backgroundColor: '#B91C1C' } }}>
                    Reset All Account Data
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, textAlign: 'center', color: '#B91C1C' }}>
                    Are you sure you want to delete {deletionTarget === 'all' ? 'everything' : deletionTarget === 'transactions' ? 'transaction data' : `data for ${selectedMonthToDelete}`}?
                  </p>
                  {deletionTarget === 'month' && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Select Month</InputLabel>
                      <Select value={selectedMonthToDelete} label="Select Month" onChange={(e) => setSelectedMonthToDelete(e.target.value)} sx={{ borderRadius: '8px' }}>
                        {availableMonths.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )}
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button fullWidth variant="contained" onClick={() => {
                      if (deletionTarget === 'all') handleDelete('delete_all_data', 'All data');
                      else if (deletionTarget === 'transactions') handleDelete('delete_transactions', 'Transactions');
                      else handleDelete('delete_month_data', selectedMonthToDelete);
                    }} disabled={isDeleting}
                      sx={{ flex: 2, backgroundColor: '#B91C1C', textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}>
                      {isDeleting ? 'Deleting...' : 'Confirm'}
                    </Button>
                    <Button fullWidth variant="outlined" onClick={() => setDeletionTarget(null)}
                      sx={{ flex: 1, color: '#4B5563', borderColor: '#D1D5DB', textTransform: 'none' }}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
};

export default SettingsPage;
