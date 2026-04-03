import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, TextField, IconButton, Button, Tabs, Tab,
  FormControl, InputLabel, Select, MenuItem, Card, Switch,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CategoryIcon from '@mui/icons-material/Category';
import RuleIcon from '@mui/icons-material/Rule';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useCategoryColors } from '../CategoryDashboard/utils/categoryUtils';
import { useNotification } from '../NotificationContext';

interface Category { name: string; count: number; }
interface CategorizationRule { id: number; name_pattern: string; target_category: string; is_active: boolean; }

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

  // Rules
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [newRule, setNewRule] = useState({ name_pattern: '', target_category: '' });
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => { fetchCategories(); fetchRules(); }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/get_all_categories');
      if (resp.ok) {
        const names = await resp.json();
        const cats = await Promise.all(names.map(async (name: string) => {
          const r = await fetch(`/api/category_expenses?month=all&category=${encodeURIComponent(name)}`);
          const txs = await r.json();
          return { name, count: Array.isArray(txs) ? txs.length : 0 };
        }));
        setCategories(cats.sort((a, b) => b.count - a.count));
      }
    } finally { setIsLoading(false); }
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
    if (r.ok) { showNotification('Done', 'success'); fetchRules(); setNewRule({ name_pattern: '', target_category: '' }); }
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
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 2 }}>
                <TextField size="small" label="Pattern" value={newRule.name_pattern} onChange={(e) => setNewRule({ ...newRule, name_pattern: e.target.value })} />
                <TextField size="small" label="Category" value={newRule.target_category} onChange={(e) => setNewRule({ ...newRule, target_category: e.target.value })} />
                <Button variant="contained" color="success" onClick={() => handleRuleOp('POST', newRule)} sx={{ boxShadow: 'none' }}><AddIcon /></Button>
              </Box>
              <Button startIcon={<PlayArrowIcon />} onClick={handleApplyRules} disabled={isApplying} sx={{ mt: 2, textTransform: 'none' }}>
                {isApplying ? 'Applying...' : 'Apply Rules to History'}
              </Button>
            </Box>
            <Box sx={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              {rules.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', color: '#6B7280' }}>No rules yet</Box>
              ) : rules.map(rule => (
                <Box key={rule.id} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', '&:last-child': { borderBottom: 'none' } }}>
                  <Box>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>"{rule.name_pattern}"</Typography>
                    <Typography sx={{ fontSize: '11px', color: '#64748b' }}>→ {rule.target_category}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Switch checked={rule.is_active} onChange={(e) => handleRuleOp('PUT', { ...rule, is_active: e.target.checked })} size="small" />
                    <IconButton size="small" color="error" onClick={() => handleRuleOp('DELETE', { id: rule.id })}><DeleteIcon sx={{ fontSize: 18 }} /></IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
};

export default DataPage;
