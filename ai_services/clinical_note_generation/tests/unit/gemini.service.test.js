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

  describe('buildClinicalNotePrompt', () => {
    it('should build a comprehensive prompt with context', () => {
      const transcription = 'Patient complains of chest pain and shortness of breath.';
      const context = {
        patientInfo: { age: 45, gender: 'male' },
        encounterType: 'consultation',
        specialty: 'Cardiology'
      };

      const prompt = geminiService.buildClinicalNotePrompt(transcription, context);

      expect(prompt).toContain('Specialty: Cardiology');
      expect(prompt).toContain('Patient Age: 45');
      expect(prompt).toContain('Patient Gender: male');
      expect(prompt).toContain(transcription);
      expect(prompt).toContain('SOAP note');
      expect(prompt).toContain('JSON object');
    });

    it('should handle missing context gracefully', () => {
      const transcription = 'Patient has fever and cough.';
      const context = {};

      const prompt = geminiService.buildClinicalNotePrompt(transcription, context);

      expect(prompt).toContain('Not specified');
      expect(prompt).toContain(transcription);
      expect(prompt).toContain('SOAP note');
    });
  });

  describe('parseSoapNote', () => {
    it('should parse valid JSON response', () => {
      const validJsonResponse = `
        \`\`\`json
        {
          "subjective": {
            "chiefComplaint": "Chest pain",
            "historyOfPresentIllness": "Patient reports chest pain for 2 days"
          },
          "objective": {
            "vitalSigns": {
              "bloodPressure": "140/90"
            }
          },
          "assessment": {
            "clinicalImpression": "Possible angina"
          },
          "plan": {
            "followUp": {
              "timeframe": "1 week"
            }
          }
        }
        \`\`\`
      `;

      const result = geminiService.parseSoapNote(validJsonResponse);

      expect(result.subjective.chiefComplaint).toBe('Chest pain');
      expect(result.objective.vitalSigns.bloodPressure).toBe('140/90');
      expect(result.assessment.clinicalImpression).toBe('Possible angina');
      expect(result.plan.followUp.timeframe).toBe('1 week');
    });

    it('should handle malformed JSON with regex fallback', () => {
      const malformedResponse = `
        SUBJECTIVE: Patient has chest pain
        OBJECTIVE: Blood pressure 140/90
        ASSESSMENT: Possible angina
        PLAN: Follow up in 1 week
      `;

      const result = geminiService.parseSoapNote(malformedResponse);

      expect(result.subjective.historyOfPresentIllness).toContain('chest pain');
      expect(result.objective.physicalExamination.general).toContain('Blood pressure');
      expect(result.assessment.clinicalImpression).toContain('angina');
      expect(result.plan.followUp.instructions).toContain('Follow up');
    });
  });

  describe('validateAndNormalizeSoapNote', () => {
    it('should normalize incomplete SOAP note structure', () => {
      const incompleteSoapNote = {
        subjective: {
          chiefComplaint: 'Chest pain'
        },
        assessment: {
          clinicalImpression: 'Angina'
        }
      };

      const result = geminiService.validateAndNormalizeSoapNote(incompleteSoapNote);

      expect(result.subjective.chiefComplaint).toBe('Chest pain');
      expect(result.subjective.historyOfPresentIllness).toBe('');
      expect(result.objective.vitalSigns).toEqual({});
      expect(result.assessment.clinicalImpression).toBe('Angina');
      expect(result.plan.followUp).toEqual({});
    });

    it('should handle empty input', () => {
      const result = geminiService.validateAndNormalizeSoapNote({});

      expect(result.subjective.chiefComplaint).toBe('');
      expect(result.objective.vitalSigns).toEqual({});
      expect(result.assessment.clinicalImpression).toBe('');
      expect(result.plan.followUp).toEqual({});
    });
  });

  describe('calculateConfidenceScore', () => {
    it('should calculate confidence for complete SOAP note', () => {
      const completeSoapNote = {
        subjective: {
          chiefComplaint: 'Chest pain',
          historyOfPresentIllness: 'Patient reports chest pain for 2 days'
        },
        assessment: {
          clinicalImpression: 'Possible angina'
        },
        plan: {
          followUp: { timeframe: '1 week' },
          treatments: [{ intervention: 'medication' }]
        }
      };

      const transcription = 'Patient has chest pain hypertension diabetes and needs follow up medication treatment';
      const confidence = geminiService.calculateConfidenceScore(completeSoapNote, transcription);

      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
      expect(typeof confidence).toBe('number');
    });

    it('should calculate low confidence for incomplete SOAP note', () => {
      const incompleteSoapNote = {
        subjective: {},
        assessment: {},
        plan: {}
      };

      const transcription = 'Patient has symptoms';
      const confidence = geminiService.calculateConfidenceScore(incompleteSoapNote, transcription);

      expect(confidence).toBeLessThan(0.7);
    });
  });

  describe('countMedicalTerms', () => {
    it('should count medical terms in text', () => {
      const text = 'Patient has hypertension and diabetes with chest pain';
      const count = geminiService.countMedicalTerms(text);

      expect(count).toBeGreaterThan(0);
    });

    it('should return 0 for non-medical text', () => {
      const text = 'The weather is nice today';
      const count = geminiService.countMedicalTerms(text);

      expect(count).toBe(0);
    });
  });

  describe('assessQuality', () => {
    it('should assess quality of complete SOAP note', () => {
      const soapNote = {
        subjective: {
          chiefComplaint: 'Chest pain',
          historyOfPresentIllness: 'Patient reports chest pain for 2 days'
        },
        assessment: {
          clinicalImpression: 'Possible angina'
        },
        plan: {
          followUp: { timeframe: '1 week' }
        }
      };

      const quality = geminiService.assessQuality(soapNote);

      expect(quality.completeness).toBeGreaterThan(0.5);
      expect(quality.accuracy).toBeGreaterThan(0.5);
      expect(quality.relevance).toBeGreaterThan(0.5);
      expect(quality.clarity).toBeGreaterThan(0.5);
      expect(quality.overall).toBeGreaterThan(0.5);
    });
  });

  describe('suggestICD10Code', () => {
    it('should suggest correct ICD-10 codes for common conditions', () => {
      expect(geminiService.suggestICD10Code('hypertension')).toBe('I10');
      expect(geminiService.suggestICD10Code('diabetes mellitus')).toBe('E11.9');
      expect(geminiService.suggestICD10Code('chest pain')).toBe('R06.02');
      expect(geminiService.suggestICD10Code('headache')).toBe('R51');
    });

    it('should return empty string for unknown conditions', () => {
      expect(geminiService.suggestICD10Code('unknown condition')).toBe('');
    });
  });

  describe('enhanceSoapNote', () => {
    it('should enhance SOAP note with ICD-10 codes', () => {
      const soapNote = {
        assessment: {
          primaryDiagnosis: {
            description: 'hypertension'
          }
        }
      };

      const enhanced = geminiService.enhanceSoapNote(soapNote);

      expect(enhanced.assessment.primaryDiagnosis.code).toBe('I10');
      expect(enhanced.assessment.primaryDiagnosis.confidence).toBe(0.8);
    });

    it('should add patient context to social history', () => {
      const soapNote = {
        subjective: {}
      };
      const patientContext = { age: 45 };

      const enhanced = geminiService.enhanceSoapNote(soapNote, patientContext);

      expect(enhanced.subjective.socialHistory).toContain('Patient age: 45');
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
