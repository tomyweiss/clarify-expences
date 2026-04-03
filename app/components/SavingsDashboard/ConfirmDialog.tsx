import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'error' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  severity = 'error'
}) => {
  const getSeverityColor = () => {
    switch (severity) {
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#6366F1';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          padding: '8px',
          maxWidth: '400px'
        }
      }}
    >
      <DialogTitle component="div" sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '10px',
          bgcolor: `${getSeverityColor()}15`,
          color: getSeverityColor()
        }}>
          <WarningAmberIcon />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
          {title}
        </Typography>
        <IconButton
          onClick={onCancel}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: '#94A3B8'
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: '#64748B', fontSize: '15px', lineHeight: 1.6 }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onCancel} 
          sx={{ 
            color: '#64748B', 
            textTransform: 'none', 
            fontWeight: 600,
            px: 2
          }}
        >
          {cancelLabel}
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          sx={{ 
            bgcolor: getSeverityColor(),
            '&:hover': { bgcolor: `${getSeverityColor()}dd` },
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '10px',
            px: 3,
            boxShadow: 'none'
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
