import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useNotification } from './NotificationContext';
import { useScrape } from './ScrapeContext';
import ModalHeader from './ModalHeader';
import { BEINLEUMI_GROUP_VENDORS, STANDARD_BANK_VENDORS } from '../utils/constants';

interface ScraperConfig {
  options: {
    companyId: string;
    startDate: Date;
    combineInstallments: boolean;
    showBrowser: boolean;
    additionalTransactionInformation: boolean;
    cardSuffixes?: string[];
  };
  credentials: {
    id?: string;
    card6Digits?: string;
    password?: string;
    username?: string;
    bankAccountNumber?: string;
    nickname?: string;
  };
}

interface ScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialConfig?: ScraperConfig;
}

export default function ScrapeModal({ isOpen, onClose, onSuccess, initialConfig }: ScrapeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardSuffixesText, setCardSuffixesText] = useState('');
  const { showNotification } = useNotification();
  const { addTask, updateTask } = useScrape();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const clampDateString = (value: string) => (value > todayStr ? todayStr : value);
  
  const defaultConfig: ScraperConfig = {
    options: {
      companyId: '',
      startDate: new Date(),
      combineInstallments: false,
      showBrowser: false,
      additionalTransactionInformation: true,
      cardSuffixes: []
    },
    credentials: {
      id: '',
      card6Digits: '',
      password: '',
      username: '',
      nickname: '',
      bankAccountNumber: ''
    }
  };
  
  const [config, setConfig] = useState<ScraperConfig>(initialConfig || defaultConfig);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
      setCardSuffixesText((initialConfig.options.cardSuffixes || []).join(', '));
    }
  }, [initialConfig]);

  useEffect(() => {
    if (!isOpen) {
      setConfig(initialConfig || defaultConfig);
      setCardSuffixesText((initialConfig?.options.cardSuffixes || []).join(', '));
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, initialConfig]);

  const handleConfigChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setConfig(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof ScraperConfig],
          [child]: value
        }
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleScrape = async () => {
    // Client-side validation
    if (!config.credentials.id && !config.credentials.username) {
      setError('ID or Username is required');
      return;
    }
    if (!config.credentials.password) {
      setError('Password is required');
      return;
    }
    if (config.options.companyId === 'isracard' && !config.credentials.card6Digits) {
      setError('Card 6 Digits are required for Isracard');
      return;
    }

    if (config.options.companyId === 'isracard' && (!config.options.cardSuffixes || config.options.cardSuffixes.length === 0)) {
      setError('At least one card suffix is required for Isracard');
      return;
    }

    setIsLoading(true);
    setError(null);

    const vendorName = config.credentials.nickname || config.options.companyId;
    const taskId = addTask(config.options.companyId, config.credentials.nickname || 'User');

    try {
      const endpoint = config.options.companyId === 'isracard'
        ? '/api/scrape-isracard'
        : '/api/scrape';

      showNotification(`🔄 Scraping started for ${vendorName}...`, 'info');
      onClose(); 

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const body = await response.json();

      if (!response.ok) {
        const errorMsg = body.error || body.message || 'Scraping failed';
        updateTask(taskId, 'failed', errorMsg);
        showNotification(`❌ Scraping failed for ${vendorName}: ${errorMsg}`, 'error');
      } else {
        updateTask(taskId, 'success');
        showNotification(`✅ Scraping completed for ${vendorName}!`, 'success');
        
        // Trigger dashboard reload without page refresh
        window.dispatchEvent(new CustomEvent('dataRefresh'));

        onSuccess?.();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      updateTask(taskId, 'failed', errorMsg);
      showNotification(`❌ Scraping error for ${vendorName}: ${errorMsg}`, 'error');
    }
  };

  const renderNewScrapeForm = () => (
    <>
      <FormControl fullWidth>
        <InputLabel>Vendor</InputLabel>
        <Select
          value={config.options.companyId}
          label="Vendor"
          onChange={(e) => handleConfigChange('options.companyId', e.target.value)}
        >
          <MenuItem value="isracard">Isracard</MenuItem>
          <MenuItem value="visaCal">VisaCal</MenuItem>
          <MenuItem value="amex">American Express</MenuItem>
          <MenuItem value="max">Max</MenuItem>
          <MenuItem value="discount">Discount Bank</MenuItem>
          <MenuItem value="hapoalim">Bank Hapoalim</MenuItem>
          <MenuItem value="leumi">Bank Leumi</MenuItem>
          <MenuItem value="otsarHahayal">Otsar Hahayal</MenuItem>
          <MenuItem value="mizrahi">Mizrahi Bank</MenuItem>
          <MenuItem value="beinleumi">Beinleumi Bank</MenuItem>
          <MenuItem value="massad">Massad Bank</MenuItem>
          <MenuItem value="pagi">Pagi Bank</MenuItem>
          <MenuItem value="yahav">Yahav Bank</MenuItem>
          <MenuItem value="union">Union Bank</MenuItem>
        </Select>
      </FormControl>

      {BEINLEUMI_GROUP_VENDORS.includes(config.options.companyId) ? (
        <TextField
          label="ID / Username"
          value={config.credentials.id || ''}
          onChange={(e) => handleConfigChange('credentials.id', e.target.value)}
          fullWidth
          helperText="Your ID number"
        />
      ) : STANDARD_BANK_VENDORS.includes(config.options.companyId) ? (
        <>
          <TextField
            label="ID"
            value={config.credentials.id}
            onChange={(e) => handleConfigChange('credentials.id', e.target.value)}
            fullWidth
          />
          <TextField
            label="Bank Account Number"
            value={config.credentials.bankAccountNumber || ''}
            onChange={(e) => handleConfigChange('credentials.bankAccountNumber', e.target.value)}
            fullWidth
          />
        </>
      ) : config.options.companyId === 'visaCal' || config.options.companyId === 'max' ? (
        <TextField
          label="Username"
          value={config.credentials.username || ''}
          onChange={(e) => handleConfigChange('credentials.username', e.target.value)}
          fullWidth
        />
      ) : (
        <>
          <TextField
            label="ID"
            value={config.credentials.id || ''}
            onChange={(e) => handleConfigChange('credentials.id', e.target.value)}
            fullWidth
          />
          <TextField
            label="Card 6 Digits"
            value={config.credentials.card6Digits || ''}
            onChange={(e) => handleConfigChange('credentials.card6Digits', e.target.value)}
            fullWidth
          />
        </>
      )}

      <TextField
        label="Password"
        type="password"
        value={config.credentials.password || ''}
        onChange={(e) => handleConfigChange('credentials.password', e.target.value)}
        fullWidth
      />

      {config.options.companyId === 'isracard' && (
        <TextField
          label="Card Suffixes"
          value={cardSuffixesText}
          onChange={(e) => setCardSuffixesText(e.target.value)}
          onBlur={() => {
            const suffixes = cardSuffixesText.split(',').map(s => s.trim()).filter(s => s.length > 0);
            handleConfigChange('options.cardSuffixes', suffixes);
            setCardSuffixesText(suffixes.join(', '));
          }}
          fullWidth
          placeholder="e.g. 1111, 2222"
          helperText="Last 4 digits, comma-separated"
        />
      )}

      <TextField
        label="Start Date"
        type="date"
        value={config.options.startDate.toISOString().split('T')[0]}
        onChange={(e) => handleConfigChange('options.startDate', new Date(clampDateString(e.target.value)))}
        InputLabelProps={{ shrink: true }}
        inputProps={{ max: todayStr }}
      />
    </>
  );

  const renderExistingAccountForm = () => (
    <>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        mb: 1,
        background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
        borderRadius: '12px',
        border: '1px solid #C7D2FE',
      }}>
        <Box sx={{ 
          width: 56, 
          height: 56, 
          borderRadius: '14px', 
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
          boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
        }}>
          <img 
            src={`/icons/providers/${config.options.companyId.toLowerCase()}.png?v=${new Date().getTime()}`} 
            alt="" 
            style={{ width: '85%', height: '85%', objectFit: 'contain' }} 
            onError={(e) => { 
              const tgt = e.target as HTMLImageElement;
              tgt.src = 'https://ui-avatars.com/api/?name=' + config.options.companyId;
            }} 
          />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#1E1B4B' }}>{config.credentials.nickname || 'Account'}</Typography>
          <Typography sx={{ fontSize: '13px', color: '#6366F1', fontWeight: 500 }}>{config.options.companyId}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
        <TextField
          label="Start Date"
          type="date"
          value={config.options.startDate.toISOString().split('T')[0]}
          onChange={(e) => handleConfigChange('options.startDate', new Date(clampDateString(e.target.value)))}
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: todayStr }}
          size="small"
          autoFocus
        />

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 1.5,
          borderRadius: '10px',
          bgcolor: config.options.showBrowser ? '#EEF2FF' : '#F8FAFC',
          border: '1px solid',
          borderColor: config.options.showBrowser ? '#C7D2FE' : '#E2E8F0',
          transition: 'all 0.2s'
        }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: config.options.showBrowser ? '#4F46E5' : '#64748B' }}>
            Debug Mode (Show Browser)
          </Typography>
          <input 
            type="checkbox"
            checked={config.options.showBrowser}
            onChange={(e) => handleConfigChange('options.showBrowser', e.target.checked)}
            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
          />
        </Box>
      </Box>
    </>
  );

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: '12px' } }}>
      <ModalHeader title="Scrape" onClose={onClose} />
      <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {error && <Box sx={{ p: 2, bgcolor: '#FEE2E2', color: '#DC2626', borderRadius: '8px' }}>{error}</Box>}
        {initialConfig ? renderExistingAccountForm() : renderNewScrapeForm()}
      </DialogContent>
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button onClick={onClose} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
        <Button
          onClick={handleScrape}
          variant="contained"
          disabled={isLoading}
          sx={{ bgcolor: '#6366F1', borderRadius: '8px', px: 4, fontWeight: 500 }}
        >
          {isLoading ? 'Processing...' : 'SCRAPE'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}