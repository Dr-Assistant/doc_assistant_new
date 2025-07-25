import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Get the root element
const container = document.getElementById('root');

// Create root and render
const root = createRoot(container);

// Render the App component
root.render(<App />);
