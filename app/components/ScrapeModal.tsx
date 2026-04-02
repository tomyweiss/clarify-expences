import { useState, useEffect, useRef, useCallback } from 'react';
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
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastKnownEventIdRef = useRef<number | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const clampDateString = (value: string) => (value > todayStr ? todayStr : value);
  const defaultConfig: ScraperConfig = {
    options: {
      companyId: 'isracard',
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

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const startPollingForResult = useCallback((vendor: string, nickname: string) => {
    // Store the latest event ID before starting so we only look for new events
    fetch('/api/scrape_events?limit=1')
      .then(res => res.json())
      .then(events => {
        if (events.length > 0) {
          lastKnownEventIdRef.current = events[0].id;
        }
      })
      .catch(() => {});

    // Poll every 5 seconds for the result
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/scrape_events?limit=5');
        if (!res.ok) return;
        const events = await res.json();
        
        // Find a new event matching our vendor that was created after we started
        const matchingEvent = events.find((e: any) => {
          const isNew = lastKnownEventIdRef.current === null || e.id > lastKnownEventIdRef.current;
          const matchesVendor = e.vendor === vendor;
          const isTerminal = e.status === 'success' || e.status === 'failed';
          return isNew && matchesVendor && isTerminal;
        });

        if (matchingEvent) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          if (matchingEvent.status === 'success') {
            showNotification(
              `✅ Scraping completed for ${nickname || vendor}! Data has been refreshed.`,
              'success'
            );
            onSuccess?.();
          } else {
            showNotification(
              `❌ Scraping failed for ${nickname || vendor}: ${matchingEvent.message || 'Unknown error'}`,
              'error'
            );
          }
        }
      } catch (err) {
        // Silently continue polling
      }
    }, 5000);

    // Stop polling after 5 minutes as a safety net
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 5 * 60 * 1000);
  }, [showNotification, onSuccess]);

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
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = config.options.companyId === 'isracard'
        ? '/api/scrape-isracard'
        : '/api/scrape';

      // Fire the request but don't await the full scrape — it runs in background on the server
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      // The scrape API responds immediately if there's a validation error,
      // otherwise it runs in the background
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || body.message || `Failed to start scraping (${response.status})`);
      }

      const vendorName = config.credentials.nickname || config.options.companyId;
      showNotification(
        `🔄 Scraping started for ${vendorName}. You'll be notified when it's done.`,
        'info'
      );

      // Start polling for result
      startPollingForResult(config.options.companyId, vendorName);

      // Close the modal immediately — scraping continues in the background
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
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
        <>
          <TextField
            label="ID / Username"
            value={config.credentials.id}
            onChange={(e) => handleConfigChange('credentials.id', e.target.value)}
            fullWidth
            helperText="Your ID number (no account number needed for this bank)"
          />
        </>
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
            value={config.credentials.bankAccountNumber}
            onChange={(e) => handleConfigChange('credentials.bankAccountNumber', e.target.value)}
            fullWidth
          />
        </>
      ) : config.options.companyId === 'visaCal' || config.options.companyId === 'max' ? (
        <TextField
          label="Username"
          value={config.credentials.username}
          onChange={(e) => handleConfigChange('credentials.username', e.target.value)}
          fullWidth
        />
      ) : (
        <>
          <TextField
            label="ID"
            value={config.credentials.id}
            onChange={(e) => handleConfigChange('credentials.id', e.target.value)}
            fullWidth
          />
          <TextField
            label="Card 6 Digits"
            value={config.credentials.card6Digits}
            onChange={(e) => handleConfigChange('credentials.card6Digits', e.target.value)}
            fullWidth
          />
        </>
      )}

      <TextField
        label="Password"
        type="password"
        value={config.credentials.password}
        onChange={(e) => handleConfigChange('credentials.password', e.target.value)}
        fullWidth
      />

      {config.options.companyId === 'isracard' && (
        <TextField
          label="Card Suffixes"
          value={cardSuffixesText}
          onChange={(e) => setCardSuffixesText(e.target.value)}
          onBlur={() => {
            const suffixes = cardSuffixesText
              .split(',')
              .map(s => s.trim())
              .filter(s => s.length > 0);
            handleConfigChange('options.cardSuffixes', suffixes);
            setCardSuffixesText(suffixes.join(', '));
          }}
          fullWidth
          placeholder="e.g. 1111, 2222"
          helperText="Last 4 digits of each card, comma-separated"
        />
      )}

      <TextField
        label="Start Date"
        type="date"
        value={config.options.startDate.toISOString().split('T')[0]}
        onChange={(e) => {
          const v = clampDateString(e.target.value);
          handleConfigChange('options.startDate', new Date(v));
        }}
        InputLabelProps={{
          shrink: true,
        }}
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
          width: 40,
          height: 40,
          borderRadius: '10px',
          background: '#6366F1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: '16px',
        }}>
          {(config.credentials.nickname || config.options.companyId || '?')[0].toUpperCase()}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#1E1B4B' }}>
            {config.credentials.nickname || 'Account'}
          </Typography>
          <Typography sx={{ fontSize: '13px', color: '#6366F1', fontWeight: 500 }}>
            {config.options.companyId}
          </Typography>
        </Box>
      </Box>

      {config.credentials.username && (
        <TextField
          label="Username"
          value={config.credentials.username}
          disabled
          fullWidth
          size="small"
        />
      )}
      {config.credentials.id && (
        <TextField
          label="ID"
          value={config.credentials.id}
          disabled
          fullWidth
          size="small"
        />
      )}
      {config.credentials.card6Digits && (
        <TextField
          label="Card 6 Digits"
          value={config.credentials.card6Digits}
          disabled
          fullWidth
          size="small"
        />
      )}
      {config.credentials.bankAccountNumber && (
        <TextField
          label="Bank Account Number"
          value={config.credentials.bankAccountNumber}
          disabled
          fullWidth
          size="small"
        />
      )}

      {config.options.companyId === 'isracard' && (
        <TextField
          label="Card Suffixes"
          value={(config.options.cardSuffixes || []).join(', ') || '—'}
          disabled
          fullWidth
          size="small"
        />
      )}

      <TextField
        label="Start Date"
        type="date"
        value={config.options.startDate.toISOString().split('T')[0]}
        onChange={(e) => {
          const v = clampDateString(e.target.value);
          handleConfigChange('options.startDate', new Date(v));
        }}
        InputLabelProps={{
          shrink: true,
        }}
        inputProps={{ max: todayStr }}
      />
    </>
  );

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="sm"
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
      <ModalHeader title="Scrape" onClose={onClose} />
      <DialogContent style={{ padding: '0 32px 32px', color: '#111827' }}>
        {error && (
          <div style={{
            background: '#FEE2E2',
            color: '#DC2626',
            border: '1px solid #FECACA',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '16px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3, maxHeight: '450px', overflow: 'auto', paddingRight: '12px' }}>
          {initialConfig ? renderExistingAccountForm() : renderNewScrapeForm()}
        </Box>
      </DialogContent>
      <DialogActions style={{ padding: '0 32px 32px', gap: '16px' }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            color: '#64748b',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleScrape}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{
            backgroundColor: '#6366F1',
            borderRadius: '8px',
            padding: '10px 32px',
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#4F46E5',
              boxShadow: 'none',
            },
            '&:focus': {
              outline: 'none',
            },
            '&:focus-visible': {
              outline: 'none',
            }
          }}
        >
          {isLoading ? 'Starting...' : 'SCRAPE'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 