import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Box from '@mui/material/Box';

interface ScraperConfig {
  options: {
    companyId: string;
    startDate: Date;
    combineInstallments: boolean;
    showBrowser: boolean;
    additionalTransactionInformation: boolean;
  };
  credentials: {
    id?: string;
    card6Digits?: string;
    password?: string;
    username?: string;
  };
}

interface ScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ScrapeModal({ isOpen, onClose, onSuccess }: ScrapeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultConfig: ScraperConfig = {
    options: {
      companyId: 'isracard',
      startDate: new Date(),
      combineInstallments: false,
      showBrowser: false,
      additionalTransactionInformation: true
    },
    credentials: {
      id: '',
      card6Digits: '',
      password: '',
      username: ''
    }
  };
  const [config, setConfig] = useState<ScraperConfig>(defaultConfig);

  useEffect(() => {
    if (!isOpen) {
      // Reset all fields when modal closes
      setConfig(defaultConfig);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

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
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error('Failed to start scraping');
      }

      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle style={{ 
        color: '#333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Scrape Transactions</span>
        </div>
        <IconButton onClick={onClose} style={{ color: '#888' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent style={{ padding: '0 24px 24px' }}>
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Bank</InputLabel>
            <Select
              value={config.options.companyId}
              label="Bank"
              onChange={(e) => handleConfigChange('options.companyId', e.target.value)}
            >
              <MenuItem value="isracard">Isracard</MenuItem>
              <MenuItem value="visaCal">VisaCal</MenuItem>
              <MenuItem value="amex">American Express</MenuItem>
              <MenuItem value="max">Max</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Start Date"
            type="date"
            value={config.options.startDate.toISOString().split('T')[0]}
            onChange={(e) => handleConfigChange('options.startDate', new Date(e.target.value))}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={config.options.combineInstallments}
                onChange={(e) => handleConfigChange('options.combineInstallments', e.target.checked)}
              />
            }
            label="Combine Installments"
          />

          <FormControlLabel
            control={
              <Switch
                checked={config.options.showBrowser}
                onChange={(e) => handleConfigChange('options.showBrowser', e.target.checked)}
              />
            }
            label="Show Browser"
          />

          {config.options.companyId === 'visaCal' || config.options.companyId === 'max' ? (
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
        </Box>
      </DialogContent>
      <DialogActions style={{ padding: '0 24px 24px' }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            color: '#333',
            backgroundColor: '#f1f5f9',
            borderRadius: '12px',
            padding: '8px 16px',
            border: '1px solid #e2e8f0',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: '#e2e8f0',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleScrape}
          sx={{ 
            color: '#fff',
            backgroundColor: '#3b82f6',
            borderRadius: '12px',
            padding: '8px 16px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: '#2563eb',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Scraping...' : 'Start Scraping'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 