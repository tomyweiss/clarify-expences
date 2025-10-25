import React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';

interface ModalHeaderProps {
  title: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
}

export default function ModalHeader({ title, onClose, actions }: ModalHeaderProps) {
  return (
    <DialogTitle style={{ 
      color: '#1e293b',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '32px 32px 24px',
      background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(241, 245, 249, 0.5) 100%)',
      borderBottom: '1px solid rgba(148, 163, 184, 0.15)'
    }}>
      <Typography variant="h6" style={{ 
        fontWeight: 700, 
        fontSize: '24px',
        letterSpacing: '-0.01em'
      }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {actions}
        <IconButton 
          onClick={onClose} 
          style={{ 
            color: '#64748b',
            background: 'rgba(148, 163, 184, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
  );
}
