import type { AppProps } from 'next/app';
import { AuthProvider, useAuth } from '../components/AuthContext';
import LoginPage from '../components/LoginPage';
import { Box, CircularProgress } from '@mui/material';
import '../styles/globals.css';

function AppContent({ Component, pageProps }: AppProps) {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={login} />;
  }

  return <Component {...pageProps} />;
}

function MyApp(props: AppProps) {
  return (
    <AuthProvider>
      <AppContent {...props} />
    </AuthProvider>
  );
}

export default MyApp;

