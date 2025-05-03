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
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState<any[]>([]);
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null);
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
      setConfig(defaultConfig);
      setError(null);
      setIsLoading(false);
      setSaveCredentials(false);
      setSavedCredentials([]);
      setSelectedCredentialId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchSavedCredentials = async () => {
      try {
        const response = await fetch(`/api/credentials?vendor=${config.options.companyId}`);
        if (response.ok) {
          const data = await response.json();
          setSavedCredentials(data.map((cred: any) => ({
            id: `${cred.vendor}-${cred.id_number || cred.username}`,
            ...cred
          })));
        }
      } catch (error) {
        console.error('Error fetching saved credentials:', error);
      }
    };

    if (isOpen && config.options.companyId) {
      fetchSavedCredentials();
    }
  }, [isOpen, config.options.companyId]);

  useEffect(() => {
    if (selectedCredentialId && savedCredentials.length > 0) {
      const selectedCredential = savedCredentials.find(cred => cred.id === selectedCredentialId);
      if (selectedCredential) {
        setConfig(prev => ({
          ...prev,
          credentials: {
            ...prev.credentials,
            id: selectedCredential.id_number || '',
            card6Digits: selectedCredential.card6_digits || '',
            password: selectedCredential.password || '',
            username: selectedCredential.username || ''
          }
        }));
        setSaveCredentials(true);
      }
    } else {
      setConfig(prev => ({
        ...prev,
        credentials: {
          id: '',
          card6Digits: '',
          password: '',
          username: ''
        }
      }));
      setSaveCredentials(false);
    }
  }, [selectedCredentialId, savedCredentials]);

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
      if (saveCredentials) {
        await fetch('/api/credentials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vendor: config.options.companyId,
            username: config.credentials.username,
            password: config.credentials.password,
            id_number: config.credentials.id,
            card6_digits: config.credentials.card6Digits
          })
        });
      }

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

          {savedCredentials.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Saved Credentials</InputLabel>
              <Select
                value={selectedCredentialId || ''}
                label="Saved Credentials"
                onChange={(e) => setSelectedCredentialId(e.target.value)}
              >
                {savedCredentials.map((cred) => (
                  <MenuItem key={cred.id} value={cred.id}>
                    {cred.username || cred.id_number || 'Saved Credentials'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

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

          <FormControlLabel
            control={
              <Switch
                checked={saveCredentials}
                onChange={(e) => setSaveCredentials(e.target.checked)}
              />
            }
            label="Save credentials for future use"
          />
        </Box>
      </DialogContent>
      <DialogActions style={{ padding: '16px 24px' }}>
        <Button onClick={onClose} style={{ color: '#666' }}>
          Cancel
        </Button>
        <Button
          onClick={handleScrape}
          variant="contained"
          disabled={isLoading}
          style={{
            backgroundColor: '#3b82f6',
            color: '#fff',
            padding: '8px 24px',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          {isLoading ? 'Scraping...' : 'Scrape'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 