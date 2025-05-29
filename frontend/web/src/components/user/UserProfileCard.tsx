import React from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Chip,
  Box,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import { UserProfile } from '../../services/user.service';

interface UserProfileCardProps {
  user: UserProfile;
  onEdit?: () => void;
  showEditButton?: boolean;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  onEdit,
  showEditButton = true
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'primary';
      case 'admin':
        return 'secondary';
      case 'nurse':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              fontSize: '2rem',
              bgcolor: 'primary.main',
              mr: 2
            }}
          >
            {user.full_name?.charAt(0) || 'U'}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {user.full_name || 'Unknown User'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  @{user.username}
                </Typography>
              </Box>
              
              {showEditButton && onEdit && (
                <Tooltip title="Edit Profile">
                  <IconButton onClick={onEdit} size="small">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip
                label={user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'Unknown'}
                color={getRoleColor(user.role)}
                size="small"
              />
              <Chip
                label={user.status?.charAt(0).toUpperCase() + user.status?.slice(1) || 'Unknown'}
                color={getStatusColor(user.status)}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EmailIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.2rem' }} />
              <Typography variant="body2" color="text.secondary">
                {user.email || 'No email provided'}
              </Typography>
            </Box>
          </Grid>
          
          {user.phone && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PhoneIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.2rem' }} />
                <Typography variant="body2" color="text.secondary">
                  {user.phone}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {user.specialty && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WorkIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.2rem' }} />
                <Typography variant="body2" color="text.secondary">
                  {user.specialty}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;
