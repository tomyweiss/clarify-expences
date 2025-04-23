import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import StorageIcon from '@mui/icons-material/Storage';
import CircularProgress from '@mui/material/CircularProgress';

const Indicator = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 8px',
  borderRadius: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
}));

const StatusDot = styled('div')<{ connected: boolean }>(({ connected }) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: connected ? '#4ADE80' : '#F87171',
  boxShadow: `0 0 8px ${connected ? '#4ADE80' : '#F87171'}`,
}));

const LoadingSpinner = styled(CircularProgress)({
  width: '8px !important',
  height: '8px !important',
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
        <StorageIcon sx={{ fontSize: '16px', color: '#fff' }} />
        {isLoading ? <LoadingSpinner /> : <StatusDot connected={isConnected} />}
      </Indicator>
    </Tooltip>
  );
};

export default DatabaseIndicator; 