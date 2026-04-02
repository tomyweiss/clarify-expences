import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import StorageIcon from '@mui/icons-material/Storage';
import CircularProgress from '@mui/material/CircularProgress';

const Indicator = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px',
  borderRadius: '8px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: '#F3F4F6',
  },
}));

const LoadingSpinner = styled(CircularProgress)({
  width: '20px !important',
  height: '20px !important',
  color: '#3b82f6',
});

const DatabaseIndicator: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/ping');
        const data = await response.json();
        setIsConnected(response.ok && data.status === 'ok');
      } catch (error) {
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Tooltip title={isLoading ? "Checking connection..." : (isConnected ? "Database Connected" : "Database Disconnected")}>
      <Indicator>
        {isLoading ? <LoadingSpinner /> : <StorageIcon sx={{ fontSize: '24px', color: isConnected ? '#4ADE80' : '#F87171' }} />}
      </Indicator>
    </Tooltip>
  );
};

export default DatabaseIndicator; 