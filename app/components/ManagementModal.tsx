import React from 'react';
import { 
  Box, 
  Modal, 
  Typography, 
  IconButton, 
  styled,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountsPage from './pages/AccountsPage';
import DataPage from './pages/DataPage';
import SettingsPage from './pages/SettingsPage';

const MODAL_STYLE = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  maxWidth: '1200px',
  height: '85vh',
  bgcolor: '#FFFFFF',
  borderRadius: '24px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  outline: 'none',
  overflow: 'hidden',
  display: 'flex',
};

const ModalSidebar = styled(Box)({
  width: '240px',
  backgroundColor: '#F9FAFB',
  borderRight: '1px solid #E5E7EB',
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 16px',
  gap: '8px',
});

const ModalContent = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  backgroundColor: '#FFFFFF',
  position: 'relative',
  /* Custom scrollbar - visible only on hover/scroll */
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'transparent',
    borderRadius: '10px',
    transition: 'background-color 0.2s',
  },
  '&:hover::-webkit-scrollbar-thumb': {
    background: '#CBD5E1',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#94A3B8',
  },
});

const TabButton = styled(Box)<{ active?: boolean }>(({ active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: '12px',
  cursor: 'pointer',
  color: active ? '#6366F1' : '#4B5563',
  backgroundColor: active ? '#EEF2FF' : 'transparent',
  fontWeight: active ? 600 : 500,
  fontSize: '14px',
  transition: 'all 0.15s ease',
  '&:hover': {
    backgroundColor: active ? '#E0E7FF' : '#F3F4F6',
    color: active ? '#4F46E5' : '#111827',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '22px',
    opacity: active ? 1 : 0.7,
  },
}));

export type ManagementTab = 'data' | 'accounts' | 'settings';

interface ManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ManagementTab;
  onTabChange: (tab: ManagementTab) => void;
  onManualSave?: (data: any) => void;
  onCategoriesUpdated?: () => void;
}

const ManagementModal: React.FC<ManagementModalProps> = ({ 
  isOpen, 
  onClose, 
  activeTab, 
  onTabChange,
  onManualSave,
  onCategoriesUpdated
}) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'data':
        return <DataPage onManualSave={onManualSave || (() => {})} onCategoriesUpdated={onCategoriesUpdated || (() => {})} />;
      case 'accounts':
        return <AccountsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} disableAutoFocus>
      <Paper sx={MODAL_STYLE}>
        <ModalSidebar>
          <Typography sx={{ 
            fontSize: '12px', 
            fontWeight: 700, 
            color: '#9CA3AF', 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em',
            px: 2,
            mb: 2
          }}>
            Management
          </Typography>
          
          <TabButton active={activeTab === 'accounts'} onClick={() => onTabChange('accounts')}>
            <AccountBalanceIcon />
            Accounts
          </TabButton>
          
          <TabButton active={activeTab === 'data'} onClick={() => onTabChange('data')}>
            <StorageIcon />
            Data Manager
          </TabButton>
          
          <TabButton active={activeTab === 'settings'} onClick={() => onTabChange('settings')}>
            <SettingsIcon />
            Settings
          </TabButton>

          <Box sx={{ flex: 1 }} />
        </ModalSidebar>

        <ModalContent>
          <IconButton 
            onClick={onClose}
            sx={{ 
              position: 'absolute', 
              right: 24, 
              top: 24, 
              zIndex: 10,
              backgroundColor: '#F3F4F6',
              '&:hover': { backgroundColor: '#E5E7EB' }
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
          
          <Box sx={{ p: '32px 48px' }}>
            {renderTabContent()}
          </Box>
        </ModalContent>
      </Paper>
    </Modal>
  );
};

export default ManagementModal;
