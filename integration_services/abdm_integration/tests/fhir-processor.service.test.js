/**
 * FHIR Processor Service Tests
 */

const { processHealthInfoBundle } = require('../src/services/fhir-processor.service');
const { HealthRecord, HealthRecordProcessingLog } = require('../src/models');
const { BadRequestError } = require('../src/middleware/error.middleware');

// Mock dependencies
jest.mock('../src/models');

describe('FHIR Processor Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processHealthInfoBundle', () => {
    const mockFetchRequestId = '123e4567-e89b-12d3-a456-426614174000';

    const mockValidBundle = {
      resourceType: 'Bundle',
      id: 'bundle-123',
      entry: [
        {
          resource: {
            resourceType: 'DiagnosticReport',
            id: 'diagnostic-report-1',
            status: 'final',
            code: {
              text: 'Blood Test Report',
              coding: [
                {
                  display: 'Complete Blood Count'
                }
              ]
            },
            subject: {
              reference: 'Patient/patient-123'
            },
            effectiveDateTime: '2024-01-15T10:00:00Z',
            issued: '2024-01-15T12:00:00Z',
            performer: [
              {
                reference: 'Organization/lab-123',
                display: 'Test Laboratory'
              }
            ],
            conclusion: 'Normal blood count values'
          }
        },
        {
          resource: {
            resourceType: 'Observation',
            id: 'observation-1',
            status: 'final',
            code: {
              text: 'Hemoglobin',
              coding: [
                {
                  display: 'Hemoglobin measurement'
                }
              ]
            },
            subject: {
              reference: 'Patient/patient-123'
            },
            effectiveDateTime: '2024-01-15T10:00:00Z',
            valueQuantity: {
              value: 14.5,
              unit: 'g/dL'
            }
          }
        }
      ]
    };

    it('should successfully process valid FHIR bundle', async () => {
      // Mock database operations
      HealthRecord.findByAbdmRecordId.mockResolvedValue(null); // No duplicates
      HealthRecord.create.mockImplementation((data) => ({
        id: `health-record-${data.abdmRecordId}`,
        ...data
      }));
      HealthRecordProcessingLog.logProcessing.mockResolvedValue();

      const result = await processHealthInfoBundle(mockValidBundle, mockFetchRequestId);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.totalCount).toBe(2);

      // Verify health records were created
      expect(HealthRecord.create).toHaveBeenCalledTimes(2);
      
      // Check first record (DiagnosticReport)
      expect(HealthRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fetchRequestId: mockFetchRequestId,
          abdmRecordId: 'diagnostic-report-1',
          recordType: 'DiagnosticReport',
          recordDate: '2024-01-15',
          source: 'ABDM',
          status: 'ACTIVE'
        })
      );

      // Check second record (Observation)
      expect(HealthRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fetchRequestId: mockFetchRequestId,
          abdmRecordId: 'observation-1',
          recordType: 'Observation',
          recordDate: '2024-01-15',
          source: 'ABDM',
          status: 'ACTIVE'
        })
      );

      // Verify processing logs were created
      expect(HealthRecordProcessingLog.logProcessing).toHaveBeenCalledWith(
        expect.objectContaining({
          fetchRequestId: mockFetchRequestId,
          processingStage: 'PARSE',
          status: 'SUCCESS'
        })
      );
    });

    it('should handle duplicate records correctly', async () => {
      // Mock existing record
      const existingRecord = {
        id: 'existing-record-id',
        abdmRecordId: 'diagnostic-report-1'
      };
      
      HealthRecord.findByAbdmRecordId
        .mockResolvedValueOnce(existingRecord) // First call returns existing record
        .mockResolvedValueOnce(null); // Second call returns null (no duplicate)
      
      HealthRecord.create.mockImplementation((data) => ({
        id: `health-record-${data.abdmRecordId}`,
        ...data
      }));
      HealthRecordProcessingLog.logProcessing.mockResolvedValue();

      const result = await processHealthInfoBundle(mockValidBundle, mockFetchRequestId);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1); // Only one new record created
      expect(result.failedCount).toBe(0);

      // Verify only one record was created (the non-duplicate)
      expect(HealthRecord.create).toHaveBeenCalledTimes(1);
      
      // Verify skipped log was created for duplicate
      expect(HealthRecordProcessingLog.logProcessing).toHaveBeenCalledWith(
        expect.objectContaining({
          fetchRequestId: mockFetchRequestId,
          healthRecordId: existingRecord.id,
          abdmRecordId: 'diagnostic-report-1',
          processingStage: 'STORE',
          status: 'SKIPPED'
        })
      );
    });

    it('should handle processing errors gracefully', async () => {
      // Mock database error for first record
      HealthRecord.findByAbdmRecordId
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(null);
      
      HealthRecord.create.mockImplementation((data) => ({
        id: `health-record-${data.abdmRecordId}`,
        ...data
      }));
      HealthRecordProcessingLog.logProcessing.mockResolvedValue();

      const result = await processHealthInfoBundle(mockValidBundle, mockFetchRequestId);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1); // One record processed successfully
      expect(result.failedCount).toBe(1); // One record failed
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        entryId: 'diagnostic-report-1',
        error: 'Database error'
      });
    });

    it('should throw BadRequestError for invalid bundle structure', async () => {
      const invalidBundle = {
        resourceType: 'Patient', // Wrong resource type
        id: 'invalid-bundle'
      };

      await expect(processHealthInfoBundle(invalidBundle, mockFetchRequestId))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError for bundle without entries', async () => {
      const bundleWithoutEntries = {
        resourceType: 'Bundle',
        id: 'bundle-no-entries'
        // Missing entry array
      };

      await expect(processHealthInfoBundle(bundleWithoutEntries, mockFetchRequestId))
        .rejects.toThrow(BadRequestError);
    });

    it('should handle empty bundle gracefully', async () => {
      const emptyBundle = {
        resourceType: 'Bundle',
        id: 'empty-bundle',
        entry: []
      };

      HealthRecordProcessingLog.logProcessing.mockResolvedValue();

      const result = await processHealthInfoBundle(emptyBundle, mockFetchRequestId);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    it('should handle entries without resources', async () => {
      const bundleWithInvalidEntry = {
        resourceType: 'Bundle',
        id: 'bundle-invalid-entry',
        entry: [
          {
            // Missing resource
          }
        ]
      };

      HealthRecordProcessingLog.logProcessing.mockResolvedValue();

      const result = await processHealthInfoBundle(bundleWithInvalidEntry, mockFetchRequestId);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Bundle entry must contain resource');
    });

    it('should map different FHIR resource types correctly', async () => {
      const bundleWithDifferentTypes = {
        resourceType: 'Bundle',
        id: 'bundle-different-types',
        entry: [
          {
            resource: {
              resourceType: 'MedicationRequest',
              id: 'medication-1',
              status: 'active',
              medicationCodeableConcept: {
                text: 'Aspirin 100mg'
              },
              subject: {
                reference: 'Patient/patient-123'
              },
              authoredOn: '2024-01-15T10:00:00Z'
            }
          },
          {
            resource: {
              resourceType: 'Condition',
              id: 'condition-1',
              clinicalStatus: {
                coding: [
                  {
                    display: 'Active'
                  }
                ]
              },
              code: {
                text: 'Hypertension'
              },
              subject: {
                reference: 'Patient/patient-123'
              },
              recordedDate: '2024-01-15T10:00:00Z'
            }
          }
        ]
      };

      HealthRecord.findByAbdmRecordId.mockResolvedValue(null);
      HealthRecord.create.mockImplementation((data) => ({
        id: `health-record-${data.abdmRecordId}`,
        ...data
      }));
      HealthRecordProcessingLog.logProcessing.mockResolvedValue();

      const result = await processHealthInfoBundle(bundleWithDifferentTypes, mockFetchRequestId);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(2);

      // Verify correct record type mapping
      expect(HealthRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          abdmRecordId: 'medication-1',
          recordType: 'Prescription' // MedicationRequest maps to Prescription
        })
      );

      expect(HealthRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          abdmRecordId: 'condition-1',
          recordType: 'Condition' // Condition maps to Condition
        })
      );
    });
  });
});
