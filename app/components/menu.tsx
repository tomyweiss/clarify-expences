import * as React from "react"
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SyncIcon from '@mui/icons-material/Sync';
import AddIcon from '@mui/icons-material/Add';
import ScrapeModal from './ScrapeModal';
import NewIncomeModal from './NewIncomeModal';
import DatabaseIndicator from './DatabaseIndicator';

interface StringDictionary {
  [key: string]: string;
}

const pages: StringDictionary = {};

const StyledAppBar = styled(AppBar)({
  background: 'rgba(20, 20, 20, 0.8)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: 'none',
});

const Logo = styled(Typography)({
  fontFamily: "Assistant, sans-serif",
  fontWeight: 700,
  letterSpacing: ".3rem",
  color: "#fff",
  textDecoration: "none",
  cursor: "pointer",
  fontSize: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '&:hover': {
    color: '#3b82f6',
  },
});

const NavButton = styled(Button)({
  color: '#fff',
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 500,
  padding: '8px 16px',
  borderRadius: '12px',
  margin: '0 4px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
});

const SignOutButton = styled(Button)({
  color: '#fff',
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 500,
  padding: '8px 16px',
  borderRadius: '12px',
  marginLeft: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
});

const redirectTo = (page: string) => {
  return () => (window.location.href = page);
};

function ResponsiveAppBar() {
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const [isScrapeModalOpen, setIsScrapeModalOpen] = React.useState(false);
  const [isNewIncomeModalOpen, setIsNewIncomeModalOpen] = React.useState(false);

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleAddNewIncome = async (incomeName: string, amount: number, date: Date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      
      const response = await fetch("/api/income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          income_type: incomeName,
          amount: amount,
          date: formattedDate
        }),
      });

      if (response.ok) {
        setIsNewIncomeModalOpen(false);
        // Refresh the page to show the new income
        window.location.reload();
      } else {
        console.error("Failed to add new income");
      }
    } catch (error) {
      console.error("Error adding new income:", error);
    }
  };

  const handleScrapeSuccess = () => {
    // Dispatch a custom event to trigger data refresh
    window.dispatchEvent(new CustomEvent('dataRefresh'));
  };

  return (
    <>
      <StyledAppBar position="fixed">
        <Container maxWidth={false}>
          <Toolbar disableGutters sx={{ minHeight: '64px' }}>
            <Logo
              variant="h4"
              noWrap
              onClick={redirectTo("/")}
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: '24px' }} />
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
              <DatabaseIndicator />
              <NavButton
                onClick={() => setIsNewIncomeModalOpen(true)}
                startIcon={<AddIcon />}
              >
                New Income
              </NavButton>
              <NavButton
                onClick={() => setIsScrapeModalOpen(true)}
                startIcon={<SyncIcon />}
              >
                Scrape
              </NavButton>
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
            </Box>
          </Toolbar>
        </Container>
      </StyledAppBar>
      <ScrapeModal
        isOpen={isScrapeModalOpen}
        onClose={() => setIsScrapeModalOpen(false)}
        onSuccess={handleScrapeSuccess}
      />
      <NewIncomeModal
        open={isNewIncomeModalOpen}
        onClose={() => setIsNewIncomeModalOpen(false)}
        onSave={handleAddNewIncome}
      />
    </>
  );
}

export default ResponsiveAppBar;
