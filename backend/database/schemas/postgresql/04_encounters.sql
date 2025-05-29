-- Encounters Table Schema
-- Represents an actual clinical visit or interaction

CREATE TABLE IF NOT EXISTS encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    encounter_type VARCHAR(20) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    chief_complaint TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    CONSTRAINT valid_type CHECK (encounter_type IN ('office_visit', 'telemedicine', 'emergency', 'home_visit')),
    CONSTRAINT valid_time_range CHECK (end_time IS NULL OR end_time > start_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_encounters_doctor ON encounters(doctor_id);
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_appointment ON encounters(appointment_id);
CREATE INDEX IF NOT EXISTS idx_encounters_time ON encounters(start_time);
CREATE INDEX IF NOT EXISTS idx_encounters_status ON encounters(status);
CREATE INDEX IF NOT EXISTS idx_encounters_type ON encounters(encounter_type);
CREATE INDEX IF NOT EXISTS idx_encounters_date ON encounters(DATE(start_time));

-- Trigger for updated_at
CREATE TRIGGER update_encounters_timestamp
BEFORE UPDATE ON encounters
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Comments
COMMENT ON TABLE encounters IS 'Clinical encounters between doctors and patients';
COMMENT ON COLUMN encounters.id IS 'Unique identifier for the encounter';
COMMENT ON COLUMN encounters.appointment_id IS 'Reference to the associated appointment, if any';
COMMENT ON COLUMN encounters.doctor_id IS 'Reference to the doctor conducting the encounter';
COMMENT ON COLUMN encounters.patient_id IS 'Reference to the patient involved in the encounter';
COMMENT ON COLUMN encounters.encounter_type IS 'Type of encounter (office_visit, telemedicine, etc.)';
COMMENT ON COLUMN encounters.start_time IS 'Start time of the encounter';
COMMENT ON COLUMN encounters.end_time IS 'End time of the encounter';
COMMENT ON COLUMN encounters.chief_complaint IS 'Primary reason for the encounter';
COMMENT ON COLUMN encounters.status IS 'Current status of the encounter';
COMMENT ON COLUMN encounters.created_at IS 'Timestamp when the encounter was created';
COMMENT ON COLUMN encounters.updated_at IS 'Timestamp when the encounter was last updated';
