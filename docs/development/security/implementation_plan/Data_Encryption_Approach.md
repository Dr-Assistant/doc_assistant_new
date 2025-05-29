# Data Encryption Approach

## Overview

This document details the data encryption approach for the Dr. Assistant application, covering encryption at rest, encryption in transit, and end-to-end encryption for sensitive data.

## Encryption Requirements

### Regulatory Requirements

1. **Digital Personal Data Protection Act (DPDP)**: Requires appropriate security safeguards for personal data
2. **ABDM Guidelines**: Requires encryption of health data in transit and at rest
3. **IT Rules 2011**: Requires reasonable security practices for sensitive personal data

### Security Objectives

1. **Confidentiality**: Protect data from unauthorized access
2. **Integrity**: Ensure data is not tampered with
3. **Availability**: Ensure data is accessible when needed
4. **Non-repudiation**: Ensure actions cannot be denied

## Encryption at Rest

### Database Encryption

#### PostgreSQL Encryption

1. **Transparent Data Encryption (TDE)**:
   - Encrypt entire database files
   - Use PostgreSQL's built-in encryption or third-party solutions

2. **Column-Level Encryption**:
   - Use pgcrypto extension for sensitive columns
   - Encrypt specific columns like patient identifiers, contact information

3. **Implementation Example**:

```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create table with encrypted columns
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  mrn VARCHAR(50) UNIQUE,
  first_name TEXT,
  last_name TEXT,
  -- Encrypted columns
  phone_encrypted BYTEA,
  email_encrypted BYTEA,
  address_encrypted BYTEA,
  -- Other columns
  date_of_birth DATE,
  gender VARCHAR(10),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Functions to encrypt and decrypt
CREATE OR REPLACE FUNCTION encrypt_data(data TEXT, key TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(data, key);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrypt_data(data BYTEA, key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(data, key);
END;
$$ LANGUAGE plpgsql;
```

#### MongoDB Encryption

1. **Encrypted Storage Engine**:
   - Use MongoDB Enterprise Encrypted Storage Engine
   - Encrypt entire collections

2. **Field-Level Encryption**:
   - Encrypt specific fields in documents
   - Client-side encryption for sensitive fields

3. **Implementation Example**:

```javascript
// Define encryption schema
const encryptionSchema = {
  bsonType: 'object',
  properties: {
    patientId: {
      encrypt: {
        bsonType: 'string',
        algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
      }
    },
    contactInfo: {
      encrypt: {
        bsonType: 'object',
        algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random'
      }
    }
  }
};

// Create encrypted collection
db.createCollection('clinicalNotes', {
  validator: {
    $jsonSchema: encryptionSchema
  }
});
```

### File Storage Encryption

1. **Encryption Algorithm**: AES-256-GCM
2. **Key Management**: Separate encryption keys for different file types
3. **Implementation Approach**:
   - Encrypt files before storage
   - Store encryption metadata separately
   - Use envelope encryption (data key encrypted with master key)

4. **Implementation Example**:

```javascript
// Encrypt file
async function encryptFile(fileBuffer, metadata) {
  // Get data key
  const dataKey = await getDataKey(metadata.type);
  
  // Generate IV
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', dataKey, iv);
  
  // Encrypt data
  const encryptedData = Buffer.concat([
    cipher.update(fileBuffer),
    cipher.final()
  ]);
  
  // Get auth tag
  const authTag = cipher.getAuthTag();
  
  // Return encrypted data and metadata
  return {
    encryptedData,
    metadata: {
      ...metadata,
      encryption: {
        algorithm: 'aes-256-gcm',
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        keyId: dataKey.id
      }
    }
  };
}

// Decrypt file
async function decryptFile(encryptedData, metadata) {
  // Get data key
  const dataKey = await getDataKeyById(metadata.encryption.keyId);
  
  // Parse IV and auth tag
  const iv = Buffer.from(metadata.encryption.iv, 'base64');
  const authTag = Buffer.from(metadata.encryption.authTag, 'base64');
  
  // Create decipher
  const decipher = crypto.createDecipheriv('aes-256-gcm', dataKey, iv);
  decipher.setAuthTag(authTag);
  
  // Decrypt data
  return Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ]);
}
```

## Encryption in Transit

### TLS Configuration

1. **Protocol Version**: TLS 1.3 (minimum TLS 1.2)
2. **Cipher Suites**:
   - TLS_AES_256_GCM_SHA384
   - TLS_CHACHA20_POLY1305_SHA256
   - TLS_AES_128_GCM_SHA256
3. **Certificate Management**:
   - Use Let's Encrypt for certificate issuance
   - Automatic certificate renewal
   - Certificate pinning for mobile applications

4. **Implementation Example**:

```javascript
// HTTPS server configuration
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem'),
  ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256',
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',
  honorCipherOrder: true,
  secureOptions: crypto.constants.SSL_OP_NO_TLSv1 | crypto.constants.SSL_OP_NO_TLSv1_1
};

https.createServer(options, app).listen(443);
```

### Security Headers

