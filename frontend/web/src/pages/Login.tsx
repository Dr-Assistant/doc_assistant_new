import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid as MuiGrid,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Divider,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined as LockIcon,
  VpnKey as KeyIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials } from '../services/auth.service';

// Create a Grid component that accepts 'item' prop
const Grid = (props: any) => <MuiGrid {...props} />;

const Login: React.FC = () => {
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // MFA state
  const [mfaCode, setMfaCode] = useState('');

  // Form validation
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [mfaError, setMfaError] = useState('');

  // Auth context
  const {
    login,
    verifyMFA,
    isAuthenticated,
    isLoading,
    error,
    requireMFA,
    tempMFAData
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Validate form
  const validateForm = (): boolean => {
    let isValid = true;

    // Validate username
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else {
      setUsernameError('');
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  // Validate MFA code
  const validateMFACode = (): boolean => {
    if (!mfaCode.trim()) {
      setMfaError('Verification code is required');
      return false;
    } else if (!/^\d{6}$/.test(mfaCode)) {
      setMfaError('Verification code must be 6 digits');
      return false;
    } else {
      setMfaError('');
      return true;
    }
  };

  // Handle login form submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const credentials: LoginCredentials = {
        username,
        password
      };

      await login(credentials);

      // Store username in localStorage if rememberMe is checked
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }
    }
  };

  // Handle MFA form submission
  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateMFACode() && tempMFAData) {
      await verifyMFA({
        userId: tempMFAData.userId,
        code: mfaCode
      });
    }
  };

  // Load remembered username on component mount
  useEffect(() => {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberMe(true);
    }
  }, []);

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h1" color="primary" gutterBottom>
            Dr. Assistant
          </Typography>

          {/* Stepper for login flow */}
          {requireMFA && (
            <Stepper activeStep={1} sx={{ width: '100%', mb: 3 }}>
              <Step>
                <StepLabel>Login</StepLabel>
              </Step>
              <Step>
                <StepLabel>Verification</StepLabel>
              </Step>
            </Stepper>
          )}

          {/* Login Form */}
          {!requireMFA ? (
            <>
              <LockIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography component="h2" variant="h2" gutterBottom>
                Login
              </Typography>

              {error && (
                <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleLoginSubmit} sx={{ mt: 1, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username or Email"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  error={!!usernameError}
                  helperText={usernameError}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  error={!!passwordError}
                  helperText={passwordError}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={isLoading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      value="remember"
                      color="primary"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                    />
                  }
                  label="Remember me"
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <Grid container>
                  <Grid item xs>
                    <Link href="#" variant="body2">
                      Forgot password?
                    </Link>
                  </Grid>
                  <Grid item>
                    <Link component={RouterLink} to="/register" variant="body2">
                      {"Don't have an account? Sign Up"}
                    </Link>
                  </Grid>
                </Grid>

                {process.env.NODE_ENV === 'development' && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Development Login:
                    </Typography>
                    <Typography variant="caption" display="block">
                      Username: doctor
                    </Typography>
                    <Typography variant="caption" display="block">
                      Password: password
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          ) : (
            /* MFA Verification Form */
            <>
              <KeyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography component="h2" variant="h2" gutterBottom>
                Two-Factor Authentication
              </Typography>
              <Typography variant="body1" align="center" sx={{ mb: 2 }}>
                Please enter the verification code from your authenticator app.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleMFASubmit} sx={{ mt: 1, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="mfaCode"
                  label="Verification Code"
                  name="mfaCode"
                  autoComplete="one-time-code"
                  autoFocus
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  disabled={isLoading}
                  error={!!mfaError}
                  helperText={mfaError}
                  inputProps={{
                    maxLength: 6,
                    inputMode: 'numeric',
                    pattern: '[0-9]*'
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Verify'
                  )}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                  onClick={() => window.location.reload()}
                  disabled={isLoading}
                >
                  Back to Login
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
