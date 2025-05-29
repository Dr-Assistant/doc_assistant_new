-- ABDM Consent Management Schema
-- Implements consent request and artifact management for ABDM integration

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Consent Requests Table
-- Stores consent requests initiated by doctors
CREATE TABLE IF NOT EXISTS consent_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    abdm_request_id VARCHAR(100) UNIQUE,
    purpose_code VARCHAR(50) NOT NULL,
    purpose_text TEXT NOT NULL,
    hi_types TEXT[] NOT NULL,
    date_range_from DATE NOT NULL,
    date_range_to DATE NOT NULL,
    expiry TIMESTAMP NOT NULL,
    hips TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
    callback_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED', 'REVOKED')),
    CONSTRAINT valid_date_range CHECK (date_range_from <= date_range_to),
    CONSTRAINT valid_expiry CHECK (expiry > NOW())
);

-- Consent Artifacts Table
-- Stores consent artifacts received from ABDM
CREATE TABLE IF NOT EXISTS consent_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consent_request_id UUID NOT NULL REFERENCES consent_requests(id) ON DELETE CASCADE,
    abdm_artifact_id VARCHAR(100) UNIQUE NOT NULL,
    artifact_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    granted_at TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    revocation_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_artifact_status CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    CONSTRAINT valid_granted_at CHECK (granted_at <= NOW()),
    CONSTRAINT valid_expiry_date CHECK (expires_at > granted_at)
);

-- Consent Audit Log Table
-- Maintains audit trail of all consent-related activities
CREATE TABLE IF NOT EXISTS consent_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consent_request_id UUID REFERENCES consent_requests(id) ON DELETE SET NULL,
    consent_artifact_id UUID REFERENCES consent_artifacts(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type VARCHAR(20) NOT NULL, -- 'doctor', 'patient', 'system'
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_actor_type CHECK (actor_type IN ('doctor', 'patient', 'system', 'abdm'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_consent_requests_patient_id ON consent_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_requests_doctor_id ON consent_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consent_requests_status ON consent_requests(status);
CREATE INDEX IF NOT EXISTS idx_consent_requests_abdm_id ON consent_requests(abdm_request_id);
CREATE INDEX IF NOT EXISTS idx_consent_requests_created_at ON consent_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_consent_artifacts_request_id ON consent_artifacts(consent_request_id);
CREATE INDEX IF NOT EXISTS idx_consent_artifacts_abdm_id ON consent_artifacts(abdm_artifact_id);
CREATE INDEX IF NOT EXISTS idx_consent_artifacts_status ON consent_artifacts(status);
CREATE INDEX IF NOT EXISTS idx_consent_artifacts_expires_at ON consent_artifacts(expires_at);

CREATE INDEX IF NOT EXISTS idx_consent_audit_request_id ON consent_audit_log(consent_request_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_artifact_id ON consent_audit_log(consent_artifact_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_actor_id ON consent_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_created_at ON consent_audit_log(created_at);

-- Comments for documentation
COMMENT ON TABLE consent_requests IS 'Stores consent requests initiated by doctors for accessing patient health records via ABDM';
COMMENT ON TABLE consent_artifacts IS 'Stores consent artifacts received from ABDM after patient approval';
COMMENT ON TABLE consent_audit_log IS 'Maintains comprehensive audit trail of all consent-related activities';

COMMENT ON COLUMN consent_requests.abdm_request_id IS 'Unique identifier from ABDM for the consent request';
COMMENT ON COLUMN consent_requests.purpose_code IS 'ABDM-defined purpose code for the consent request';
COMMENT ON COLUMN consent_requests.hi_types IS 'Array of health information types requested (e.g., DiagnosticReport, Prescription)';
COMMENT ON COLUMN consent_requests.hips IS 'Array of Health Information Provider IDs to request data from';

COMMENT ON COLUMN consent_artifacts.abdm_artifact_id IS 'Unique identifier from ABDM for the consent artifact';
COMMENT ON COLUMN consent_artifacts.artifact_data IS 'Complete consent artifact data as received from ABDM';
