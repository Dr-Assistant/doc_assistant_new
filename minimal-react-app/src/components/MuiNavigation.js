import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, ListItemIcon } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  MedicalServices as MedicalServicesIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const MuiNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define navigation items
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Patients', icon: <PeopleIcon />, path: '/patients' },
    { text: 'Schedule', icon: <CalendarIcon />, path: '/schedule' },
    { text: 'Tasks', icon: <AssignmentIcon />, path: '/tasks' },
    { text: 'Encounters', icon: <MedicalServicesIcon />, path: '/encounters' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
  ];

  // Determine selected index based on current path
  const getSelectedIndex = () => {
    const path = location.pathname;
    const index = navItems.findIndex(item => item.path === path);
    return index >= 0 ? index : 0;
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{
      width: 240,
      backgroundColor: '#F5F7FA',
      minHeight: 'calc(100vh - 64px)',
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
    }}>
      <List component="nav" aria-label="main navigation">
        {navItems.map((item, index) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={getSelectedIndex() === index}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                backgroundColor: getSelectedIndex() === index ? 'primary.main' : 'transparent',
                color: getSelectedIndex() === index ? 'white' : 'inherit',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                }
              }}
            >
              <ListItemIcon sx={{
                color: getSelectedIndex() === index ? 'white' : 'inherit',
                minWidth: '40px'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default MuiNavigation;
