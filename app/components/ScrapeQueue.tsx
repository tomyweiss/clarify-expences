import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  CircularProgress, 
  IconButton,
  Collapse,
  Badge,
  styled,
  Tooltip
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const QueueContainer = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 24,
  right: 24,
  width: 320,
  zIndex: 9999,
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  border: '1px solid #E5E7EB',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}));

const QueueHeader = styled(Box)(({ theme }) => ({
  padding: '12px 16px',
  background: '#1E1B4B',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
}));

const TaskItem = styled(Box)(({ theme }) => ({
  padding: '12px 16px',
  borderBottom: '1px solid #F3F4F6',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  background: '#FFFFFF',
  '&:last-child': {
    borderBottom: 'none',
  }
}));

export default function ScrapeQueue() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  
  const fetchScrapeEvents = async () => {
    try {
      const response = await fetch('/api/scrape_events?limit=30');
      if (response.ok) {
        const events = await response.json();
        const active = events.filter((e: any) => e.status === 'started');
        // We can show recently completed tasks too, e.g. from the last 2 minutes
        const recentlyCompleted = events.filter((e: any) => {
          if (e.status === 'started') return false;
          const completedAt = new Date(e.created_at).getTime(); // They are ordered desc by started time, but assume recently started
          const now = new Date().getTime();
          return now - completedAt < 60 * 1000; // Tasks completed within last 60s
        });
        
        setActiveTasks(active);
        setCompletedTasks(recentlyCompleted.slice(0, 3)); // keep max 3 recently completed
      }
    } catch (e) {
      console.error('Failed to fetch scrape events queue', e);
    }
  };

  useEffect(() => {
    fetchScrapeEvents();
    const interval = setInterval(fetchScrapeEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalItems = activeTasks.length + completedTasks.length;

  if (totalItems === 0) return null;

  return (
    <QueueContainer>
      <QueueHeader onClick={() => setIsOpen(!isOpen)}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Badge badgeContent={activeTasks.length} color="primary">
            <SyncIcon sx={{ animation: activeTasks.length > 0 ? 'spin 2s linear infinite' : 'none' }} />
          </Badge>
          <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
            Scraping Tasks ({activeTasks.length} active)
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: 'white' }}>
          {isOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
        </IconButton>
      </QueueHeader>
      
      <Collapse in={isOpen}>
        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
          {activeTasks.map((task) => (
            <TaskItem key={task.id}>
              <CircularProgress size={20} thickness={5} sx={{ color: '#3B82F6' }} />
              <Box flex={1}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                  {task.vendor.toUpperCase()}
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                  Triggered by: {task.triggered_by}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '11px', color: '#6366F1', fontWeight: 500 }}>
                Running...
              </Typography>
            </TaskItem>
          ))}

          {completedTasks.map((task) => (
            <TaskItem key={task.id} sx={{ opacity: 0.8 }}>
              {task.status === 'success' ? (
                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 22 }} />
              ) : (
                <ErrorIcon sx={{ color: '#EF4444', fontSize: 22 }} />
              )}
              <Box flex={1}>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                  {task.vendor.toUpperCase()}
                </Typography>
                <Tooltip title={task.message}>
                  <Typography noWrap sx={{ fontSize: '11px', color: '#6B7280', width: 140 }}>
                    {task.status === 'success' ? 'Completed successfully' : task.message || 'Failed'}
                  </Typography>
                </Tooltip>
              </Box>
              <Typography sx={{ fontSize: '11px', color: task.status === 'success' ? '#10B981' : '#EF4444' }}>
                {task.status === 'success' ? 'Done' : 'Failed'}
              </Typography>
            </TaskItem>
          ))}
        </Box>
      </Collapse>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }
      `}} />
    </QueueContainer>
  );
}
