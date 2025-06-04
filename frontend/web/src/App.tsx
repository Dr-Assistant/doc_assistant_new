import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import ThemeToggle from './components/ThemeToggle'; // Import ThemeToggle

const App: React.FC = () => {
  console.log('App component rendering');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Router>
          <AuthProvider>
            {/* Header with theme toggle */}
            <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Doc Assistant</h1>
              <ThemeToggle />
            </header>
            
            {/* Main content */}
            <main className="bg-gray-100 dark:bg-gray-900 min-h-screen">
              <AppRoutes />
            </main>
          </AuthProvider>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
