import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';

// Log when index.tsx is executed
console.log('index.tsx is executing');

// Try to log using the debug function
if (typeof window !== 'undefined' && (window as any).debugLog) {
  (window as any).debugLog('index.tsx is executing');
}

try {
  // Get the root element
  const container = document.getElementById('root');

  // Log if container was found
  console.log('Root container found:', !!container);

  if (typeof window !== 'undefined' && (window as any).debugLog) {
    (window as any).debugLog(`Root container found: ${!!container}`);
  }

  if (!container) {
    throw new Error('Root element not found');
  }

  // Create root and render
  const root = createRoot(container);

  console.log('Root created, about to render App');

  if (typeof window !== 'undefined' && (window as any).debugLog) {
    (window as any).debugLog('Root created, about to render App');
  }

  // Render without StrictMode for simplicity
  root.render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );

  console.log('App rendered');

  if (typeof window !== 'undefined' && (window as any).debugLog) {
    (window as any).debugLog('App rendered');
  }
} catch (error) {
  // Log any errors
  console.error('Error in index.tsx:', error);

  if (typeof window !== 'undefined' && (window as any).debugLog) {
    (window as any).debugLog(`Error in index.tsx: ${error}`);
  }

  // Try to display error on page
  const errorDisplay = document.getElementById('error-display');
  if (errorDisplay) {
    errorDisplay.style.display = 'block';
    errorDisplay.innerHTML += `<strong>RENDER ERROR:</strong> ${error}<br>
                              <strong>Stack:</strong> ${(error as any)?.stack || 'No stack trace'}<br><hr>`;
  }
}
