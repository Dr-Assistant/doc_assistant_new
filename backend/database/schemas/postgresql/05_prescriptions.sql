-- Prescriptions Table Schema
-- Represents medications prescribed to a patient

CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    signed_at TIMESTAMP,
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    pharmacy_id UUID,
    notes TEXT,
    CONSTRAINT valid_status CHECK (status IN ('draft', 'signed', 'sent', 'dispensed', 'cancelled')),
    CONSTRAINT valid_date_range CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration VARCHAR(50),
    quantity VARCHAR(50),
    refills INTEGER DEFAULT 0,
    instructions TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_encounter ON prescriptions(encounter_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_valid_from ON prescriptions(valid_from);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id);

-- Triggers for updated_at
CREATE TRIGGER update_prescriptions_timestamp
BEFORE UPDATE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_prescription_items_timestamp
BEFORE UPDATE ON prescription_items
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Comments
COMMENT ON TABLE prescriptions IS 'Prescriptions issued to patients';
COMMENT ON COLUMN prescriptions.id IS 'Unique identifier for the prescription';
COMMENT ON COLUMN prescriptions.encounter_id IS 'Reference to the encounter during which the prescription was created';
COMMENT ON COLUMN prescriptions.patient_id IS 'Reference to the patient receiving the prescription';
COMMENT ON COLUMN prescriptions.doctor_id IS 'Reference to the doctor issuing the prescription';
COMMENT ON COLUMN prescriptions.status IS 'Current status of the prescription';
COMMENT ON COLUMN prescriptions.created_at IS 'Timestamp when the prescription was created';
COMMENT ON COLUMN prescriptions.updated_at IS 'Timestamp when the prescription was last updated';
COMMENT ON COLUMN prescriptions.signed_at IS 'Timestamp when the prescription was signed by the doctor';
COMMENT ON COLUMN prescriptions.valid_from IS 'Date from which the prescription is valid';
COMMENT ON COLUMN prescriptions.valid_until IS 'Date until which the prescription is valid';
COMMENT ON COLUMN prescriptions.pharmacy_id IS 'Reference to the pharmacy where the prescription was sent';
COMMENT ON COLUMN prescriptions.notes IS 'Additional notes about the prescription';

COMMENT ON TABLE prescription_items IS 'Individual medication items within a prescription';
COMMENT ON COLUMN prescription_items.id IS 'Unique identifier for the prescription item';
COMMENT ON COLUMN prescription_items.prescription_id IS 'Reference to the parent prescription';
COMMENT ON COLUMN prescription_items.medication_name IS 'Name of the prescribed medication';
COMMENT ON COLUMN prescription_items.dosage IS 'Dosage of the medication';
COMMENT ON COLUMN prescription_items.frequency IS 'Frequency of administration';
COMMENT ON COLUMN prescription_items.duration IS 'Duration of the treatment';
COMMENT ON COLUMN prescription_items.quantity IS 'Quantity to be dispensed';
COMMENT ON COLUMN prescription_items.refills IS 'Number of refills allowed';
COMMENT ON COLUMN prescription_items.instructions IS 'Special instructions for taking the medication';
COMMENT ON COLUMN prescription_items.created_at IS 'Timestamp when the prescription item was created';
COMMENT ON COLUMN prescription_items.updated_at IS 'Timestamp when the prescription item was last updated';
