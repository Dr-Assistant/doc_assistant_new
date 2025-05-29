-- Appointments Table Schema
-- Represents scheduled meetings between doctors and patients

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES users(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    appointment_type VARCHAR(20) NOT NULL,
    reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
    CONSTRAINT valid_type CHECK (appointment_type IN ('in_person', 'telemedicine', 'follow_up', 'urgent', 'routine')),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON appointments(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(DATE(start_time));

-- Trigger for updated_at
CREATE TRIGGER update_appointments_timestamp
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Comments
COMMENT ON TABLE appointments IS 'Scheduled appointments between doctors and patients';
COMMENT ON COLUMN appointments.id IS 'Unique identifier for the appointment';
COMMENT ON COLUMN appointments.doctor_id IS 'Reference to the doctor conducting the appointment';
COMMENT ON COLUMN appointments.patient_id IS 'Reference to the patient attending the appointment';
COMMENT ON COLUMN appointments.start_time IS 'Scheduled start time of the appointment';
COMMENT ON COLUMN appointments.end_time IS 'Scheduled end time of the appointment';
COMMENT ON COLUMN appointments.status IS 'Current status of the appointment';
COMMENT ON COLUMN appointments.appointment_type IS 'Type of appointment (in_person, telemedicine, etc.)';
COMMENT ON COLUMN appointments.reason IS 'Reason for the appointment';
COMMENT ON COLUMN appointments.notes IS 'Additional notes about the appointment';
COMMENT ON COLUMN appointments.created_at IS 'Timestamp when the appointment was created';
COMMENT ON COLUMN appointments.updated_at IS 'Timestamp when the appointment was last updated';
COMMENT ON COLUMN appointments.created_by IS 'Reference to the user who created the appointment';
COMMENT ON COLUMN appointments.check_in_time IS 'Timestamp when the patient checked in';
COMMENT ON COLUMN appointments.check_out_time IS 'Timestamp when the appointment was completed';
