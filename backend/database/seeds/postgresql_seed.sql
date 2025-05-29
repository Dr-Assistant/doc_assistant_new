-- PostgreSQL Seed Data
-- This script seeds the PostgreSQL database with initial data

-- Seed Users
INSERT INTO users (id, username, email, full_name, role, specialty, phone, password_hash, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin', 'admin@drassistant.com', 'Admin User', 'admin', NULL, '+919876543210', '$2a$10$xVCf4Uu7o3kAHOLXgFQb8OJzHZRpZK4jk5U4Dw7YjYIHnLM4J5iP6', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'doctor1', 'doctor1@drassistant.com', 'Dr. John Smith', 'doctor', 'Cardiology', '+919876543211', '$2a$10$xVCf4Uu7o3kAHOLXgFQb8OJzHZRpZK4jk5U4Dw7YjYIHnLM4J5iP6', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'doctor2', 'doctor2@drassistant.com', 'Dr. Jane Doe', 'doctor', 'Neurology', '+919876543212', '$2a$10$xVCf4Uu7o3kAHOLXgFQb8OJzHZRpZK4jk5U4Dw7YjYIHnLM4J5iP6', 'active'),
  ('44444444-4444-4444-4444-444444444444', 'nurse1', 'nurse1@drassistant.com', 'Nurse Sarah Johnson', 'nurse', NULL, '+919876543213', '$2a$10$xVCf4Uu7o3kAHOLXgFQb8OJzHZRpZK4jk5U4Dw7YjYIHnLM4J5iP6', 'active'),
  ('55555555-5555-5555-5555-555555555555', 'receptionist1', 'receptionist1@drassistant.com', 'Receptionist Mike Brown', 'receptionist', NULL, '+919876543214', '$2a$10$xVCf4Uu7o3kAHOLXgFQb8OJzHZRpZK4jk5U4Dw7YjYIHnLM4J5iP6', 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed Patients
INSERT INTO patients (id, mrn, abha_id, first_name, last_name, date_of_birth, gender, phone, email, status)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MRN12345', 'ABHA12345', 'Rahul', 'Sharma', '1980-05-15', 'male', '+919876543215', 'rahul.sharma@example.com', 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'MRN12346', 'ABHA12346', 'Priya', 'Patel', '1992-08-22', 'female', '+919876543216', 'priya.patel@example.com', 'active'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'MRN12347', 'ABHA12347', 'Amit', 'Kumar', '1975-12-10', 'male', '+919876543217', 'amit.kumar@example.com', 'active'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'MRN12348', 'ABHA12348', 'Sneha', 'Gupta', '1988-03-30', 'female', '+919876543218', 'sneha.gupta@example.com', 'active'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'MRN12349', 'ABHA12349', 'Vikram', 'Singh', '1965-07-05', 'male', '+919876543219', 'vikram.singh@example.com', 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed Appointments
INSERT INTO appointments (id, doctor_id, patient_id, start_time, end_time, status, appointment_type, reason, created_by)
VALUES
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 30 minutes', 'scheduled', 'in_person', 'Regular checkup', '55555555-5555-5555-5555-555555555555'),
  ('22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() + INTERVAL '1 day 1 hour', NOW() + INTERVAL '1 day 1 hour 30 minutes', 'scheduled', 'in_person', 'Chest pain', '55555555-5555-5555-5555-555555555555'),
  ('33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 30 minutes', 'scheduled', 'telemedicine', 'Headache', '55555555-5555-5555-5555-555555555555'),
  ('44444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() + INTERVAL '2 days 1 hour', NOW() + INTERVAL '2 days 1 hour 30 minutes', 'scheduled', 'telemedicine', 'Migraine', '55555555-5555-5555-5555-555555555555'),
  ('55555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 30 minutes', 'scheduled', 'follow_up', 'Follow-up after treatment', '55555555-5555-5555-5555-555555555555')
ON CONFLICT (id) DO NOTHING;

-- Seed Encounters
INSERT INTO encounters (id, appointment_id, doctor_id, patient_id, encounter_type, start_time, end_time, chief_complaint, status)
VALUES
  ('11111111-eeee-eeee-eeee-eeeeeeeeeeee', NULL, '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'office_visit', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days 23 hours 30 minutes', 'Chest pain', 'completed'),
  ('22222222-eeee-eeee-eeee-eeeeeeeeeeee', NULL, '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'office_visit', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days 23 hours 30 minutes', 'Shortness of breath', 'completed'),
  ('33333333-eeee-eeee-eeee-eeeeeeeeeeee', NULL, '33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'telemedicine', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days 23 hours 30 minutes', 'Headache', 'completed'),
  ('44444444-eeee-eeee-eeee-eeeeeeeeeeee', NULL, '33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'telemedicine', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours 30 minutes', 'Dizziness', 'completed'),
  ('55555555-eeee-eeee-eeee-eeeeeeeeeeee', NULL, '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'office_visit', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days 23 hours 30 minutes', 'Hypertension', 'completed')
ON CONFLICT (id) DO NOTHING;
