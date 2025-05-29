import { createTheme } from '@mui/material/styles';

// Simplified theme for testing
const theme = createTheme({
  palette: {
    primary: {
      main: '#0055FF', // Primary Blue
    },
    secondary: {
      main: '#00C2CB', // Teal Accent
    },
    background: {
      default: '#FFFFFF', // Background White
      paper: '#F5F7FA', // Light Gray
    },
    text: {
      primary: '#1A1D21', // Off-Black
      secondary: '#4A5056', // Charcoal
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '24px',
      fontWeight: 700,
    },
    body1: {
      fontSize: '14px',
      fontWeight: 400,
    },
  },
});

export default theme;
