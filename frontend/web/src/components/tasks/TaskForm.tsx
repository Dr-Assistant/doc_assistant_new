/**
 * Task Form Component
 * Form for creating and editing tasks
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Autocomplete
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon
} from '@mui/icons-material';

import { Task, TaskFormData } from '../../types/task.types';
import { format, addDays } from 'date-fns';

interface TaskFormProps {
  open: boolean;
  task?: Task | null;
  onClose: () => void;
  onSave: (taskData: TaskFormData) => Promise<void>;
  loading?: boolean;
  patients?: Array<{ id: string; name: string }>;
}

const TaskForm: React.FC<TaskFormProps> = ({
  open,
  task,
  onClose,
  onSave,
  loading = false,
  patients = []
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    taskType: 'other',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
    patientId: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (open) {
      if (task) {
        // Editing existing task
        setFormData({
          title: task.title,
          description: task.description || '',
          taskType: task.taskType,
          priority: task.priority,
          dueDate: task.dueDate || '',
          assignedTo: task.assignedTo || '',
          patientId: task.patientId || '',
          notes: task.notes || ''
        });
      } else {
        // Creating new task
        setFormData({
          title: '',
          description: '',
          taskType: 'other',
          priority: 'medium',
          dueDate: '',
          assignedTo: '',
          patientId: '',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [open, task]);

  const taskTypes = [
    { value: 'documentation', label: 'Documentation' },
    { value: 'review', label: 'Review' },
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'referral', label: 'Referral' },
    { value: 'order', label: 'Order' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#4caf50' },
    { value: 'medium', label: 'Medium', color: '#2196f3' },
    { value: 'high', label: 'High', color: '#ff9800' },
    { value: 'urgent', label: 'Urgent', color: '#f44336' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (!formData.taskType) {
      newErrors.taskType = 'Task type is required';
    }

    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof TaskFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  const handleSelectChange = (field: keyof TaskFormData) => (
    event: any
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  const handleDateChange = (value: string) => {
    const isoDate = value ? new Date(value).toISOString() : '';
    setFormData({
      ...formData,
      dueDate: isoDate
    });

    // Clear error for this field
    if (errors.dueDate) {
      setErrors({
        ...errors,
        dueDate: ''
      });
    }
  };

  const handlePatientChange = (event: any, value: any) => {
    setFormData({
      ...formData,
      patientId: value?.id || ''
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="task-form-dialog-title"
    >
      <DialogTitle id="task-form-dialog-title">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {task ? 'Edit Task' : 'Create New Task'}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            size="small"
            disabled={saving}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Title"
                value={formData.title}
                onChange={handleInputChange('title')}
                error={!!errors.title}
                helperText={errors.title}
                required
                disabled={saving}
                placeholder="Enter a descriptive title for the task"
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                multiline
                rows={3}
                disabled={saving}
                placeholder="Provide additional details about the task"
              />
            </Grid>

            {/* Task Type and Priority */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.taskType}>
                <InputLabel>Task Type</InputLabel>
                <Select
                  value={formData.taskType}
                  onChange={handleSelectChange('taskType')}
                  label="Task Type"
                  disabled={saving}
                >
                  {taskTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={handleSelectChange('priority')}
                  label="Priority"
                  disabled={saving}
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: priority.color
                          }}
                        />
                        {priority.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Due Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="datetime-local"
                value={formData.dueDate ? formData.dueDate.slice(0, 16) : ''}
                onChange={(e) => handleDateChange(e.target.value)}
                error={!!errors.dueDate}
                helperText={errors.dueDate}
                disabled={saving}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* Patient */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={patients}
                getOptionLabel={(option) => option.name}
                value={patients.find(p => p.id === formData.patientId) || null}
                onChange={handlePatientChange}
                disabled={saving}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Patient"
                    placeholder="Select a patient (optional)"
                  />
                )}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={handleInputChange('notes')}
                multiline
                rows={2}
                disabled={saving}
                placeholder="Additional notes or instructions"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || loading}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {saving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskForm;