1. **HTTP Strict Transport Security (HSTS)**:
   - max-age: 1 year
   - includeSubDomains
   - preload

2. **Content Security Policy (CSP)**:
   - Restrict resource loading
   - Prevent XSS attacks

3. **Implementation Example**:

```javascript
// Express middleware for security headers
app.use((req, res, next) => {
  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // CSP
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';");
  
  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});
```

## End-to-End Encryption

### Approach

1. **Use Case**: Highly sensitive communications and data
2. **Implementation**: Client-side encryption with secure key exchange
3. **Key Exchange**: Diffie-Hellman key exchange

### Implementation Example

```javascript
// Client-side encryption (using TweetNaCl.js)
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

// Generate key pair
function generateKeyPair() {
  return nacl.box.keyPair();
}

// Encrypt message
function encryptMessage(message, recipientPublicKey, senderSecretKey) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = naclUtil.decodeUTF8(message);
  
  const encrypted = nacl.box(
    messageUint8,
    nonce,
    recipientPublicKey,
    senderSecretKey
  );
  
  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);
  
  return naclUtil.encodeBase64(fullMessage);
}

// Decrypt message
function decryptMessage(messageWithNonce, senderPublicKey, recipientSecretKey) {
  const messageWithNonceAsUint8Array = naclUtil.decodeBase64(messageWithNonce);
  const nonce = messageWithNonceAsUint8Array.slice(0, nacl.box.nonceLength);
  const message = messageWithNonceAsUint8Array.slice(nacl.box.nonceLength);
  
  const decrypted = nacl.box.open(
    message,
    nonce,
    senderPublicKey,
    recipientSecretKey
  );
  
  if (!decrypted) {
    throw new Error('Could not decrypt message');
  }
  
  return naclUtil.encodeUTF8(decrypted);
}
```

## Key Management

### Key Hierarchy

```
┌───────────────┐
│               │
│  Master Key   │
│               │
└───────┬───────┘
        │
        ├─────────────────┬─────────────────┐
        │                 │                 │
┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐
│               │ │               │ │               │
│  Data Key 1   │ │  Data Key 2   │ │  Data Key 3   │
│ (Patient Data)│ │ (Clinical     │ │ (User Data)   │
│               │ │  Notes)       │ │               │
└───────────────┘ └───────────────┘ └───────────────┘
```

### Key Storage

1. **Master Keys**: HashiCorp Vault
2. **Data Keys**: Encrypted with master keys and stored in database
3. **Key Rotation**: Regular rotation of data keys

### Implementation Example

```javascript
// Key management service
class KeyManagementService {
  constructor(vaultClient) {
    this.vaultClient = vaultClient;
  }
  
  // Get master key
  async getMasterKey() {
    const response = await this.vaultClient.read('secret/data/master-key');
    return response.data.data.value;
  }
  
  // Generate data key
  async generateDataKey(keyType) {
    // Generate random key
    const dataKey = crypto.randomBytes(32);
    
    // Get master key
    const masterKey = await this.getMasterKey();
    
    // Encrypt data key with master key
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
    const encryptedDataKey = Buffer.concat([
      cipher.update(dataKey),
      cipher.final()
    ]);
    const authTag = cipher.getAuthTag();
    
    // Store encrypted data key
    const keyId = uuidv4();
    await this.storeDataKey(keyId, {
      type: keyType,
      encryptedKey: encryptedDataKey.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      createdAt: new Date().toISOString()
    });
    
    // Return data key and metadata
    return {
      id: keyId,
      key: dataKey
    };
  }
  
  // Get data key
  async getDataKey(keyType) {
    // Get latest key for type
    const keyMetadata = await this.getLatestKeyMetadata(keyType);
    
    // Get master key
    const masterKey = await this.getMasterKey();
    
    // Decrypt data key
    const iv = Buffer.from(keyMetadata.iv, 'base64');
    const authTag = Buffer.from(keyMetadata.authTag, 'base64');
    const encryptedDataKey = Buffer.from(keyMetadata.encryptedKey, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
    decipher.setAuthTag(authTag);
    
    const dataKey = Buffer.concat([
      decipher.update(encryptedDataKey),
      decipher.final()
    ]);
    
    // Return data key and metadata
    return {
      id: keyMetadata.id,
      key: dataKey
    };
  }
}
```

## Implementation Plan

| Task | Description | Priority | Complexity | Ticket Reference |
|------|-------------|----------|------------|------------------|
| TLS Configuration | Configure TLS for all services | High | Low | MVP-003 |
| Security Headers | Implement security headers | High | Low | MVP-003 |
| Database Encryption | Configure database encryption | High | Medium | MVP-007 |
| Field-Level Encryption | Implement field-level encryption | High | Medium | MVP-007 |
| File Encryption | Implement file encryption | Medium | Medium | MVP-007 |
| Key Management | Set up key management service | High | High | MVP-007 |
| E2E Encryption | Implement end-to-end encryption | Low | High | Future Enhancement |

## References

1. [NIST Cryptographic Standards](https://csrc.nist.gov/Projects/Cryptographic-Standards-and-Guidelines)
2. [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
3. [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
