# ABDM Integration Technical Specification

## Overview

This document provides detailed technical specifications for integrating Dr. Assistant with the Ayushman Bharat Digital Mission (ABDM) ecosystem. The integration enables secure access to patient health records across healthcare providers through a consent-based framework, enhancing the continuity of care and reducing administrative burden.

## Objectives

1. Enable verification and linking of ABHA IDs (Ayushman Bharat Health Account) for patients
2. Implement consent management for accessing patient health records
3. Fetch and display patient health records from ABDM-connected Health Information Providers (HIPs)
4. Ensure compliance with ABDM security and privacy requirements
5. Provide a seamless user experience for doctors accessing external health records

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Dr. Assistant Application                      │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────┤
│             │             │             │             │                 │
│  Frontend   │   Patient   │   Consent   │   Health    │    Security     │
│  Components │   Service   │   Service   │   Record    │    Service      │
│             │             │             │   Service   │                 │
└─────┬───────┴──────┬──────┴──────┬──────┴──────┬──────┴────────┬────────┘
      │              │              │             │               │
      │              │              │             │               │
┌─────▼──────────────▼──────────────▼─────────────▼───────────────▼────────┐
│                                                                          │
│                        ABDM Integration Service                          │
│                                                                          │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
                                  │
┌─────────────────────────────────▼────────────────────────────────────────┐
│                                                                          │
│                           ABDM Gateway                                   │
│                                                                          │
└──────────┬─────────────────────┬──────────────────────┬─────────────────┘
           │                     │                      │
           │                     │                      │
