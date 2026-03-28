import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import ScrapeModal from './ScrapeModal';
import ManualModal from './ManualModal';
import DatabaseIndicator from './DatabaseIndicator';
import AccountsModal from './AccountsModal';
import CategoryManagementModal from './CategoryDashboard/components/CategoryManagementModal';
import ScrapeAuditModal from './ScrapeAuditModal';
import SettingsModal from './SettingsModal';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';

interface StringDictionary {
  [key: string]: string;
}

const pages: StringDictionary = {};

const StyledAppBar = styled(AppBar)({
  background: '#FFFFFF',
  borderBottom: '1px solid #E5E7EB',
  boxShadow: 'none',
});

const Logo = styled(Typography)({
  fontFamily: "'Inter', sans-serif",
  fontWeight: 700,
  fontSize: '1.25rem',
  color: '#111827',
  textDecoration: "none",
  cursor: "pointer",
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    opacity: 0.8,
  },
});

const NavButton = styled(Button)({
  color: '#4B5563',
  textTransform: 'none',
  fontSize: '0.875rem',
  fontWeight: 500,
  padding: '6px 12px',
  borderRadius: '8px',
  margin: '0 4px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: '#F3F4F6',
    color: '#111827',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  '&:focus': {
    outline: 'none',
  },
  '&:focus-visible': {
    outline: 'none',
  },
  '& .MuiTouchRipple-root': {
    display: 'none',
  }
});

const SignOutButton = styled(Button)({
  color: '#6B7280',
  textTransform: 'none',
  fontSize: '0.875rem',
  fontWeight: 500,
  padding: '6px 12px',
  borderRadius: '8px',
  marginLeft: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  '&:focus': {
    outline: 'none',
  },
  '&:focus-visible': {
    outline: 'none',
  },
  '& .MuiTouchRipple-root': {
    display: 'none',
  }
});

const redirectTo = (page: string) => {
  return () => (window.location.href = page);
};

function ResponsiveAppBar() {
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const [isScrapeModalOpen, setIsScrapeModalOpen] = React.useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = React.useState(false);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = React.useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);
  const [isCategoryManagementOpen, setIsCategoryManagementOpen] = React.useState(false);
  const [isAuditOpen, setIsAuditOpen] = React.useState(false);
  const { showNotification } = useNotification();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      showNotification('Logged out successfully', 'success');
    } catch (error) {
      showNotification('Logout failed', 'error');
    }
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleAddManualTransaction = async (transactionData: {
    name: string;
    amount: number;
    date: Date;
    type: 'income' | 'expense';
    category?: string;
  }) => {
    try {
      const formattedDate = transactionData.date.toISOString().split('T')[0];
      
      const response = await fetch("/api/manual_transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: transactionData.name,
          amount: transactionData.amount,
          date: formattedDate,
          type: transactionData.type,
          category: transactionData.category
        }),
      });

      if (response.ok) {
        setIsManualModalOpen(false);
        // Dispatch a custom event to trigger data refresh
        window.dispatchEvent(new CustomEvent('dataRefresh'));
      } else {
        console.error("Failed to add manual transaction");
      }
    } catch (error) {
      console.error("Error adding manual transaction:", error);
    }
  };

  const handleScrapeSuccess = () => {
    showNotification('Scraping process completed successfully!', 'success');
    // Dispatch a custom event to trigger data refresh
    window.dispatchEvent(new CustomEvent('dataRefresh'));
  };

  return (
    <>
      <StyledAppBar position="fixed">
        <Container maxWidth={false}>
          <Toolbar disableGutters variant="dense" sx={{ minHeight: '48px' }}>
            <Logo
              variant="h4"
              noWrap
              onClick={redirectTo("/")}
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: '28px', color: '#6366F1' }} />
              Clarify
            </Logo>

            <Box sx={{ 
              flexGrow: 1, 
              display: { xs: "none", md: "flex" },
              justifyContent: 'center',
              gap: '8px'
            }}>
              {Object.keys(pages).map((page: string) => (
                <NavButton
                  key={page}
                  onClick={redirectTo(pages[page])}
                >
                  {page}
                </NavButton>
              ))}
            </Box>
            <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <NavButton
                onClick={() => setIsAuditOpen(true)}
                startIcon={<HistoryIcon />}
              >
                Audit
              </NavButton>
              <NavButton
                onClick={() => setIsManualModalOpen(true)}
                startIcon={<EditIcon />}
              >
                Manual
              </NavButton>
              <NavButton
                onClick={() => setIsCategoryManagementOpen(true)}
                startIcon={<EditIcon />}
              >
                Categories
              </NavButton>
              <NavButton
                onClick={() => setIsAccountsModalOpen(true)}
                startIcon={<PersonIcon />}
              >
                Accounts
              </NavButton>
              <SignOutButton
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
              >
                Logout
              </SignOutButton>
              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              />
              <DatabaseIndicator />
            </Box>
          </Toolbar>
        </Container>
      </StyledAppBar>
      <ScrapeModal
        isOpen={isScrapeModalOpen}
        onClose={() => setIsScrapeModalOpen(false)}
        onSuccess={handleScrapeSuccess}
      />
      <ManualModal
        open={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={handleAddManualTransaction}
      />
      <AccountsModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
      />
      <CategoryManagementModal
        open={isCategoryManagementOpen}
        onClose={() => setIsCategoryManagementOpen(false)}
        onCategoriesUpdated={() => {
          // Dispatch a custom event to trigger data refresh
          window.dispatchEvent(new CustomEvent('dataRefresh'));
        }}
      />
      <ScrapeAuditModal open={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
      <SettingsModal open={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </>
  );
}

export default ResponsiveAppBar;
