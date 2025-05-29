const geminiService = require('../../src/services/gemini.service');

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn()
    })
  }))
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('GeminiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildPrescriptionPrompt', () => {
    it('should build a comprehensive prompt with context', () => {
      const text = 'Patient needs metoprolol 50mg twice daily for hypertension.';
      const context = {
        patientInfo: { age: 45, gender: 'male', allergies: ['penicillin'] },
        encounterInfo: { type: 'consultation' },
        specialty: 'Cardiology'
      };

      const prompt = geminiService.buildPrescriptionPrompt(text, context);

      expect(prompt).toContain('Specialty: Cardiology');
      expect(prompt).toContain('Patient Age: 45');
      expect(prompt).toContain('Patient Gender: male');
      expect(prompt).toContain('Known Allergies: penicillin');
      expect(prompt).toContain(text);
      expect(prompt).toContain('JSON object');
      expect(prompt).toContain('medications');
    });

    it('should handle missing context gracefully', () => {
      const text = 'Patient has fever and needs antibiotics.';
      const context = {};

      const prompt = geminiService.buildPrescriptionPrompt(text, context);

      expect(prompt).toContain('Not specified');
      expect(prompt).toContain(text);
      expect(prompt).toContain('medications');
    });
  });

  describe('parsePrescriptionData', () => {
    it('should parse valid JSON response', () => {
      const validJsonResponse = `
        \`\`\`json
        {
          "medications": [
            {
              "medicationName": "metoprolol",
              "dosage": {
                "amount": 50,
                "unit": "mg"
              },
              "frequency": {
                "times": 2,
                "period": "daily",
                "abbreviation": "bid"
              },
              "route": "oral",
              "indication": "hypertension",
              "confidenceScore": 0.9
            }
          ],
          "extractionNotes": "Clear prescription found",
          "clinicalContext": "Hypertension management"
        }
        \`\`\`
      `;

      const result = geminiService.parsePrescriptionData(validJsonResponse);

      expect(result.medications).toHaveLength(1);
      expect(result.medications[0].medicationName).toBe('metoprolol');
      expect(result.medications[0].dosage.amount).toBe(50);
      expect(result.medications[0].dosage.unit).toBe('mg');
      expect(result.medications[0].frequency.times).toBe(2);
      expect(result.medications[0].frequency.abbreviation).toBe('bid');
    });

    it('should handle malformed JSON with regex fallback', () => {
      const malformedResponse = `
        Patient needs metoprolol 50mg twice daily for blood pressure.
        Also prescribe lisinopril 10mg once daily.
      `;

      const result = geminiService.parsePrescriptionData(malformedResponse);

      expect(result.medications).toBeDefined();
      expect(result.extractionNotes).toContain('regex patterns');
    });
  });

  describe('validateAndNormalizePrescription', () => {
    it('should normalize incomplete prescription structure', () => {
      const incompletePrescription = {
        medications: [
          {
            medicationName: 'metoprolol',
            dosage: { amount: 50 }
          }
        ]
      };

      const result = geminiService.validateAndNormalizePrescription(incompletePrescription);

      expect(result.medications).toHaveLength(1);
      expect(result.medications[0].medicationName).toBe('metoprolol');
      expect(result.medications[0].dosage.amount).toBe(50);
      expect(result.medications[0].dosage.unit).toBe('mg');
      expect(result.medications[0].frequency.times).toBe(1);
      expect(result.medications[0].route).toBe('oral');
    });

    it('should handle empty input', () => {
      const result = geminiService.validateAndNormalizePrescription({});

      expect(result.medications).toEqual([]);
      expect(result.extractionNotes).toBe('');
      expect(result.clinicalContext).toBe('');
    });
  });

  describe('enhancePrescriptionData', () => {
    it('should enhance prescription with database information', () => {
      const prescription = {
        medications: [
          {
            medicationName: 'metoprolol',
            dosage: { amount: 50, unit: 'mg' },
            frequency: { times: 2, period: 'daily' }
          }
        ]
      };

      const enhanced = geminiService.enhancePrescriptionData(prescription, {});

      expect(enhanced.medications[0].genericName).toBe('metoprolol');
      expect(enhanced.medications[0].category).toBe('cardiovascular');
      expect(enhanced.medications[0].drugClass).toBe('beta-blocker');
    });

    it('should flag unusual dosages', () => {
      const prescription = {
        medications: [
          {
            medicationName: 'metoprolol',
            dosage: { amount: 999, unit: 'mg' },
            frequency: { times: 1, period: 'daily' }
          }
        ]
      };

      const enhanced = geminiService.enhancePrescriptionData(prescription, {});

      expect(enhanced.medications[0].dosageAlert).toContain('Unusual dosage');
    });
  });

  describe('findMedicationInDatabase', () => {
    it('should find medication by generic name', () => {
      const result = geminiService.findMedicationInDatabase('metoprolol');

      expect(result).toBeDefined();
      expect(result.genericName).toBe('metoprolol');
      expect(result.category).toBe('cardiovascular');
    });

    it('should find medication by brand name', () => {
      const result = geminiService.findMedicationInDatabase('Lopressor');

      expect(result).toBeDefined();
      expect(result.genericName).toBe('metoprolol');
    });

    it('should return null for unknown medication', () => {
      const result = geminiService.findMedicationInDatabase('unknownmedication');

      expect(result).toBeNull();
    });
  });

  describe('calculateConfidenceScore', () => {
    it('should calculate high confidence for complete prescription', () => {
      const prescription = {
        medications: [
          {
            medicationName: 'metoprolol',
            dosage: { amount: 50, unit: 'mg' },
            frequency: { times: 2, period: 'daily' },
            instructions: 'Take with food',
            indication: 'hypertension',
            confidenceScore: 0.9
          }
        ]
      };

      const text = 'Patient needs metoprolol for blood pressure control';
      const confidence = geminiService.calculateConfidenceScore(prescription, text);

      expect(confidence).toBeGreaterThan(0.7);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it('should calculate low confidence for incomplete prescription', () => {
      const prescription = {
        medications: [
          {
            medicationName: 'unknownmedication',
            dosage: { amount: 0, unit: '' },
            frequency: { times: 0, period: '' },
            confidenceScore: 0.3
          }
        ]
      };

      const text = 'Patient needs some medication';
      const confidence = geminiService.calculateConfidenceScore(prescription, text);

      expect(confidence).toBeLessThan(0.7);
    });

    it('should return 0 for empty prescription', () => {
      const prescription = { medications: [] };
      const confidence = geminiService.calculateConfidenceScore(prescription, 'text');

      expect(confidence).toBe(0);
    });
  });

  describe('assessQuality', () => {
    it('should assess quality of complete prescription', () => {
      const prescription = {
        medications: [
          {
            medicationName: 'metoprolol',
            dosage: { amount: 50, unit: 'mg' },
            frequency: { times: 2, period: 'daily', abbreviation: 'bid' },
            route: 'oral',
            instructions: 'Take with food in the morning and evening',
            indication: 'hypertension'
          }
        ]
      };

      const quality = geminiService.assessQuality(prescription);

      expect(quality.completeness).toBeGreaterThan(0.8);
      expect(quality.accuracy).toBeGreaterThan(0.8);
      expect(quality.clarity).toBeGreaterThan(0.5);
      expect(quality.safety).toBeGreaterThan(0.5);
      expect(quality.overall).toBeGreaterThan(0.5);
    });

    it('should return low quality for empty prescription', () => {
      const prescription = { medications: [] };
      const quality = geminiService.assessQuality(prescription);

      expect(quality.completeness).toBe(0);
      expect(quality.accuracy).toBe(0);
      expect(quality.clarity).toBe(0);
      expect(quality.safety).toBe(0);
      expect(quality.overall).toBe(0);
    });
  });

  describe('checkDrugInteractions', () => {
    it('should detect known drug interactions', () => {
      const medications = [
        { medicationName: 'metoprolol' },
        { medicationName: 'verapamil' }
      ];

      const interactions = geminiService.checkDrugInteractions(medications);

      expect(interactions).toHaveLength(1);
      expect(interactions[0].severity).toBe('major');
      expect(interactions[0].description).toContain('bradycardia');
    });

    it('should return empty array for no interactions', () => {
      const medications = [
        { medicationName: 'metoprolol' },
        { medicationName: 'acetaminophen' }
      ];

      const interactions = geminiService.checkDrugInteractions(medications);

      expect(interactions).toHaveLength(0);
    });

    it('should handle single medication', () => {
      const medications = [
        { medicationName: 'metoprolol' }
      ];

      const interactions = geminiService.checkDrugInteractions(medications);

      expect(interactions).toHaveLength(0);
    });
  });

  describe('validateDosages', () => {
    it('should detect overdose', () => {
      const medications = [
        {
          medicationName: 'metoprolol',
          dosage: { amount: 500, unit: 'mg' },
          frequency: { times: 2, period: 'daily' }
        }
      ];

      const alerts = geminiService.validateDosages(medications, {});

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('overdose');
      expect(alerts[0].description).toContain('exceeds maximum');
    });

    it('should detect age-inappropriate medications', () => {
      const medications = [
        {
          medicationName: 'sertraline',
          dosage: { amount: 50, unit: 'mg' },
          frequency: { times: 1, period: 'daily' }
        }
      ];

      const alerts = geminiService.validateDosages(medications, { age: 70 });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].alertType).toBe('age-inappropriate');
    });

    it('should return empty array for safe dosages', () => {
      const medications = [
        {
          medicationName: 'metoprolol',
          dosage: { amount: 50, unit: 'mg' },
          frequency: { times: 2, period: 'daily' }
        }
      ];

      const alerts = geminiService.validateDosages(medications, { age: 45 });

      expect(alerts).toHaveLength(0);
    });
  });

  describe('calculateDailyDose', () => {
    it('should calculate daily dose correctly', () => {
      const medication = {
        dosage: { amount: 50, unit: 'mg' },
        frequency: { times: 2, period: 'daily' }
      };

      const dailyDose = geminiService.calculateDailyDose(medication);

      expect(dailyDose).toBe(100);
    });

    it('should handle weekly frequency', () => {
      const medication = {
        dosage: { amount: 100, unit: 'mg' },
        frequency: { times: 7, period: 'weekly' }
      };

      const dailyDose = geminiService.calculateDailyDose(medication);

      expect(dailyDose).toBe(100);
    });
  });

  describe('estimateTokenUsage', () => {
    it('should estimate token usage correctly', () => {
      const prompt = 'This is a test prompt with some words';
      const response = 'This is a test response';

      const usage = geminiService.estimateTokenUsage(prompt, response);

      expect(usage.inputTokens).toBeGreaterThan(0);
      expect(usage.outputTokens).toBeGreaterThan(0);
      expect(usage.totalTokens).toBe(usage.inputTokens + usage.outputTokens);
    });
  });
});