┌──────────▼──────────┐ ┌────────▼───────────┐ ┌────────▼───────────────┐
│                     │ │                    │ │                        │
│  Health Information │ │  Consent Manager   │ │  Healthcare Provider   │
│  Provider (HIP)     │ │                    │ │  Registry              │
│                     │ │                    │ │                        │
└─────────────────────┘ └────────────────────┘ └────────────────────────┘
```

### Component Description

1. **ABDM Integration Service**
   - Central component that manages all interactions with the ABDM ecosystem
   - Implements the Health Information User (HIU) interface
   - Handles authentication, request formatting, and response processing

2. **Patient Service**
   - Manages patient profiles and demographics
   - Links ABHA IDs to internal patient records
   - Provides patient search and matching functionality

3. **Consent Service**
   - Creates and manages consent requests
   - Stores and tracks consent artifacts
   - Provides consent status information to other services

4. **Health Record Service**
   - Processes and stores health records fetched from ABDM
   - Integrates external records with locally generated records
   - Provides search and filtering capabilities for health records

5. **Security Service**
   - Manages encryption and decryption of sensitive data
   - Implements access control for health records
   - Maintains audit logs for compliance

6. **Frontend Components**
   - User interfaces for ABHA verification
   - Consent management screens
   - Health record display components

## Detailed Technical Specifications

### 1. ABHA ID Verification and Linking

#### API Endpoints

**1.1 Verify ABHA ID**

```
POST /api/abdm/verify-health-id
```

**Request:**
```json
{
  "healthId": "string",  // ABHA ID or ABHA Address
  "verificationMode": "string",  // "MOBILE_OTP", "AADHAAR_OTP", etc.
  "patientId": "string"  // Internal patient ID
}
```

**Response:**
```json
{
  "success": "boolean",
  "verificationId": "string",  // Used for completing verification
  "message": "string"
}
```

**1.2 Complete Verification**

```
POST /api/abdm/complete-verification
```

**Request:**
```json
{
  "verificationId": "string",
  "otp": "string"
}
```

**Response:**
```json
{
  "success": "boolean",
  "healthIdDetails": {
    "healthId": "string",
    "name": "string",
    "gender": "string",
    "yearOfBirth": "number",
    "monthOfBirth": "number",
    "dayOfBirth": "number",
    "address": "string",
    "mobile": "string",
    "profilePhoto": "string"  // Base64 encoded
  },
  "message": "string"
}
```

**1.3 Link ABHA ID to Patient**

```
POST /api/patients/{patientId}/link-health-id
```

**Request:**
```json
{
  "healthId": "string",
  "healthIdDetails": {
    // Same as above
  }
}
```

**Response:**
```json
{
  "success": "boolean",
  "message": "string"
}
```

#### Database Schema

**Patient Table Extension:**
```sql
ALTER TABLE patients ADD COLUMN abha_id VARCHAR(50) UNIQUE;
ALTER TABLE patients ADD COLUMN abha_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN abha_verification_date TIMESTAMP;
ALTER TABLE patients ADD COLUMN abha_details JSONB;
```

#### Implementation Notes

1. The verification process follows the ABDM Auth Modes:
   - Mobile OTP
   - Aadhaar OTP
   - Demographics
   - Password (for existing users)

2. Patient matching logic:
   - Match by name, gender, and date of birth
   - Prompt for manual review if automatic matching fails
   - Allow manual linking by authorized users

3. Error handling:
   - Retry logic for temporary failures
   - Clear error messages for verification failures
   - Fallback to manual entry if verification is not possible

### 2. Consent Management

#### API Endpoints

**2.1 Request Consent**

```
POST /api/abdm/consent/request
```

**Request:**
```json
{
  "patientId": "string",
  "purpose": {
    "code": "string",
    "text": "string"
  },
  "hiTypes": ["string"],  // "DiagnosticReport", "Prescription", etc.
  "dateRange": {
    "from": "string",  // ISO date
    "to": "string"     // ISO date
  },
  "expiry": "string",  // ISO date
  "hips": ["string"]   // Optional: specific HIPs to request from
}
```

**Response:**
```json
{
  "success": "boolean",
  "consentRequestId": "string",
  "message": "string"
}
```

**2.2 Check Consent Status**

```
GET /api/abdm/consent/{consentRequestId}/status
```

**Response:**
```json
{
  "status": "string",  // "REQUESTED", "GRANTED", "DENIED", "EXPIRED"
  "consentArtefact": {
    "id": "string",
    "details": {
      // Consent details as per ABDM format
    }
  },
  "message": "string"
}
```

**2.3 List Active Consents**

```
GET /api/abdm/consent/active?patientId={patientId}
```

**Response:**
```json
{
  "consents": [
    {
      "id": "string",
      "status": "string",
      "purpose": "string",
      "dateRange": {
        "from": "string",
        "to": "string"
      },
      "expiry": "string",
      "hiTypes": ["string"],
      "createdAt": "string"
    }
  ]
}
```

**2.4 Revoke Consent**

```
POST /api/abdm/consent/{consentId}/revoke
```

**Request:**
```json
{
  "reason": "string"
}
```

**Response:**
```json
{
  "success": "boolean",
  "message": "string"
}
```

#### Database Schema

**Consent Request Table:**
```sql
CREATE TABLE consent_requests (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    abdm_request_id VARCHAR(100) UNIQUE,
    purpose_code VARCHAR(50) NOT NULL,
    purpose_text TEXT NOT NULL,
    hi_types TEXT[] NOT NULL,
    date_range_from DATE NOT NULL,
    date_range_to DATE NOT NULL,
    expiry TIMESTAMP NOT NULL,
    hips TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED'))
);
```

**Consent Artefact Table:**
```sql
CREATE TABLE consent_artefacts (
    id UUID PRIMARY KEY,
    consent_request_id UUID NOT NULL REFERENCES consent_requests(id),
    abdm_artefact_id VARCHAR(100) UNIQUE,
    artefact_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED'))
);
```

#### Implementation Notes

1. Consent request flow:
   - Doctor initiates consent request
   - Request is sent to ABDM Consent Manager
   - Patient receives notification on their ABDM-linked app
   - Patient approves or denies the request
   - ABDM notifies our system via callback

2. Consent callback handling:
   - Implement webhook endpoint for ABDM callbacks
   - Update consent status in real-time
   - Notify requesting doctor of consent status changes

3. Consent storage security:
   - Encrypt consent artefacts at rest
   - Implement access controls for consent data
   - Maintain comprehensive audit logs

### 3. Health Record Fetching

#### API Endpoints

**3.1 Fetch Health Records**

```
POST /api/abdm/health-records/fetch
```

**Request:**
```json
{
  "consentId": "string",
  "hiTypes": ["string"],  // Optional: filter by record type
  "dateRange": {
    "from": "string",  // Optional: filter by date
    "to": "string"
  }
}
```

**Response:**
```json
{
  "success": "boolean",
  "requestId": "string",
  "message": "string"
}
```

**3.2 Check Fetch Status**

```
GET /api/abdm/health-records/status/{requestId}
```

**Response:**
```json
{
  "status": "string",  // "PROCESSING", "COMPLETED", "PARTIAL", "FAILED"
  "progress": {
    "total": "number",
    "completed": "number",
    "failed": "number"
  },
  "message": "string"
}
```

**3.3 Get Health Records**

```
GET /api/patients/{patientId}/health-records?source=abdm&type={recordType}&from={fromDate}&to={toDate}
```

**Response:**
```json
{
  "records": [
    {
      "id": "string",
      "type": "string",
      "date": "string",
      "provider": {
        "id": "string",
        "name": "string",
        "type": "string"
      },
      "content": {
        // FHIR resource content
      },
      "source": "string",  // "ABDM" or "LOCAL"
      "fetchedAt": "string"
    }
  ],
  "pagination": {
    "page": "number",
    "pageSize": "number",
    "totalItems": "number",
    "totalPages": "number"
  }
}
```

#### Database Schema

**Health Records Table:**
```sql
CREATE TABLE health_records (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    consent_artefact_id UUID REFERENCES consent_artefacts(id),
    record_type VARCHAR(50) NOT NULL,
    record_date DATE NOT NULL,
    provider_id VARCHAR(100),
    provider_name VARCHAR(255),
    provider_type VARCHAR(50),
    content JSONB NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    fetched_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_source CHECK (source IN ('LOCAL', 'ABDM'))
);

