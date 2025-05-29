/**
 * Task List Component
 * Displays pending tasks with priority indicators
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Button,
  Tooltip,
  Avatar,
  Divider
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Reviews as ReviewIcon,
  TrendingUp as FollowUpIcon,
  LocalHospital as ReferralIcon,
  ShoppingCart as OrderIcon,
  MoreHoriz as OtherIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Add as AddIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';
import { format, parseISO, isToday, isPast } from 'date-fns';
import type { Task } from '../../services/dashboard.service';
import type { TaskPriority } from '../../types/dashboard.types';

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
  showAll?: boolean;
  maxItems?: number;
  loading?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskClick,
  onTaskComplete,
  showAll = false,
  maxItems = 5,
  loading = false
}) => {
  const [showCompleted, setShowCompleted] = useState(false);

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'documentation': return <AssignmentIcon />;
      case 'review': return <ReviewIcon />;
      case 'follow_up': return <FollowUpIcon />;
      case 'referral': return <ReferralIcon />;
      case 'order': return <OrderIcon />;
      default: return <OtherIcon />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getPriorityWeight = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = parseISO(dueDate);
    if (isToday(date)) {
      return 'Due today';
    }
    if (isPast(date)) {
      return 'Overdue';
    }
    return `Due ${format(date, 'MMM d')}`;
  };

  const getDueDateColor = (dueDate: string) => {
    const date = parseISO(dueDate);
    if (isPast(date)) {
      return 'error.main';
    }
    if (isToday(date)) {
      return 'warning.main';
    }
    return 'text.secondary';
  };

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => showCompleted || task.status !== 'completed')
    .sort((a, b) => {
      // Sort by overdue first, then priority, then due date
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;

      const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      if (priorityDiff !== 0) return priorityDiff;

      if (a.dueDate && b.dueDate) {
        return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
      }

      return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
    });

  const displayTasks = showAll ? filteredTasks : filteredTasks.slice(0, maxItems);
  const hasMoreTasks = filteredTasks.length > maxItems;

  if (loading) {
    return (
      <Card>
        <CardHeader title="Pending Tasks" />
        <CardContent>
          <Typography color="textSecondary">Loading tasks...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Pending Tasks"
        subheader={`${filteredTasks.length} tasks pending`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
            >
              Add Task
            </Button>
            {!showAll && hasMoreTasks && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<ViewListIcon />}
              >
                View All
              </Button>
            )}
          </Box>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {filteredTasks.length === 0 ? (
          <Box textAlign="center" py={4}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              All tasks completed!
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Great job staying on top of your tasks.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {displayTasks.map((task, index) => (
              <Box key={task.id}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 1.5,
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'grey.50'
                    }
                  }}
                  onClick={() => onTaskClick?.(task)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: task.isOverdue ? 'error.main' : 'primary.main'
                      }}
                    >
                      {getTaskIcon(task.taskType)}
                    </Avatar>
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {task.title}
                        </Typography>
                        {task.isOverdue && (
                          <Tooltip title="Overdue">
                            <WarningIcon sx={{ fontSize: 16, color: 'error.main' }} />
                          </Tooltip>
                        )}
                        {task.isDueToday && !task.isOverdue && (
                          <Tooltip title="Due today">
                            <ScheduleIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        {task.description && (
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                            {task.description}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          {/* Priority */}
                          <Chip
                            label={task.priority}
                            size="small"
                            color={getPriorityColor(task.priority)}
                            variant="outlined"
                          />

                          {/* Task Type */}
                          <Chip
                            label={task.taskType.replace('_', ' ')}
                            size="small"
                            variant="outlined"
                          />

                          {/* Patient */}
                          {task.patientName && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="textSecondary">
                                {task.patientName}
                              </Typography>
                            </Box>
                          )}

                          {/* Due Date */}
                          {task.dueDate && (
                            <Typography
                              variant="caption"
                              sx={{ color: getDueDateColor(task.dueDate) }}
                            >
                              {formatDueDate(task.dueDate)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    }
                  />

                  <ListItemSecondaryAction>
                    <Tooltip title="Mark as completed">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskComplete?.(task.id);
                        }}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>

                {index < displayTasks.length - 1 && (
                  <Divider sx={{ my: 0.5 }} />
                )}
              </Box>
            ))}
          </List>
        )}

        {!showAll && hasMoreTasks && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button variant="text" size="small">
              View {filteredTasks.length - maxItems} more tasks
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskList;
