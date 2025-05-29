-- Tasks Table Migration
-- Creates the tasks table for task management functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id UUID, -- References encounters table (to be created later)
    due_date TIMESTAMP,
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(15) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('documentation', 'review', 'follow_up', 'referral', 'order', 'other')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_due_date CHECK (due_date IS NULL OR due_date > created_at),
    CONSTRAINT valid_completed_at CHECK (completed_at IS NULL OR completed_at >= created_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_patient_id ON tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_tasks_encounter_id ON tasks(encounter_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks(status, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_patient_status ON tasks(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date_status ON tasks(due_date, status) WHERE due_date IS NOT NULL;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Set completed_at when status changes to completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    
    -- Clear completed_at when status changes from completed to something else
    IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically manage completed_at
CREATE TRIGGER set_tasks_completed_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION set_completed_at();

-- Comments for documentation
COMMENT ON TABLE tasks IS 'Stores tasks for doctors including assignments, due dates, and status tracking';
COMMENT ON COLUMN tasks.id IS 'Unique identifier for the task';
COMMENT ON COLUMN tasks.title IS 'Brief title of the task (max 100 characters)';
COMMENT ON COLUMN tasks.description IS 'Detailed description of the task';
COMMENT ON COLUMN tasks.assigned_to IS 'User ID of the person assigned to the task';
COMMENT ON COLUMN tasks.created_by IS 'User ID of the person who created the task';
COMMENT ON COLUMN tasks.patient_id IS 'Patient ID if the task is related to a specific patient';
COMMENT ON COLUMN tasks.encounter_id IS 'Encounter ID if the task is related to a specific encounter';
COMMENT ON COLUMN tasks.due_date IS 'When the task is due to be completed';
COMMENT ON COLUMN tasks.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN tasks.status IS 'Current status: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN tasks.task_type IS 'Type of task: documentation, review, follow_up, referral, order, other';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when the task was completed (automatically set)';

-- Insert some sample data for testing (optional)
-- INSERT INTO tasks (title, description, created_by, task_type, priority, due_date) VALUES
-- ('Complete patient documentation', 'Finish documentation for patient visit', '00000000-0000-0000-0000-000000000001', 'documentation', 'high', NOW() + INTERVAL '2 days'),
-- ('Review lab results', 'Review and interpret lab results for patient', '00000000-0000-0000-0000-000000000001', 'review', 'medium', NOW() + INTERVAL '1 day'),
-- ('Schedule follow-up', 'Schedule follow-up appointment for patient', '00000000-0000-0000-0000-000000000001', 'follow_up', 'low', NOW() + INTERVAL '1 week');
