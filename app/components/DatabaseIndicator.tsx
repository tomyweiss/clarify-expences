import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import StorageIcon from '@mui/icons-material/Storage';
import CircularProgress from '@mui/material/CircularProgress';

const DatabaseIndicator: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/ping');
      const data = await response.json();
      setIsConnected(response.ok && data.status === 'ok');
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#94A3B8' }}>
        <CircularProgress size={16} sx={{ color: '#6366F1' }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>Checking status...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: 1.5, 
      px: 2, 
      py: 1, 
      borderRadius: '12px',
      backgroundColor: isConnected ? '#ECFDF5' : '#FEF2F2',
      border: '1px solid',
      borderColor: isConnected ? '#A7F3D0' : '#FECACA',
    }}>
      <Box sx={{ 
        width: 8, 
        height: 8, 
        borderRadius: '50%', 
        backgroundColor: isConnected ? '#10B981' : '#EF4444',
        boxShadow: isConnected ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none'
      }} />
      <StorageIcon sx={{ fontSize: 18, color: isConnected ? '#059669' : '#DC2626' }} />
      <Typography sx={{ 
        fontSize: '13px', 
        fontWeight: 600, 
        color: isConnected ? '#065F46' : '#991B1B' 
      }}>
        {isConnected ? 'Database Connected' : 'Database Disconnected'}
      </Typography>
    </Box>
  );
};

export default DatabaseIndicator;
 