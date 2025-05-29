import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MuiHeader from './MuiHeader';
import MuiNavigation from './MuiNavigation';
import { useAuth } from '../contexts/AuthContext';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0055FF',
      dark: '#1E0B5E',
      light: '#00C2CB',
    },
    secondary: {
      main: '#00C2CB',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F5F7FA',
    },
    text: {
      primary: '#1A1D21',
      secondary: '#4A5056',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

const MuiLayout = ({ children }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <MuiHeader user={user} onLogout={handleLogout} />
        <Box sx={{ display: 'flex', flex: 1 }}>
          <MuiNavigation />
          <Box component="main" sx={{ flexGrow: 1 }}>
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default MuiLayout;
