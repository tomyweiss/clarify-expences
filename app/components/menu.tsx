import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/router';
import ManagementModal, { ManagementTab } from './ManagementModal';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const SIDEBAR_WIDTH = 220;

const SidebarContainer = styled(Box)({
  position: 'fixed',
  left: 0,
  top: 0,
  bottom: 0,
  width: `${SIDEBAR_WIDTH}px`,
  backgroundColor: '#FFFFFF',
  borderRight: '1px solid #E5E7EB',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1200,
  overflow: 'hidden',
});

const LogoSection = styled(Box)({
  padding: '24px 20px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer',
  transition: 'opacity 0.2s',
  '&:hover': { opacity: 0.85 },
});

const NavSection = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '8px 12px',
  gap: '2px',
});

const NavItem = styled(Box, { shouldForwardProp: (prop) => prop !== 'active' })<{ active?: boolean }>(({ active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  color: active ? '#6366F1' : '#4B5563',
  backgroundColor: active ? '#EEF2FF' : 'transparent',
  fontFamily: "'Inter', sans-serif",
  fontSize: '14px',
  fontWeight: active ? 600 : 500,
  transition: 'all 0.15s ease',
  userSelect: 'none' as const,
  '&:hover': {
    backgroundColor: active ? '#E0E7FF' : '#F3F4F6',
    color: active ? '#4F46E5' : '#111827',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '20px',
    opacity: active ? 1 : 0.75,
  },
}));

const BottomSection = styled(Box)({
  padding: '12px',
  borderTop: '1px solid #E5E7EB',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

const MainContent = styled(Box)({
  marginLeft: `${SIDEBAR_WIDTH}px`,
  minHeight: '100vh',
  backgroundColor: '#F5F5F5',
});

const ComingSoonPlaceholder = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
  <Box sx={{ 
    height: '100vh', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 2,
    color: '#94A3B8'
  }}>
    <Box sx={{ 
      width: 64, 
      height: 64, 
      borderRadius: '20px', 
      backgroundColor: '#FFF', 
      border: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mb: 1
    }}>
      {React.cloneElement(icon as React.ReactElement<any>, { sx: { fontSize: 32, color: '#6366F1' } })}
    </Box>
    <Typography sx={{ 
      fontFamily: "'Outfit', sans-serif", 
      fontSize: '24px', 
      fontWeight: 700, 
      color: '#1E293B' 
    }}>
      {title}
    </Typography>
    <Typography sx={{ 
      fontFamily: "'Inter', sans-serif", 
      fontSize: '14px', 
      color: '#64748B' 
    }}>
      This feature is coming soon. Stay tuned!
    </Typography>
  </Box>
);

interface AppShellProps {
  children: React.ReactNode; 
}

function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const [managementModalOpen, setManagementModalOpen] = React.useState(false);
  const [managementTab, setManagementTab] = React.useState<ManagementTab>('accounts');
  const { showNotification } = useNotification();
  const { logout } = useAuth();

  const handleOpenManagement = (tab: ManagementTab) => {
    setManagementTab(tab);
    setManagementModalOpen(true);
  };

  React.useEffect(() => {
    const handleOpenManagementEvent = () => {
      handleOpenManagement('accounts');
    };
    window.addEventListener('openManagement', handleOpenManagementEvent);
    return () => window.removeEventListener('openManagement', handleOpenManagementEvent);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      showNotification('Logged out successfully', 'success');
    } catch (error) {
      showNotification('Logout failed', 'error');
    }
  };

  const handleManualSave = async (data: any) => {
    try {
      const response = await fetch("/api/manual_transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, date: data.date.toISOString().split('T')[0] }),
      });
      if (response.ok) {
        window.dispatchEvent(new CustomEvent('dataRefresh'));
      }
    } catch (error) {
      console.error("Error adding manual transaction:", error);
    }
  };

  return (
    <>
      <SidebarContainer>
        <LogoSection onClick={() => { router.push('/'); setManagementModalOpen(false); }}>
          <AccountBalanceWalletIcon sx={{ fontSize: '24px', color: '#6366F1' }} />
          <Typography sx={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#111827',
            letterSpacing: '-0.01em',
          }}>
            Clarify
          </Typography>
        </LogoSection>

        <NavSection>
          <NavItem active={router.pathname === '/' && !managementModalOpen} onClick={() => { router.push('/'); setManagementModalOpen(false); }}>
            <DashboardIcon />
            Finance
          </NavItem>
          
          <NavItem active={router.pathname === '/savings' && !managementModalOpen} onClick={() => { router.push('/savings'); setManagementModalOpen(false); }}>
            <TrendingUpIcon />
            Savings
          </NavItem>

          <NavItem active={router.pathname === '/insurance' && !managementModalOpen} onClick={() => { router.push('/insurance'); setManagementModalOpen(false); }}>
            <SecurityIcon />
            Insurance
          </NavItem>


          <Box sx={{ height: '1px', bgcolor: '#E5E7EB', my: 1, mx: 1.5, opacity: 0.6 }} />

          <NavItem active={managementModalOpen} onClick={() => handleOpenManagement('accounts')}>
            <SettingsIcon />
            Management
          </NavItem>
        </NavSection>

        <Box sx={{ flex: 1 }} />

        <BottomSection>
          <NavItem onClick={handleLogout}>
            <LogoutIcon />
            Logout
          </NavItem>
        </BottomSection>
      </SidebarContainer>

      <MainContent>
        {children}
      </MainContent>

      <ManagementModal 
        isOpen={managementModalOpen} 
        onClose={() => setManagementModalOpen(false)} 
        activeTab={managementTab}
        onTabChange={(tab) => setManagementTab(tab)}
        onManualSave={handleManualSave}
        onCategoriesUpdated={() => window.dispatchEvent(new CustomEvent('dataRefresh'))}
      />

    </>
  );
}

export default AppShell;
