import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  Divider,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Edit as EditIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import userService, { UserProfile, UserUpdateData, UserPreferences } from '../services/user.service';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit profile dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UserUpdateData>({});
  const [editLoading, setEditLoading] = useState(false);

  // Preferences dialog
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
  const [preferencesFormData, setPreferencesFormData] = useState<UserPreferences>({});
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  // Load user profile and preferences
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user profile and preferences in parallel
      const [profileData, preferencesData] = await Promise.all([
        userService.getCurrentUser(),
        userService.getUserPreferences()
      ]);

      setUserProfile(profileData);
      setUserPreferences(preferencesData);

      // Initialize form data
      setEditFormData({
        full_name: profileData.full_name,
        specialty: profileData.specialty,
        phone: profileData.phone
      });

      setPreferencesFormData(preferencesData);

    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    try {
      setEditLoading(true);
      setError(null);

      const updatedProfile = await userService.updateCurrentUser(editFormData);
      setUserProfile(updatedProfile);
      setEditDialogOpen(false);
      setSuccess('Profile updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      setPreferencesLoading(true);
      setError(null);

      const updatedPreferences = await userService.updateUserPreferences(preferencesFormData);
      setUserPreferences(updatedPreferences);
      setPreferencesDialogOpen(false);
      setSuccess('Preferences updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setPreferencesLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h1" gutterBottom>
        Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h2">
                Personal Information
              </Typography>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditDialogOpen(true)}
              >
                Edit Profile
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Full Name
                </Typography>
                <Typography variant="body1">
                  {userProfile?.full_name || 'Not provided'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Email
                </Typography>
                <Typography variant="body1">
                  {userProfile?.email || 'Not provided'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Username
                </Typography>
                <Typography variant="body1">
                  {userProfile?.username || 'Not provided'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Role
                </Typography>
                <Chip
                  label={userProfile?.role ? `${userProfile.role.charAt(0).toUpperCase()}${userProfile.role.slice(1)}` : 'Not provided'}
                  color="primary"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Specialty
                </Typography>
                <Typography variant="body1">
                  {userProfile?.specialty || 'Not provided'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Phone
                </Typography>
                <Typography variant="body1">
                  {userProfile?.phone || 'Not provided'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={userProfile?.status || 'Unknown'}
                  color={userProfile?.status === 'active' ? 'success' : 'default'}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* User Avatar and Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mb: 2,
                fontSize: '3rem',
                bgcolor: 'primary.main',
                mx: 'auto'
              }}
            >
              {userProfile?.full_name?.charAt(0) || 'U'}
            </Avatar>
            <Typography variant="h4" gutterBottom>
              {userProfile?.full_name || 'User Name'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {userProfile?.role ? `${userProfile.role.charAt(0).toUpperCase()}${userProfile.role.slice(1)}` : 'Role'}
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<SettingsIcon />}
                onClick={() => setPreferencesDialogOpen(true)}
                fullWidth
              >
                Preferences
              </Button>
            </Box>
          </Paper>

          {/* Preferences Summary */}
          {userPreferences && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Preferences
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Theme
                    </Typography>
                    <Typography variant="body2">
                      {userPreferences.theme || 'Default'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Language
                    </Typography>
                    <Typography variant="body2">
                      {userPreferences.language || 'English'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={editFormData.full_name || ''}
              onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Specialty"
              value={editFormData.specialty || ''}
              onChange={(e) => setEditFormData({ ...editFormData, specialty: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone"
              value={editFormData.phone || ''}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEditProfile}
            variant="contained"
            disabled={editLoading}
          >
            {editLoading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preferences Dialog */}
      <Dialog open={preferencesDialogOpen} onClose={() => setPreferencesDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>User Preferences</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Theme"
              select
              value={preferencesFormData.theme || 'light'}
              onChange={(e) => setPreferencesFormData({ ...preferencesFormData, theme: e.target.value as 'light' | 'dark' })}
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </TextField>

            <TextField
              fullWidth
              label="Language"
              value={preferencesFormData.language || 'en'}
              onChange={(e) => setPreferencesFormData({ ...preferencesFormData, language: e.target.value })}
              margin="normal"
            />

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Notifications
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferencesFormData.notifications?.email || false}
                    onChange={(e) => setPreferencesFormData({
                      ...preferencesFormData,
                      notifications: {
                        ...preferencesFormData.notifications,
                        email: e.target.checked
                      }
                    })}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferencesFormData.notifications?.sms || false}
                    onChange={(e) => setPreferencesFormData({
                      ...preferencesFormData,
                      notifications: {
                        ...preferencesFormData.notifications,
                        sms: e.target.checked
                      }
                    })}
                  />
                }
                label="SMS Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferencesFormData.notifications?.push || false}
                    onChange={(e) => setPreferencesFormData({
                      ...preferencesFormData,
                      notifications: {
                        ...preferencesFormData.notifications,
                        push: e.target.checked
                      }
                    })}
                  />
                }
                label="Push Notifications"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreferencesDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdatePreferences}
            variant="contained"
            disabled={preferencesLoading}
          >
            {preferencesLoading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
