-- Patients Table Schema
-- Represents individuals receiving medical care

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mrn VARCHAR(50) UNIQUE,     -- Medical Record Number
    abha_id VARCHAR(50) UNIQUE, -- Ayushman Bharat Health Account ID
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address JSONB,
    emergency_contact JSONB,
    blood_group VARCHAR(5),
    allergies TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    CONSTRAINT valid_gender CHECK (gender IN ('male', 'female', 'other'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_patients_dob ON patients(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_patients_abha ON patients(abha_id) WHERE abha_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn) WHERE mrn IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

-- Trigger for updated_at
CREATE TRIGGER update_patients_timestamp
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Comments
COMMENT ON TABLE patients IS 'Patients receiving medical care';
COMMENT ON COLUMN patients.id IS 'Unique identifier for the patient';
COMMENT ON COLUMN patients.mrn IS 'Medical Record Number, a unique identifier within the healthcare system';
COMMENT ON COLUMN patients.abha_id IS 'Ayushman Bharat Health Account ID for ABDM integration';
COMMENT ON COLUMN patients.first_name IS 'First name of the patient';
COMMENT ON COLUMN patients.last_name IS 'Last name of the patient';
COMMENT ON COLUMN patients.date_of_birth IS 'Date of birth of the patient';
COMMENT ON COLUMN patients.gender IS 'Gender of the patient (male, female, other)';
COMMENT ON COLUMN patients.phone IS 'Contact phone number';
COMMENT ON COLUMN patients.email IS 'Email address of the patient';
COMMENT ON COLUMN patients.address IS 'Address information stored as JSON';
COMMENT ON COLUMN patients.emergency_contact IS 'Emergency contact information stored as JSON';
COMMENT ON COLUMN patients.blood_group IS 'Blood group of the patient';
COMMENT ON COLUMN patients.allergies IS 'List of patient allergies';
COMMENT ON COLUMN patients.created_at IS 'Timestamp when the patient record was created';
COMMENT ON COLUMN patients.updated_at IS 'Timestamp when the patient record was last updated';
COMMENT ON COLUMN patients.status IS 'Status of the patient record (active, inactive, deceased)';
