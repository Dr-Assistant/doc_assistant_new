import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  MenuItem,
  Box,
  Button,
  Divider,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { UserPreferences } from '../../services/user.service';

interface UserPreferencesPanelProps {
  preferences: UserPreferences;
  onSave: (preferences: UserPreferences) => Promise<void>;
  loading?: boolean;
}

const UserPreferencesPanel: React.FC<UserPreferencesPanelProps> = ({
  preferences,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState<UserPreferences>(preferences);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSave(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(preferences);
    setError(null);
    setSuccess(false);
  };

  const handleNotificationChange = (type: 'email' | 'sms' | 'push', value: boolean) => {
    setFormData({
      ...formData,
      notifications: {
        ...formData.notifications,
        [type]: value
      }
    });
  };

  const themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto (System)' }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'te', label: 'Telugu' },
    { value: 'ta', label: 'Tamil' },
    { value: 'kn', label: 'Kannada' }
  ];

  return (
    <Card>
      <CardHeader
        title="User Preferences"
        subheader="Customize your application experience"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
              disabled={saving}
              size="small"
            >
              Reset
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving || loading}
              size="small"
            >
              Save
            </Button>
          </Box>
        }
      />
      
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
            Preferences saved successfully!
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Appearance Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Theme"
                  select
                  value={formData.theme || 'light'}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value as 'light' | 'dark' })}
                >
                  {themes.map((theme) => (
                    <MenuItem key={theme.value} value={theme.value}>
                      {theme.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Language"
                  select
                  value={formData.language || 'en'}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                >
                  {languages.map((language) => (
                    <MenuItem key={language.value} value={language.value}>
                      {language.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Grid>

          {/* Notification Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifications?.email || false}
                    onChange={(e) => handleNotificationChange('email', e.target.checked)}
                  />
                }
                label="Email Notifications"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                Receive notifications via email for appointments, reminders, and updates
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifications?.sms || false}
                    onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                  />
                }
                label="SMS Notifications"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                Receive text messages for urgent notifications and reminders
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notifications?.push || false}
                    onChange={(e) => handleNotificationChange('push', e.target.checked)}
                  />
                }
                label="Push Notifications"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                Receive browser push notifications when the app is open
              </Typography>
            </Box>
          </Grid>

          {/* Additional Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Additional Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Timezone"
                  value={formData.timezone || 'Asia/Kolkata'}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  helperText="Your local timezone for scheduling"
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default UserPreferencesPanel;
