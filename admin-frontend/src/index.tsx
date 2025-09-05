// REQUIREMENT: Secure administrative interface entry point
// PURPOSE: Initialize admin UI with security checks and authentication
// This ensures only authorized personnel can access administrative functions

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Alert, AlertTitle } from '@mui/material';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SecurityProvider } from './contexts/SecurityContext';
import './index.css';

// Security check - ensure this is running in admin environment
const isAdminEnvironment = process.env.REACT_APP_ENV === 'admin';
const isDevelopment = process.env.NODE_ENV === 'development';

if (!isAdminEnvironment && !isDevelopment) {
  console.error('SECURITY VIOLATION: Admin interface accessed from non-admin environment');
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; color: red;">
      <h1>🚫 ACCESS DENIED</h1>
      <p>This administrative interface is not available in this environment.</p>
      <p>All access attempts are logged and monitored.</p>
    </div>
  `;
  throw new Error('Admin interface access denied');
}

// Admin-specific theme with security indicators
const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#d32f2f', // Red theme for admin to distinguish from public UI
    },
    secondary: {
      main: '#ff9800',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#d32f2f',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#d32f2f',
          '&::before': {
            content: '"🔒 ADMIN"',
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.875rem',
          },
        },
      },
    },
  },
});

// React Query client with admin-specific configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds - more frequent updates for admin
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: true, // Important for admin monitoring
    },
    mutations: {
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Security warning component
function SecurityWarning() {
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      <AlertTitle>Administrative Interface</AlertTitle>
      You are accessing the EconGraph administrative interface. All actions are logged and monitored.
      Unauthorized access is prohibited and may result in legal action.
    </Alert>
  );
}

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={adminTheme}>
        <CssBaseline />
        <BrowserRouter>
          <SecurityProvider>
            <AuthProvider>
              <SecurityWarning />
              <App />
            </AuthProvider>
          </SecurityProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

// Security monitoring - log all admin interface access
console.log('🔒 Admin interface initialized', {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href,
});

// Disable right-click context menu in production
if (process.env.NODE_ENV === 'production') {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    console.warn('Context menu disabled in admin interface for security');
  });
}

// Disable F12 developer tools in production (basic deterrent)
if (process.env.NODE_ENV === 'production') {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
      e.preventDefault();
      console.warn('Developer tools access attempt blocked');
    }
  });
}
