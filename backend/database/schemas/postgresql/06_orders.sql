-- Orders Table Schema
-- Represents clinical orders such as lab tests or imaging

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    order_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ordered',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ordered_at TIMESTAMP,
    completed_at TIMESTAMP,
    provider_id UUID,  -- External provider (lab, imaging center)
    notes TEXT,
    CONSTRAINT valid_type CHECK (order_type IN ('lab', 'imaging', 'procedure', 'referral')),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'ordered', 'in_progress', 'completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_encounter ON orders(encounter_id);
CREATE INDEX IF NOT EXISTS idx_orders_patient ON orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_doctor ON orders(doctor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Triggers for updated_at
CREATE TRIGGER update_orders_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_order_items_timestamp
BEFORE UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Comments
COMMENT ON TABLE orders IS 'Clinical orders for lab tests, imaging, procedures, or referrals';
COMMENT ON COLUMN orders.id IS 'Unique identifier for the order';
COMMENT ON COLUMN orders.encounter_id IS 'Reference to the encounter during which the order was created';
COMMENT ON COLUMN orders.patient_id IS 'Reference to the patient for whom the order was created';
COMMENT ON COLUMN orders.doctor_id IS 'Reference to the doctor who created the order';
COMMENT ON COLUMN orders.order_type IS 'Type of order (lab, imaging, procedure, referral)';
COMMENT ON COLUMN orders.status IS 'Current status of the order';
COMMENT ON COLUMN orders.created_at IS 'Timestamp when the order was created';
COMMENT ON COLUMN orders.updated_at IS 'Timestamp when the order was last updated';
COMMENT ON COLUMN orders.ordered_at IS 'Timestamp when the order was submitted';
COMMENT ON COLUMN orders.completed_at IS 'Timestamp when the order was completed';
COMMENT ON COLUMN orders.provider_id IS 'Reference to the external provider (lab, imaging center)';
COMMENT ON COLUMN orders.notes IS 'Additional notes about the order';

COMMENT ON TABLE order_items IS 'Individual items within an order';
COMMENT ON COLUMN order_items.id IS 'Unique identifier for the order item';
COMMENT ON COLUMN order_items.order_id IS 'Reference to the parent order';
COMMENT ON COLUMN order_items.item_code IS 'Code for the ordered item (e.g., CPT code)';
COMMENT ON COLUMN order_items.item_name IS 'Name of the ordered item';
COMMENT ON COLUMN order_items.instructions IS 'Special instructions for the order item';
COMMENT ON COLUMN order_items.created_at IS 'Timestamp when the order item was created';
COMMENT ON COLUMN order_items.updated_at IS 'Timestamp when the order item was last updated';
