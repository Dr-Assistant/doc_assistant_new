# ABDM Integration

This directory contains technical specifications and documentation for integrating Dr. Assistant with the Ayushman Bharat Digital Mission (ABDM) ecosystem.

## Contents

- [ABDM Integration Technical Specification](./ABDM_Integration.md): Detailed technical specifications for ABDM integration
- Additional documentation will be added as the implementation progresses

## Overview

The ABDM integration enables Dr. Assistant to:

1. Verify and link patient ABHA IDs (Ayushman Bharat Health Account)
2. Request and manage consent for accessing patient health records
3. Fetch and display patient health records from ABDM-connected healthcare providers
4. Ensure compliance with ABDM security and privacy requirements

This integration is a key component of our strategy to provide doctors with comprehensive patient information and reduce administrative burden.

## Implementation Status

The ABDM integration is being implemented according to the following development tickets:

- MVP-016: Setup ABDM Sandbox Environment
- MVP-017: Implement ABDM Consent Management
- MVP-018: Implement ABDM Health Record Fetching
- MVP-021: Implement ABDM Consent UI
- MVP-027: Implement Pre-Diagnosis Summary Service (uses ABDM records)
- MVP-029: Implement Patient Record View Service (integrates ABDM records)
- MVP-031: Implement Patient Record View UI

## References

For more information about ABDM compliance requirements, see [ABDM_Requirements.md](../../../market_research/regulatory_compliance/ABDM_Requirements.md).