CREATE INDEX idx_health_records_patient ON health_records(patient_id);
CREATE INDEX idx_health_records_type ON health_records(record_type);
CREATE INDEX idx_health_records_date ON health_records(record_date);
CREATE INDEX idx_health_records_source ON health_records(source);
```

**Health Record Fetch Requests Table:**
```sql
CREATE TABLE health_record_fetch_requests (
    id UUID PRIMARY KEY,
    consent_artefact_id UUID NOT NULL REFERENCES consent_artefacts(id),
    abdm_request_id VARCHAR(100) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
    total_records INTEGER,
    completed_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED'))
);
```

#### Implementation Notes

1. Record fetching process:
   - Use consent artefact to request records from HIPs
   - Process records in batches as they arrive
   - Store records in FHIR format for interoperability
   - Update fetch status in real-time

2. FHIR resource handling:
   - Support all ABDM-required FHIR resources
   - Validate incoming FHIR resources
   - Transform resources as needed for display
   - Maintain original FHIR data for future reference

3. Performance considerations:
   - Implement pagination for large record sets
   - Use background processing for fetch operations
   - Cache frequently accessed records
   - Implement efficient search indexing

### 4. User Interface Specifications

#### 4.1 ABHA ID Verification UI

**Patient Registration/Edit Screen:**
- Add ABHA ID field with verification button
- Display verification status (Verified/Unverified)
- Show verification methods dropdown (Mobile OTP, Aadhaar OTP, etc.)
- Display OTP input field when verification is initiated
- Show success/error messages with clear instructions

**Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│ Patient Information                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Name: [John Doe                                    ]        │
│                                                             │
│ Gender: (●) Male  ( ) Female  ( ) Other                     │
│                                                             │
│ Date of Birth: [15/04/1985                         ]        │
│                                                             │
│ ABHA ID: [john.doe@abdm                            ] [Verify]│
│                                                             │
│ Status: ⚠️ Not Verified                                     │
│                                                             │
│ Verification Method: [Mobile OTP                  ▼]        │
│                                                             │
│ [                    Submit                       ]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2 Consent Management UI

**Request Consent Screen:**
- Patient selection with ABHA ID display
- Purpose selection (dropdown with common purposes)
- Health information type selection (checkboxes)
- Date range selection (from/to dates)
- Expiry date selection
- Optional HIP selection

**Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│ Request Health Records Access                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Patient: John Doe (ABHA: john.doe@abdm)                     │
│                                                             │
│ Purpose: [Treatment                              ▼]         │
│                                                             │
│ Health Information Types:                                   │
│ [✓] Diagnostic Reports  [✓] Prescriptions                   │
│ [✓] Discharge Summaries [✓] OP Consultations                │
│ [ ] Wellness Records    [ ] Immunization Records            │
│                                                             │
│ Date Range:                                                 │
│ From: [01/01/2022] To: [Current Date]                       │
│                                                             │
│ Access Expiry: [15 days from now               ▼]           │
│                                                             │
│ Specific Healthcare Providers (Optional):                   │
│ [ ] Select All                                              │
│ [ ] Apollo Hospitals                                        │
│ [ ] Max Healthcare                                          │
│ [ ] AIIMS                                                   │
│                                                             │
│ [                Request Consent                 ]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Consent Status Screen:**
- List of active consent requests
- Status indicators (Requested, Granted, Denied, Expired)
- Action buttons (View Details, Fetch Records, Revoke)
- Filtering options (by status, date, etc.)

**Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│ Consent Management                          [Request New]    │
├─────────────────────────────────────────────────────────────┤
│ Filter: [All Statuses       ▼]  [Last 30 days        ▼]     │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Patient: John Doe                      Status: GRANTED   │ │
│ │ Purpose: Treatment                     Date: 05/06/2023  │ │
│ │ Types: Diagnostic Reports, Prescriptions                 │ │
│ │ Validity: 05/06/2023 - 20/06/2023                       │ │
│ │                                                         │ │
│ │ [View Details]  [Fetch Records]  [Revoke]               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Patient: Jane Smith                    Status: REQUESTED │ │
│ │ Purpose: Treatment                     Date: 10/06/2023  │ │
│ │ Types: All                                               │ │
│ │ Validity: Pending                                        │ │
│ │                                                         │ │
│ │ [View Details]  [Fetch Records]  [Revoke]               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4.3 Health Records Display UI

**Timeline View:**
- Chronological display of all health records
- Visual distinction between local and ABDM records
- Filtering by record type, date range, and source
- Collapsible/expandable record details
- Quick actions (view full record, download, etc.)

**Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│ Patient Records: John Doe                                    │
├─────────────────────────────────────────────────────────────┤
│ Filter: [All Types ▼] [All Sources ▼] [Last 12 months ▼]    │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 2023                                                     │ │
│ │ ├── June                                                 │ │
│ │ │   ├── 10/06/2023 - Prescription [ABDM: Apollo]        │ │
│ │ │   │   Medications: Atorvastatin 10mg, Aspirin 75mg    │ │
│ │ │   │   [View Full Record] [Download]                    │ │
│ │ │   │                                                   │ │
│ │ │   └── 05/06/2023 - Consultation Note [LOCAL]          │ │
│ │ │       Diagnosis: Hypertension, Type 2 Diabetes        │ │
│ │ │       [View Full Record] [Download]                    │ │
│ │ │                                                       │ │
│ │ ├── May                                                  │ │
│ │ │   ├── 20/05/2023 - Lab Report [ABDM: Max Labs]        │ │
│ │ │   │   Tests: Complete Blood Count, HbA1c              │ │
│ │ │   │   [View Full Record] [Download]                    │ │
│ │ │   │                                                   │ │
│ │ │   └── 15/05/2023 - Discharge Summary [ABDM: AIIMS]    │ │
│ │ │       Admission: 12/05/2023, Discharge: 15/05/2023    │ │
│ │ │       Diagnosis: Acute Myocardial Infarction          │ │
│ │ │       [View Full Record] [Download]                    │ │
│ │ │                                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Record Detail View:**
- Complete display of health record content
- Structured format based on record type
- Source information and metadata
- Download and print options
- Navigation between records

### 5. Security Implementation

#### 5.1 Authentication and Authorization

1. **ABDM Gateway Authentication**
   - X.509 certificate-based authentication
   - API key management with secure storage
   - Regular key rotation

2. **Access Control**
   - Role-based access control for ABDM features
   - Purpose-based access limitations
   - Temporal access restrictions (e.g., only during appointments)

#### 5.2 Data Protection

1. **Encryption**
   - End-to-end encryption for all ABDM communications
   - Encryption of health records at rest
   - Secure key management

2. **Data Minimization**
   - Request only necessary health information
   - Implement purpose-specific data access
   - Automatic data purging based on consent expiry

#### 5.3 Audit Logging

1. **Comprehensive Logging**
   - Log all ABDM-related transactions
   - Include user, timestamp, action, and purpose
   - Maintain tamper-proof audit logs

2. **Monitoring and Alerting**
   - Real-time monitoring of ABDM transactions
   - Alerts for suspicious activities
   - Regular audit log reviews

## Implementation Plan

### Phase 1: Foundation (Weeks 1-3)

1. **ABDM Sandbox Setup**
   - Register with ABDM Sandbox
   - Set up development environment
   - Implement basic connectivity tests

2. **Health ID Integration**
   - Implement Health ID verification
   - Develop patient linking functionality
   - Create UI components for Health ID management

### Phase 2: Consent Management (Weeks 4-6)

1. **Consent Request Flow**
   - Implement consent request API
   - Develop consent callback handling
   - Create consent management UI

2. **Consent Storage and Tracking**
   - Implement consent database schema
   - Develop consent status tracking
   - Create consent listing and filtering

### Phase 3: Health Record Access (Weeks 7-9)

1. **Health Record Fetching**
   - Implement health record fetch API
   - Develop FHIR resource processing
   - Create health record storage

2. **Health Record Display**
   - Implement timeline view
   - Develop record detail view
   - Create filtering and search functionality

### Phase 4: Security and Testing (Weeks 10-12)

1. **Security Implementation**
   - Implement encryption and access controls
   - Develop comprehensive audit logging
   - Conduct security testing

2. **Integration Testing**
   - Test end-to-end workflows
   - Validate with ABDM Sandbox
   - Fix issues and optimize performance

## Testing Strategy

### 1. Unit Testing

- Test each component in isolation
- Mock external dependencies
- Achieve >80% code coverage

### 2. Integration Testing

- Test interactions between components
- Validate API contracts
- Test error handling and edge cases

### 3. ABDM Sandbox Testing

- Test against ABDM Sandbox environment
- Validate all API interactions
- Ensure compliance with ABDM specifications

### 4. Security Testing

- Conduct vulnerability assessment
- Test encryption and access controls
- Validate audit logging

### 5. Performance Testing

- Test with realistic data volumes
- Measure response times and resource usage
- Identify and address bottlenecks

## References

1. ABDM Sandbox Documentation: [https://sandbox.abdm.gov.in/docs/](https://sandbox.abdm.gov.in/docs/)
2. Health ID API Specifications: [https://sandbox.abdm.gov.in/docs/healthid](https://sandbox.abdm.gov.in/docs/healthid)
3. ABDM Consent Manager Specifications: [https://sandbox.abdm.gov.in/docs/consent-manager](https://sandbox.abdm.gov.in/docs/consent-manager)
4. FHIR Implementation Guide for India: [https://www.nrces.in/fhir](https://www.nrces.in/fhir)
5. ABDM Security and Privacy Specifications: [https://abdm.gov.in/publications](https://abdm.gov.in/publications)
