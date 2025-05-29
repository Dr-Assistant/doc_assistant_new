import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Tab,
  Tabs,
  Paper,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import userService, { UserProfile, UserPreferences, UserUpdateData } from '../services/user.service';
import { UserProfileCard, UserPreferencesPanel, UserEditDialog } from '../components/user';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileData, preferencesData] = await Promise.all([
        userService.getCurrentUser(),
        userService.getUserPreferences()
      ]);

      setUserProfile(profileData);
      setUserPreferences(preferencesData);

    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (userData: UserUpdateData) => {
    try {
      const updatedProfile = await userService.updateCurrentUser(userData);
      setUserProfile(updatedProfile);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      throw err; // Let the dialog handle the error
    }
  };

  const handleUpdatePreferences = async (preferences: UserPreferences) => {
    try {
      const updatedPreferences = await userService.updateUserPreferences(preferences);
      setUserPreferences(updatedPreferences);
      setSuccess('Preferences updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/dashboard">
          Dashboard
        </Link>
        <Typography color="text.primary">Settings</Typography>
      </Breadcrumbs>

      <Typography variant="h1" gutterBottom>
        Settings
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

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="settings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<PersonIcon />}
            label="Profile"
            id="settings-tab-0"
            aria-controls="settings-tabpanel-0"
          />
          <Tab
            icon={<SettingsIcon />}
            label="Preferences"
            id="settings-tab-1"
            aria-controls="settings-tabpanel-1"
          />
          <Tab
            icon={<SecurityIcon />}
            label="Security"
            id="settings-tab-2"
            aria-controls="settings-tabpanel-2"
          />
          <Tab
            icon={<NotificationsIcon />}
            label="Notifications"
            id="settings-tab-3"
            aria-controls="settings-tabpanel-3"
          />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              {userProfile && (
                <UserProfileCard
                  user={userProfile}
                  onEdit={() => setEditDialogOpen(true)}
                  showEditButton={true}
                />
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Your account was created on {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Unknown'}.
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Last updated: {userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleDateString() : 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  User ID: {userProfile?.id}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Preferences Tab */}
        <TabPanel value={tabValue} index={1}>
          {userPreferences && (
            <UserPreferencesPanel
              preferences={userPreferences}
              onSave={handleUpdatePreferences}
              loading={loading}
            />
          )}
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Security settings will be implemented in a future update. This will include password change,
              two-factor authentication, and session management.
            </Typography>
          </Paper>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Detailed notification settings are available in the Preferences tab.
              Advanced notification rules and scheduling will be added in future updates.
            </Typography>
          </Paper>
        </TabPanel>
      </Paper>

      {/* Edit Profile Dialog */}
      <UserEditDialog
        open={editDialogOpen}
        user={userProfile}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleUpdateProfile}
        loading={loading}
      />
    </Box>
  );
};

export default Settings;
