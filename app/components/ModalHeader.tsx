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
      color: '#333',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px'
    }}>
      <Typography variant="h6" style={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {actions}
        <IconButton onClick={onClose} style={{ color: '#888' }}>
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
  );
}
