import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, TextField, IconButton, Button, Tabs, Tab,
  FormControl, InputLabel, Select, MenuItem, Card, Switch,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CategoryIcon from '@mui/icons-material/Category';
import RuleIcon from '@mui/icons-material/Rule';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useCategoryColors } from '../CategoryDashboard/utils/categoryUtils';
import { useNotification } from '../NotificationContext';

interface Category { name: string; count: number; }
interface CategorizationRule { id: number; name_pattern: string; target_category: string; is_active: boolean; match_count?: number; }

interface DataPageProps {
  onManualSave?: (data: any) => void;
  onCategoriesUpdated?: () => void;
}

const DataPage: React.FC<DataPageProps> = ({ onManualSave, onCategoriesUpdated }) => {
  const [tabValue, setTabValue] = useState(0);
  const { showNotification } = useNotification();
  const categoryColors = useCategoryColors();

  // Manual
  const [txName, setTxName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualCat, setManualCat] = useState('');

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [mergeName, setMergeName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [newRule, setNewRule] = useState({ name_pattern: '', target_category: '' });
  const [isApplying, setIsApplying] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editRuleData, setEditRuleData] = useState({ name_pattern: '', target_category: '' });

  useEffect(() => { 
    fetchCategories(); 
    fetchRules(); 

    const handleRefresh = () => {
      fetchCategories();
      fetchRules();
    };

    window.addEventListener('dataRefresh', handleRefresh);
    return () => window.removeEventListener('dataRefresh', handleRefresh);
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/get_all_categories');
      if (resp.ok) {
        const cats = await resp.json();
        setCategories(cats.sort((a: Category, b: Category) => b.count - a.count));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRules = async () => {
    try { const r = await fetch('/api/categorization_rules'); if (r.ok) setRules(await r.json()); } catch {}
  };

  const handleSubmit = () => {
    if (!txName.trim() || !amount || isNaN(Number(amount))) return;
    onManualSave?.({
      name: txName.trim(), amount: Number(amount), date: new Date(date),
      type: tabValue === 0 ? 'income' : 'expense',
      category: tabValue === 1 ? manualCat : undefined,
    });
    showNotification('Transaction saved', 'success');
    setTxName(''); setAmount(''); setManualCat('');
  };

  const handleMerge = async () => {
    if (selectedCats.length < 2 || !mergeName.trim()) return;
    const r = await fetch('/api/merge_categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceCategories: selectedCats, newCategoryName: mergeName.trim() }) });
    if (r.ok) { showNotification('Merged', 'success'); setSelectedCats([]); setMergeName(''); fetchCategories(); onCategoriesUpdated?.(); }
  };

  const handleRuleOp = async (method: string, body?: any) => {
    const r = await fetch('/api/categorization_rules', { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (r.ok) { showNotification('Done', 'success'); fetchRules(); setNewRule({ name_pattern: '', target_category: '' }); setEditingRuleId(null); }
  };

  const handleApplyRules = async () => {
    setIsApplying(true);
    const r = await fetch('/api/apply_categorization_rules', { method: 'POST' });
    if (r.ok) { const res = await r.json(); showNotification(`Applied to ${res.transactionsUpdated} transactions`, 'success'); fetchCategories(); onCategoriesUpdated?.(); }
    setIsApplying(false);
  };

  return (
    <>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Data</h1>
      <p style={{ color: '#6B7280', margin: '0 0 32px', fontSize: '14px' }}>Add transactions manually, manage categories, and configure automation rules.</p>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}
        sx={{ mb: 4, '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '14px', minHeight: '40px' }, '& .Mui-selected': { fontWeight: 600 }, '& .MuiTabs-indicator': { backgroundColor: '#6366F1' } }}>
        <Tab icon={<TrendingUpIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Income" />
        <Tab icon={<TrendingDownIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Expense" />
        <Tab icon={<CategoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Categories" />
        <Tab icon={<RuleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Auto-Rules" />
      </Tabs>

      <Box sx={{ maxWidth: '800px' }}>
        {/* Manual Entry */}
        {tabValue <= 1 && (
          <Box sx={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField label="Name" fullWidth value={txName} onChange={(e) => setTxName(e.target.value)} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Amount" type="number" fullWidth value={amount} onChange={(e) => setAmount(e.target.value)} />
              <TextField label="Date" type="date" fullWidth value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Box>
            {tabValue === 1 && (
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={manualCat} label="Category" onChange={(e) => setManualCat(e.target.value)}>
                  {categories.map(c => <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={handleSubmit} sx={{ background: tabValue === 0 ? '#10B981' : '#EF4444', borderRadius: '8px', px: 4, textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}>
                Save {tabValue === 0 ? 'Income' : 'Expense'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Categories */}
        {tabValue === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', p: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Merge Categories</Typography>
              <Typography sx={{ fontSize: '13px', color: '#64748b', mb: 2 }}>Select categories below, then merge them into a new name.</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField size="small" placeholder="New category name" fullWidth value={mergeName} onChange={(e) => setMergeName(e.target.value)} />
                <Button variant="contained" disabled={selectedCats.length < 2 || !mergeName.trim()} onClick={handleMerge}
                  sx={{ textTransform: 'none', boxShadow: 'none', backgroundColor: '#6366F1', whiteSpace: 'nowrap' }}>Merge</Button>
              </Box>
            </Box>
            <Box sx={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', p: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 2 }}>All Categories ({categories.length})</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 400, overflow: 'auto' }}>
                {categories.map(c => (
                  <Chip key={c.name} label={`${c.name} (${c.count})`}
                    onClick={() => setSelectedCats(prev => prev.includes(c.name) ? prev.filter(n => n !== c.name) : [...prev, c.name])}
                    sx={{ backgroundColor: selectedCats.includes(c.name) ? categoryColors[c.name] || '#6366F1' : '#f1f5f9', color: selectedCats.includes(c.name) ? 'white' : '#334155', cursor: 'pointer', '&:hover': { opacity: 0.8 } }} />
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* Rules */}
        {tabValue === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', p: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 2 }}>Create Rule</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 2 }}>
                <TextField 
                  size="small" 
                  label="Pattern" 
                  value={newRule.name_pattern} 
                  onChange={(e) => setNewRule({ ...newRule, name_pattern: e.target.value })} 
                  onKeyDown={(e) => e.key === 'Enter' && handleRuleOp('POST', newRule)}
                />
                <TextField 
                  size="small" 
                  label="Category" 
                  value={newRule.target_category} 
                  onChange={(e) => setNewRule({ ...newRule, target_category: e.target.value })} 
                  onKeyDown={(e) => e.key === 'Enter' && handleRuleOp('POST', newRule)}
                />
                <Button variant="contained" color="success" onClick={() => handleRuleOp('POST', newRule)} sx={{ boxShadow: 'none' }}><AddIcon /></Button>
                <Button variant="outlined" color="inherit" onClick={() => setNewRule({ name_pattern: '', target_category: '' })} sx={{ borderColor: '#E2E8F0', color: '#94A3B8' }}>Clear</Button>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: 1 }}>
              <Button 
                startIcon={<PlayArrowIcon />} 
                onClick={handleApplyRules} 
                disabled={isApplying} 
                sx={{ textTransform: 'none', color: '#6366F1', '&:hover': { background: '#EEF2FF' } }}
              >
                {isApplying ? 'Applying Rules...' : 'Apply Rules to History'}
              </Button>
            </Box>
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>Pattern</TableCell>
                    <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>Target Category</TableCell>
                    <TableCell align="center" sx={{ color: '#64748B', fontWeight: 600 }}>Matches</TableCell>
                    <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600, width: '100px' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#6B7280' }}>No rules configured yet</TableCell>
                    </TableRow>
                  ) : rules.map(rule => {
                    const isEditing = editingRuleId === rule.id;
                    return (
                      <TableRow 
                        key={rule.id} 
                        onClick={() => {
                          if (!isEditing) {
                            setEditingRuleId(rule.id);
                            setEditRuleData({ name_pattern: rule.name_pattern, target_category: rule.target_category });
                          }
                        }}
                        sx={{ 
                          '&:hover': { bgcolor: '#F8FAFC' }, 
                          transition: 'background-color 0.2s',
                          cursor: isEditing ? 'default' : 'pointer'
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, color: '#1E293B', fontSize: '14px' }}>
                          {isEditing ? (
                            <TextField 
                              size="small" 
                              fullWidth 
                              value={editRuleData.name_pattern} 
                              onChange={(e) => setEditRuleData({ ...editRuleData, name_pattern: e.target.value })} 
                              variant="standard" 
                              autoFocus 
                              InputProps={{ disableUnderline: true }}
                              sx={{ '& .MuiInputBase-input': { p: '4px 8px', bgcolor: '#FFF', borderRadius: '6px', border: '1px solid #6366F1' } }}
                            />
                          ) : (
                            `"${rule.name_pattern}"`
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <TextField 
                              size="small" 
                              fullWidth 
                              value={editRuleData.target_category} 
                              onChange={(e) => setEditRuleData({ ...editRuleData, target_category: e.target.value })} 
                              variant="standard" 
                              InputProps={{ disableUnderline: true }}
                              sx={{ '& .MuiInputBase-input': { p: '4px 8px', bgcolor: '#FFF', borderRadius: '6px', border: '1px solid #6366F1' } }}
                            />
                          ) : (
                            <Chip label={rule.target_category} size="small" sx={{ bgcolor: '#EEF2FF', color: '#6366F1', fontWeight: 600, borderRadius: '6px' }} />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>
                            {rule.match_count || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            {isEditing ? (
                              <>
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRuleOp('PUT', { ...rule, ...editRuleData }); }} sx={{ color: '#10B981' }}><CheckIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingRuleId(null); }} sx={{ color: '#EF4444' }}><CloseIcon fontSize="small" /></IconButton>
                              </>
                            ) : (
                              <IconButton 
                                size="small" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleRuleOp('DELETE', { id: rule.id }); 
                                }} 
                                sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    </>
  );
};

export default DataPage;
