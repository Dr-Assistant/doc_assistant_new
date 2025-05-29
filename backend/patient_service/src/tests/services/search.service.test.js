/**
 * Search Service Tests
 */

const { Op } = require('sequelize');
const searchService = require('../../services/search.service');
const { Patient, MedicalHistory } = require('../../models');

// Mock models
jest.mock('../../models', () => ({
  Patient: {
    findAndCountAll: jest.fn()
  },
  MedicalHistory: {
    findAndCountAll: jest.fn()
  }
}));

describe('Search Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('searchPatients', () => {
    it('should search patients with text query', async () => {
      const mockQuery = 'john';
      const mockResults = {
        count: 1,
        rows: [{
          id: 'test-id',
          first_name: 'John',
          last_name: 'Doe',
          mrn: 'MRN123',
          abha_id: 'ABHA123',
          email: 'john@example.com'
        }]
      };

      Patient.findAndCountAll.mockResolvedValueOnce(mockResults);

      const result = await searchService.searchPatients({ query: mockQuery });
      expect(result.total).toBe(1);
      expect(result.results[0].relevanceScore).toBeGreaterThan(0);
      expect(Patient.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          [Op.or]: expect.arrayContaining([
            expect.objectContaining({ first_name: { [Op.iLike]: `%${mockQuery}%` } })
          ])
        })
      }));
    });

    it('should search patients with age range filter', async () => {
      const mockAgeRange = { min: 20, max: 30 };
      const mockResults = {
        count: 1,
        rows: [{
          id: 'test-id',
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: new Date('1995-01-01')
        }]
      };

      Patient.findAndCountAll.mockResolvedValueOnce(mockResults);

      const result = await searchService.searchPatients({ ageRange: mockAgeRange });
      expect(result.total).toBe(1);
      expect(Patient.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          date_of_birth: expect.any(Object)
        })
      }));
    });

    it('should search patients with medical history filters', async () => {
      const mockResults = {
        count: 1,
        rows: [{
          id: 'test-id',
          first_name: 'John',
          last_name: 'Doe',
          medicalHistory: {
            chronic_conditions: ['Diabetes'],
            allergies: ['Penicillin']
          }
        }]
      };

      Patient.findAndCountAll.mockResolvedValueOnce(mockResults);

      const result = await searchService.searchPatients({
        hasChronicCondition: true,
        hasAllergy: true
      });

      expect(result.total).toBe(1);
      expect(Patient.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({
            model: MedicalHistory,
            where: expect.objectContaining({
              chronic_conditions: expect.any(Object),
              allergies: expect.any(Object)
            })
          })
        ])
      }));
    });

    it('should handle search errors', async () => {
      Patient.findAndCountAll.mockRejectedValueOnce(new Error('Database error'));

      await expect(searchService.searchPatients({})).rejects.toThrow('Failed to search patients');
    });
  });

  describe('searchMedicalHistory', () => {
    it('should search medical history by patient ID', async () => {
      const mockPatientId = 'test-patient-id';
      const mockResults = {
        count: 1,
        rows: [{
          id: 'test-id',
          patient_id: mockPatientId,
          chronic_conditions: ['Diabetes'],
          medication_history: ['Insulin']
        }]
      };

      MedicalHistory.findAndCountAll.mockResolvedValueOnce(mockResults);

      const result = await searchService.searchMedicalHistory({ patientId: mockPatientId });
      expect(result.total).toBe(1);
      expect(MedicalHistory.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          patient_id: mockPatientId
        })
      }));
    });

    it('should search medical history by condition', async () => {
      const mockCondition = 'Diabetes';
      const mockResults = {
        count: 1,
        rows: [{
          id: 'test-id',
          chronic_conditions: [{ condition: 'Diabetes', diagnosis_date: '2020-01-01' }]
        }]
      };

      MedicalHistory.findAndCountAll.mockResolvedValueOnce(mockResults);

      const result = await searchService.searchMedicalHistory({ condition: mockCondition });
      expect(result.total).toBe(1);
      expect(MedicalHistory.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          chronic_conditions: expect.any(Object)
        })
      }));
    });

    it('should search medical history by date range', async () => {
      const mockDateRange = {
        start: '2020-01-01',
        end: '2020-12-31'
      };
      const mockResults = {
        count: 1,
        rows: [{
          id: 'test-id',
          created_at: '2020-06-15'
        }]
      };

      MedicalHistory.findAndCountAll.mockResolvedValueOnce(mockResults);

      const result = await searchService.searchMedicalHistory({ dateRange: mockDateRange });
      expect(result.total).toBe(1);
      expect(MedicalHistory.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          created_at: expect.any(Object)
        })
      }));
    });

    it('should handle search errors', async () => {
      MedicalHistory.findAndCountAll.mockRejectedValueOnce(new Error('Database error'));

      await expect(searchService.searchMedicalHistory({})).rejects.toThrow('Failed to search medical history');
    });
  });

  describe('_rankSearchResults', () => {
    it('should rank results by relevance score', () => {
      const mockResults = [
        { first_name: 'John', last_name: 'Doe', mrn: 'MRN123', abha_id: 'ABHA123', email: 'john@example.com' },
        { first_name: 'Jane', last_name: 'Smith', mrn: 'MRN456', abha_id: 'ABHA456', email: 'jane@example.com' }
      ];

      const rankedResults = searchService._rankSearchResults(mockResults, 'john');
      expect(rankedResults[0].relevanceScore).toBeGreaterThan(rankedResults[1].relevanceScore);
    });

    it('should return unranked results when no query provided', () => {
      const mockResults = [
        { first_name: 'John', last_name: 'Doe' },
        { first_name: 'Jane', last_name: 'Smith' }
      ];

      const rankedResults = searchService._rankSearchResults(mockResults);
      expect(rankedResults).toEqual(mockResults);
    });
  });
}); 