-- ABDM Health Records Schema
-- Implements health record fetching and storage for ABDM integration

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Health Record Fetch Requests Table
-- Tracks requests to fetch health records from ABDM
CREATE TABLE IF NOT EXISTS health_record_fetch_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consent_artifact_id UUID NOT NULL REFERENCES consent_artifacts(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    abdm_request_id VARCHAR(100) UNIQUE,
    hi_types TEXT[] NOT NULL,
    date_range_from DATE,
    date_range_to DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
    total_records INTEGER DEFAULT 0,
    completed_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    error_message TEXT,
    callback_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_fetch_status CHECK (status IN ('PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED')),
    CONSTRAINT valid_record_counts CHECK (completed_records >= 0 AND failed_records >= 0 AND total_records >= 0),
    CONSTRAINT valid_date_range CHECK (date_range_from IS NULL OR date_range_to IS NULL OR date_range_from <= date_range_to)
);

-- Health Records Table
-- Stores fetched health records from ABDM and local records
CREATE TABLE IF NOT EXISTS health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    fetch_request_id UUID REFERENCES health_record_fetch_requests(id) ON DELETE SET NULL,
    abdm_record_id VARCHAR(100),
    record_type VARCHAR(50) NOT NULL,
    record_date DATE NOT NULL,
    provider_id VARCHAR(100),
    provider_name VARCHAR(255),
    provider_type VARCHAR(50),
    fhir_resource JSONB NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'ABDM',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    encryption_key_id VARCHAR(100),
    checksum VARCHAR(64),
    fetched_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_record_source CHECK (source IN ('ABDM', 'LOCAL', 'IMPORTED')),
    CONSTRAINT valid_record_status CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    CONSTRAINT valid_record_type CHECK (record_type IN ('DiagnosticReport', 'Prescription', 'DischargeSummary', 'OPConsultation', 'ImmunizationRecord', 'HealthDocumentRecord', 'WellnessRecord', 'Observation', 'Condition', 'Procedure', 'MedicationRequest', 'AllergyIntolerance'))
);

-- Health Record Processing Log Table
-- Tracks processing of individual health records
CREATE TABLE IF NOT EXISTS health_record_processing_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fetch_request_id UUID NOT NULL REFERENCES health_record_fetch_requests(id) ON DELETE CASCADE,
    health_record_id UUID REFERENCES health_records(id) ON DELETE SET NULL,
    abdm_record_id VARCHAR(100),
    processing_stage VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    processing_time_ms INTEGER,
    details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_processing_status CHECK (status IN ('SUCCESS', 'FAILED', 'SKIPPED', 'RETRY')),
    CONSTRAINT valid_processing_stage CHECK (processing_stage IN ('FETCH', 'DECRYPT', 'PARSE', 'VALIDATE', 'STORE', 'INDEX'))
);

-- Health Record Access Log Table
-- Tracks access to health records for audit purposes
CREATE TABLE IF NOT EXISTS health_record_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    health_record_id UUID NOT NULL REFERENCES health_records(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_type VARCHAR(20) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_access_type CHECK (access_type IN ('VIEW', 'DOWNLOAD', 'PRINT', 'SHARE', 'EXPORT'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fetch_requests_consent_artifact ON health_record_fetch_requests(consent_artifact_id);
CREATE INDEX IF NOT EXISTS idx_fetch_requests_patient ON health_record_fetch_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_fetch_requests_doctor ON health_record_fetch_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_fetch_requests_status ON health_record_fetch_requests(status);
CREATE INDEX IF NOT EXISTS idx_fetch_requests_abdm_id ON health_record_fetch_requests(abdm_request_id);
CREATE INDEX IF NOT EXISTS idx_fetch_requests_created_at ON health_record_fetch_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_health_records_patient ON health_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_records_fetch_request ON health_records(fetch_request_id);
CREATE INDEX IF NOT EXISTS idx_health_records_type ON health_records(record_type);
CREATE INDEX IF NOT EXISTS idx_health_records_date ON health_records(record_date);
CREATE INDEX IF NOT EXISTS idx_health_records_source ON health_records(source);
CREATE INDEX IF NOT EXISTS idx_health_records_status ON health_records(status);
CREATE INDEX IF NOT EXISTS idx_health_records_provider ON health_records(provider_id);
CREATE INDEX IF NOT EXISTS idx_health_records_abdm_id ON health_records(abdm_record_id);

CREATE INDEX IF NOT EXISTS idx_processing_log_fetch_request ON health_record_processing_log(fetch_request_id);
CREATE INDEX IF NOT EXISTS idx_processing_log_health_record ON health_record_processing_log(health_record_id);
CREATE INDEX IF NOT EXISTS idx_processing_log_stage ON health_record_processing_log(processing_stage);
CREATE INDEX IF NOT EXISTS idx_processing_log_status ON health_record_processing_log(status);
CREATE INDEX IF NOT EXISTS idx_processing_log_created_at ON health_record_processing_log(created_at);

CREATE INDEX IF NOT EXISTS idx_access_log_health_record ON health_record_access_log(health_record_id);
CREATE INDEX IF NOT EXISTS idx_access_log_user ON health_record_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_log_access_type ON health_record_access_log(access_type);
CREATE INDEX IF NOT EXISTS idx_access_log_created_at ON health_record_access_log(created_at);

-- Comments for documentation
COMMENT ON TABLE health_record_fetch_requests IS 'Tracks requests to fetch health records from ABDM HIPs using consent artifacts';
COMMENT ON TABLE health_records IS 'Stores health records fetched from ABDM and local records in FHIR format';
COMMENT ON TABLE health_record_processing_log IS 'Tracks the processing pipeline for individual health records';
COMMENT ON TABLE health_record_access_log IS 'Maintains audit trail of health record access for compliance';

COMMENT ON COLUMN health_record_fetch_requests.abdm_request_id IS 'Unique identifier from ABDM for the health record fetch request';
COMMENT ON COLUMN health_record_fetch_requests.hi_types IS 'Array of health information types requested (e.g., DiagnosticReport, Prescription)';
COMMENT ON COLUMN health_records.fhir_resource IS 'Complete FHIR resource data as received from ABDM or created locally';
COMMENT ON COLUMN health_records.encryption_key_id IS 'Identifier for the encryption key used to encrypt sensitive data';
COMMENT ON COLUMN health_records.checksum IS 'SHA-256 checksum for data integrity verification';
