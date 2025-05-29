/**
 * Tasks Page
 * This page displays task management interface
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Chip,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Home as HomeIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import taskService from '../services/task.service';
import { Task, TaskListResponse, TaskSearchParams, TaskFormData } from '../types/task.types';
import TaskForm from '../components/tasks/TaskForm';

const TasksPage: React.FC = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<number>(0);

  // State for tasks data
  const [tasksData, setTasksData] = useState<TaskListResponse | null>(null);

  // State for loading
  const [loading, setLoading] = useState<boolean>(true);

  // State for error
  const [error, setError] = useState<string | null>(null);

  // State for search params
  const [searchParams, setSearchParams] = useState<TaskSearchParams>({
    page: 1,
    limit: 20
  });

  // State for snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // State for task form
  const [taskFormOpen, setTaskFormOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // State for menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Fetch tasks data
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await taskService.getAllTasks(searchParams);
      setTasksData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    // Update search params based on tab
    let status: string | undefined;
    switch (newValue) {
      case 0: // All tasks
        status = undefined;
        break;
      case 1: // Pending
        status = 'pending';
        break;
      case 2: // In Progress
        status = 'in_progress';
        break;
      case 3: // Completed
        status = 'completed';
        break;
    }

    setSearchParams({
      ...searchParams,
      status,
      page: 1
    });
  };

  // Handle complete task
  const handleCompleteTask = async (task: Task) => {
    try {
      await taskService.completeTask(task.id);

      // Refresh tasks
      fetchTasks();

      setSnackbar({
        open: true,
        message: 'Task marked as completed',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to complete task',
        severity: 'error'
      });
    }
  };

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Handle create task
  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskFormOpen(true);
  };

  // Handle edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormOpen(true);
    handleMenuClose();
  };

  // Handle save task
  const handleSaveTask = async (taskData: TaskFormData) => {
    try {
      if (editingTask) {
        // Update existing task
        await taskService.updateTask(editingTask.id, taskData);
        setSnackbar({
          open: true,
          message: 'Task updated successfully',
          severity: 'success'
        });
      } else {
        // Create new task
        await taskService.createTask(taskData);
        setSnackbar({
          open: true,
          message: 'Task created successfully',
          severity: 'success'
        });
      }

      // Refresh tasks
      fetchTasks();
      setTaskFormOpen(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to save task',
        severity: 'error'
      });
    }
  };

  // Handle delete task
  const handleDeleteTask = async (task: Task) => {
    try {
      await taskService.deleteTask(task.id);
      setSnackbar({
        open: true,
        message: 'Task deleted successfully',
        severity: 'success'
      });
      fetchTasks();
      handleMenuClose();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to delete task',
        severity: 'error'
      });
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Fetch tasks on mount and when search params change
  useEffect(() => {
    fetchTasks();
  }, [searchParams]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            component={RouterLink}
            to="/"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Typography color="text.primary">Tasks</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="h4" component="h1">
            Tasks
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTask}
          >
            New Task
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="task tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Tasks" />
          <Tab label="Pending" />
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Typography>Loading tasks...</Typography>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : !tasksData || !tasksData.tasks || tasksData.tasks.length === 0 ? (
            <Typography>No tasks found.</Typography>
          ) : (
            <Grid container spacing={2}>
              {tasksData.tasks?.map((task) => (
                <Grid item xs={12} md={6} lg={4} key={task.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                          {task.title}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, task)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      {task.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {task.description}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={task.priority}
                          color={getPriorityColor(task.priority) as any}
                          size="small"
                          icon={<FlagIcon />}
                        />
                        <Chip
                          label={task.status.replace('_', ' ')}
                          color={getStatusColor(task.status) as any}
                          size="small"
                        />
                        <Chip
                          label={task.taskType.replace('_', ' ')}
                          variant="outlined"
                          size="small"
                        />
                      </Box>

                      {task.dueDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <ScheduleIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      )}

                      <Typography variant="caption" color="text.secondary">
                        Created: {format(new Date(task.createdAt), 'MMM d, yyyy')}
                      </Typography>
                    </CardContent>

                    <CardActions>
                      {task.status !== 'completed' && (
                        <Button
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleCompleteTask(task)}
                        >
                          Complete
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Task Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
        <MenuItem onClick={() => selectedTask && handleEditTask(selectedTask)}>Edit</MenuItem>
        <MenuItem onClick={() => selectedTask && handleDeleteTask(selectedTask)}>Delete</MenuItem>
      </Menu>

      {/* Task Form Dialog */}
      <TaskForm
        open={taskFormOpen}
        task={editingTask}
        onClose={() => setTaskFormOpen(false)}
        onSave={handleSaveTask}
        loading={loading}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TasksPage;
