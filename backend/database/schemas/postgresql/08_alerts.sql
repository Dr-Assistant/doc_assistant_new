-- Alerts Table Schema
-- Represents important notifications for users

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    patient_id UUID REFERENCES patients(id),
    alert_type VARCHAR(20) NOT NULL,
    severity VARCHAR(10) NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP,
    source VARCHAR(50),
    source_id UUID,
    action_url VARCHAR(255),
    CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_type CHECK (alert_type IN ('lab_result', 'medication', 'appointment', 'task', 'system', 'other'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_patient ON alerts(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);

-- Comments
COMMENT ON TABLE alerts IS 'Alerts and notifications for users';
COMMENT ON COLUMN alerts.id IS 'Unique identifier for the alert';
COMMENT ON COLUMN alerts.user_id IS 'Reference to the user who should receive the alert';
COMMENT ON COLUMN alerts.patient_id IS 'Reference to the patient related to the alert, if applicable';
COMMENT ON COLUMN alerts.alert_type IS 'Type of alert';
COMMENT ON COLUMN alerts.severity IS 'Severity level of the alert';
COMMENT ON COLUMN alerts.title IS 'Short title of the alert';
COMMENT ON COLUMN alerts.message IS 'Detailed message of the alert';
COMMENT ON COLUMN alerts.is_read IS 'Whether the alert has been read by the user';
COMMENT ON COLUMN alerts.created_at IS 'Timestamp when the alert was created';
COMMENT ON COLUMN alerts.read_at IS 'Timestamp when the alert was read by the user';
COMMENT ON COLUMN alerts.source IS 'Source system or module that generated the alert';
COMMENT ON COLUMN alerts.source_id IS 'Identifier of the source object that triggered the alert';
COMMENT ON COLUMN alerts.action_url IS 'URL for the user to take action on the alert';
