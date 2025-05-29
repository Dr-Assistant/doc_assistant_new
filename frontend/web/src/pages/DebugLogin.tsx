/**
 * Debug Login Page
 * Simple login page for debugging authentication issues
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert
} from '@mui/material';

const DebugLogin: React.FC = () => {
  const [username, setUsername] = useState('testdoctor');
  const [password, setPassword] = useState('TestPassword123!');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Debug Login: Starting test login...');
      console.log('🧪 Debug Login: Username:', username);
      console.log('🧪 Debug Login: Password length:', password.length);

      // Test basic connectivity first
      console.log('🧪 Debug Login: Testing connectivity...');

      // Make direct API call
      const response = await fetch('http://localhost:8020/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      console.log('🧪 Debug Login: Response received');
      console.log('🧪 Debug Login: Response status:', response.status);
      console.log('🧪 Debug Login: Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('🧪 Debug Login: Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('🧪 Debug Login: Parsed data:', data);
      } catch (parseError) {
        console.error('🧪 Debug Login: JSON parse error:', parseError);
        setError('Invalid JSON response: ' + responseText);
        return;
      }

      if (data.success) {
        console.log('🧪 Debug Login: Login successful, storing data...');

        // Store in localStorage
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        console.log('🧪 Debug Login: Data stored in localStorage');

        setResult({
          success: true,
          user: data.data.user,
          token: data.data.token.substring(0, 20) + '...',
          stored: {
            token: localStorage.getItem('token')?.substring(0, 20) + '...',
            user: JSON.parse(localStorage.getItem('user') || '{}')
          }
        });

        console.log('🧪 Debug Login: Will redirect in 3 seconds...');
        // Try to navigate
        setTimeout(() => {
          console.log('🧪 Debug Login: Redirecting now...');
          window.location.href = '/dashboard';
        }, 3000);
      } else {
        console.error('🧪 Debug Login: Login failed:', data);
        setError('Login failed: ' + JSON.stringify(data));
      }
    } catch (err) {
      console.error('🧪 Debug Login: Network/Fetch error:', err);
      setError('Network error: ' + (err as Error).message);

      // Additional debugging
      setResult({
        error: true,
        message: (err as Error).message,
        stack: (err as Error).stack
      });
    } finally {
      setLoading(false);
    }
  };

  const checkLocalStorage = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    setResult({
      localStorage: {
        token: token ? token.substring(0, 20) + '...' : 'Not found',
        user: user ? JSON.parse(user) : 'Not found'
      }
    });
  };

  const clearStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setResult({ message: 'Storage cleared' });
  };

  const testConnectivity = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing basic connectivity to backend...');

      // Test health endpoint first
      const healthResponse = await fetch('http://localhost:8020/health', {
        method: 'GET'
      });

      console.log('🧪 Health check status:', healthResponse.status);
      const healthData = await healthResponse.text();
      console.log('🧪 Health check response:', healthData);

      setResult({
        connectivity: 'SUCCESS',
        healthStatus: healthResponse.status,
        healthResponse: healthData,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('🧪 Connectivity test failed:', err);
      setResult({
        connectivity: 'FAILED',
        error: (err as Error).message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          🧪 Debug Login
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test Login'}
          </Button>

          <Button
            variant="outlined"
            onClick={testConnectivity}
            disabled={loading}
          >
            Test Connection
          </Button>

          <Button
            variant="outlined"
            onClick={checkLocalStorage}
          >
            Check Storage
          </Button>

          <Button
            variant="outlined"
            color="error"
            onClick={clearStorage}
          >
            Clear Storage
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
            <Typography variant="h6" gutterBottom>
              Result:
            </Typography>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Paper>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            This page tests the login API directly without going through the AuthContext.
            Check the browser console for detailed logs.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DebugLogin;
