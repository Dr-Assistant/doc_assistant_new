import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Person as PatientIcon,
  Assignment as TaskIcon,
  MedicalServices as EncounterIcon,
  Security as ConsentIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Mic as VoiceIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const mainNavItems: NavItem[] = [
    { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { title: 'Schedule', path: '/schedule', icon: <CalendarIcon /> },
    { title: 'Patients', path: '/patients', icon: <PatientIcon /> },
    { title: 'Tasks', path: '/tasks', icon: <TaskIcon /> },
    { title: 'Encounters', path: '/encounters', icon: <EncounterIcon /> },
    { title: 'ABDM Consent', path: '/consent', icon: <ConsentIcon /> }
  ];

  const secondaryNavItems: NavItem[] = [
    { title: 'Voice Demo', path: '/voice-recording-demo', icon: <VoiceIcon /> },
    { title: 'Settings', path: '/settings', icon: <SettingsIcon /> },
    { title: 'Help', path: '/help', icon: <HelpIcon /> }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const drawerWidth = open ? 240 : 64;

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => (
      <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
        <Tooltip title={open ? '' : item.title} placement="right">
          <ListItemButton
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
              backgroundColor: isActive(item.path) ? 'rgba(0, 85, 255, 0.08)' : 'transparent',
              '&:hover': {
                backgroundColor: isActive(item.path) ? 'rgba(0, 85, 255, 0.12)' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : 'auto',
                justifyContent: 'center',
                color: isActive(item.path) ? 'primary.main' : 'inherit'
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.title}
              sx={{
                opacity: open ? 1 : 0,
                color: isActive(item.path) ? 'primary.main' : 'inherit'
              }}
            />
          </ListItemButton>
        </Tooltip>
      </ListItem>
    ));
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
          overflowX: 'hidden',
          mt: '64px',
          height: 'calc(100% - 64px)'
        }
      }}
      open={open}
    >
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {renderNavItems(mainNavItems)}
        </List>
        <Divider />
        <List>
          {renderNavItems(secondaryNavItems)}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
