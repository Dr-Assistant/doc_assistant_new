import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './Dashboard';
import Login from './Login';

// Main layout with navigation and sidebar
const MainLayout = ({ children }) => {
  return (
    <>
      <nav style={{
        backgroundColor: '#0055FF',
        color: 'white',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '20px' }}>Dr. Assistant</div>
        <div>
          <button style={{
            backgroundColor: 'transparent',
            border: '1px solid white',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Dr. John Doe
          </button>
        </div>
      </nav>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <div style={{
          width: '240px',
          backgroundColor: '#F5F7FA',
          minHeight: 'calc(100vh - 60px)',
          padding: '20px',
          boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: '#0055FF',
                color: 'white',
                marginBottom: '5px'
              }}>
                Dashboard
              </div>
            </Link>
            <div style={{ padding: '10px', marginBottom: '5px' }}>Schedule</div>
            <div style={{ padding: '10px', marginBottom: '5px' }}>Patients</div>
            <div style={{ padding: '10px', marginBottom: '5px' }}>Tasks</div>
            <div style={{ padding: '10px', marginBottom: '5px' }}>Encounters</div>
            <div style={{ padding: '10px', marginBottom: '5px' }}>Settings</div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </>
  );
};

function App() {
  // Mock authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to handle login
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Function to handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <div className="App">
      <Router>
        <Routes>
          {/* Login route */}
          <Route path="/login" element={
            isAuthenticated ?
              <Navigate to="/dashboard" replace /> :
              <Login onLogin={handleLogin} />
          } />

          {/* Dashboard route (protected) */}
          <Route path="/dashboard" element={
            isAuthenticated ?
              <MainLayout>
                <Dashboard />
              </MainLayout> :
              <Navigate to="/login" replace />
          } />

          {/* Default route */}
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
