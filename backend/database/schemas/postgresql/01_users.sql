-- Users Table Schema
-- Represents doctors, nurses, and administrative staff

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,  -- 'doctor', 'nurse', 'admin', etc.
    specialty VARCHAR(50),      -- For doctors
    phone VARCHAR(20),
    profile_image_url VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    preferences JSONB,          -- User preferences and settings
    CONSTRAINT valid_role CHECK (role IN ('doctor', 'nurse', 'admin', 'receptionist'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_specialty ON users(specialty) WHERE specialty IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Comments
COMMENT ON TABLE users IS 'Users of the system including doctors, nurses, and administrative staff';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.username IS 'Username for login';
COMMENT ON COLUMN users.email IS 'Email address of the user';
COMMENT ON COLUMN users.full_name IS 'Full name of the user';
COMMENT ON COLUMN users.role IS 'Role of the user in the system (doctor, nurse, admin, receptionist)';
COMMENT ON COLUMN users.specialty IS 'Medical specialty for doctors';
COMMENT ON COLUMN users.phone IS 'Contact phone number';
COMMENT ON COLUMN users.profile_image_url IS 'URL to the user profile image';
COMMENT ON COLUMN users.password_hash IS 'Hashed password for authentication';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when the user was last updated';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of the last successful login';
COMMENT ON COLUMN users.status IS 'Status of the user account (active, inactive, suspended)';
COMMENT ON COLUMN users.preferences IS 'User preferences and settings stored as JSON';
