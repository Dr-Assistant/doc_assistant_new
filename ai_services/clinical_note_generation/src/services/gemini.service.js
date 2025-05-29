const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const { InternalServerError, ValidationError } = require('../utils/error-handler');

class GeminiService {
  constructor() {
    // Initialize Google Generative AI
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

    // Get the model
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro'
    });

    // Default generation configuration
    this.defaultConfig = {
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.3,
      topP: parseFloat(process.env.GEMINI_TOP_P) || 0.8,
      topK: parseInt(process.env.GEMINI_TOP_K) || 40,
      maxOutputTokens: parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 8192,
    };

    // Medical terminology and context
    this.medicalContext = {
      specialties: [
        'Internal Medicine', 'Cardiology', 'Pulmonology', 'Gastroenterology',
        'Neurology', 'Endocrinology', 'Rheumatology', 'Infectious Disease',
        'Dermatology', 'Psychiatry', 'Orthopedics', 'Urology', 'Gynecology'
      ],
      commonConditions: [
        'Hypertension', 'Diabetes Mellitus', 'Hyperlipidemia', 'COPD', 'Asthma',
        'Coronary Artery Disease', 'Heart Failure', 'Atrial Fibrillation',
        'Chronic Kidney Disease', 'Osteoarthritis', 'Depression', 'Anxiety'
      ],
      vitalSigns: [
        'Blood Pressure', 'Heart Rate', 'Respiratory Rate', 'Temperature',
        'Oxygen Saturation', 'Weight', 'Height', 'BMI'
      ]
    };
  }

  /**
   * Generate clinical note from transcription
   * @param {string} transcription - Raw transcription text
   * @param {Object} context - Additional context (patient info, encounter details)
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated clinical note
   */
  async generateClinicalNote(transcription, context = {}, options = {}) {
    try {
      logger.info('Starting clinical note generation', {
        transcriptionLength: transcription.length,
        patientId: context.patientId,
        encounterId: context.encounterId
      });

      const startTime = Date.now();

      // Build the prompt
      const prompt = this.buildClinicalNotePrompt(transcription, context);

      // Generate content
      const config = { ...this.defaultConfig, ...options };
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: config
      });

      const response = await result.response;
      const generatedText = response.text();

      // Parse the generated SOAP note
      const parsedNote = this.parseSoapNote(generatedText);

      // Calculate processing metrics
      const processingTime = Date.now() - startTime;
      const tokenUsage = this.estimateTokenUsage(prompt, generatedText);

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(parsedNote, transcription);

      logger.info('Clinical note generation completed', {
        processingTime,
        confidenceScore,
        tokenUsage: tokenUsage.totalTokens
      });

      return {
        soapNote: parsedNote,
        metadata: {
          model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
          version: '1.0',
          temperature: config.temperature,
          maxTokens: config.maxOutputTokens,
          promptVersion: '1.0',
          processingTime,
          tokenUsage,
          confidenceScore,
          qualityMetrics: this.assessQuality(parsedNote)
        },
        rawResponse: generatedText
      };
    } catch (error) {
      logger.error('Clinical note generation failed', {
        error: error.message,
        stack: error.stack,
        transcriptionLength: transcription.length
      });
      throw new InternalServerError('Failed to generate clinical note');
    }
  }

  /**
   * Build the prompt for clinical note generation
   * @param {string} transcription - Raw transcription
   * @param {Object} context - Additional context
   * @returns {string} Formatted prompt
   */
  buildClinicalNotePrompt(transcription, context) {
    const { patientInfo = {}, encounterType = 'consultation', specialty = 'Internal Medicine' } = context;

    return `You are an expert medical AI assistant specializing in clinical documentation. Your task is to generate a comprehensive SOAP note from a doctor-patient conversation transcription.

**CONTEXT:**
- Specialty: ${specialty}
- Encounter Type: ${encounterType}
- Patient Age: ${patientInfo.age || 'Not specified'}
- Patient Gender: ${patientInfo.gender || 'Not specified'}
- Known Conditions: ${patientInfo.conditions?.join(', ') || 'None specified'}

**INSTRUCTIONS:**
1. Analyze the conversation carefully to extract relevant medical information
2. Generate a structured SOAP note with the following sections:
   - SUBJECTIVE: Patient's reported symptoms, history, and concerns
   - OBJECTIVE: Physical examination findings, vital signs, and test results
   - ASSESSMENT: Clinical impression, diagnoses, and differential diagnoses
   - PLAN: Treatment plan, medications, follow-up, and patient education

3. Use proper medical terminology and ICD-10 codes where appropriate
4. Be concise but comprehensive
5. Only include information that is explicitly mentioned or can be reasonably inferred
6. If information is missing, indicate it as "Not documented" or "Not assessed"

**OUTPUT FORMAT:**
Please structure your response as a JSON object with the following format:

\`\`\`json
{
  "subjective": {
    "chiefComplaint": "Brief description of main concern",
    "historyOfPresentIllness": "Detailed description of current symptoms and timeline",
    "reviewOfSystems": {
      "constitutional": "Constitutional symptoms if mentioned",
      "cardiovascular": "CV symptoms if mentioned",
      "respiratory": "Respiratory symptoms if mentioned",
      "gastrointestinal": "GI symptoms if mentioned",
      "musculoskeletal": "MSK symptoms if mentioned",
      "neurological": "Neuro symptoms if mentioned",
      "psychiatric": "Psychiatric symptoms if mentioned"
    },
    "pastMedicalHistory": "Relevant past medical history",
    "medications": "Current medications mentioned",
    "allergies": "Known allergies",
    "familyHistory": "Relevant family history",
    "socialHistory": "Relevant social history"
  },
  "objective": {
    "vitalSigns": {
      "bloodPressure": "BP if mentioned",
      "heartRate": "HR if mentioned",
      "temperature": "Temp if mentioned",
      "respiratoryRate": "RR if mentioned",
      "oxygenSaturation": "O2 sat if mentioned"
    },
    "physicalExamination": {
      "general": "General appearance",
      "cardiovascular": "CV exam findings",
      "respiratory": "Pulmonary exam findings",
      "abdominal": "Abdominal exam findings",
      "neurological": "Neuro exam findings"
    },
    "diagnosticResults": {
      "laboratoryResults": ["Lab results if mentioned"],
      "imagingResults": ["Imaging results if mentioned"]
    }
  },
  "assessment": {
    "primaryDiagnosis": {
      "code": "ICD-10 code if applicable",
      "description": "Primary diagnosis",
      "confidence": 0.85
    },
    "secondaryDiagnoses": [
      {
        "code": "ICD-10 code if applicable",
        "description": "Secondary diagnosis",
        "confidence": 0.75
      }
    ],
    "differentialDiagnoses": ["List of differential diagnoses"],
    "clinicalImpression": "Overall clinical assessment"
  },
  "plan": {
    "diagnostics": [
      {
        "test": "Diagnostic test",
        "reason": "Reason for test",
        "priority": "routine"
      }
    ],
    "treatments": [
      {
        "intervention": "Treatment intervention",
        "instructions": "Specific instructions",
        "duration": "Duration if specified"
      }
    ],
    "medications": [
      {
        "name": "Medication name",
        "dosage": "Dosage",
        "frequency": "Frequency",
        "duration": "Duration",
        "instructions": "Special instructions"
      }
    ],
    "patientEducation": ["Education points discussed"],
    "followUp": {
      "timeframe": "Follow-up timeframe",
      "instructions": "Follow-up instructions"
    },
    "referrals": [
      {
        "specialty": "Specialty",
        "reason": "Reason for referral",
        "urgency": "routine"
      }
    ]
  }
}
\`\`\`

**CONVERSATION TRANSCRIPTION:**
${transcription}

Please analyze this conversation and generate a comprehensive SOAP note following the format above. Ensure all medical information is accurately captured and properly categorized.`;
  }

  /**
   * Parse the generated SOAP note from Gemini response
   * @param {string} generatedText - Raw response from Gemini
   * @returns {Object} Parsed SOAP note
   */
  parseSoapNote(generatedText) {
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) ||
                       generatedText.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, generatedText];

      const jsonString = jsonMatch[1] || generatedText;
      const parsed = JSON.parse(jsonString.trim());

      // Validate and normalize the structure
      return this.validateAndNormalizeSoapNote(parsed);
    } catch (error) {
      logger.error('Failed to parse SOAP note JSON', {
        error: error.message,
        generatedText: generatedText.substring(0, 500)
      });

      // Fallback: try to extract information using regex patterns
      return this.extractSoapNoteWithRegex(generatedText);
    }
  }

  /**
   * Validate and normalize SOAP note structure
   * @param {Object} soapNote - Parsed SOAP note
   * @returns {Object} Validated SOAP note
   */
  validateAndNormalizeSoapNote(soapNote) {
    const normalized = {
      subjective: {
        chiefComplaint: soapNote.subjective?.chiefComplaint || '',
        historyOfPresentIllness: soapNote.subjective?.historyOfPresentIllness || '',
        reviewOfSystems: soapNote.subjective?.reviewOfSystems || {},
        pastMedicalHistory: soapNote.subjective?.pastMedicalHistory || '',
        medications: soapNote.subjective?.medications || '',
        allergies: soapNote.subjective?.allergies || '',
        familyHistory: soapNote.subjective?.familyHistory || '',
        socialHistory: soapNote.subjective?.socialHistory || ''
      },
      objective: {
        vitalSigns: soapNote.objective?.vitalSigns || {},
        physicalExamination: soapNote.objective?.physicalExamination || {},
        diagnosticResults: {
          laboratoryResults: soapNote.objective?.diagnosticResults?.laboratoryResults || [],
          imagingResults: soapNote.objective?.diagnosticResults?.imagingResults || [],
          otherTests: soapNote.objective?.diagnosticResults?.otherTests || []
        }
      },
      assessment: {
        primaryDiagnosis: soapNote.assessment?.primaryDiagnosis || {},
        secondaryDiagnoses: soapNote.assessment?.secondaryDiagnoses || [],
        differentialDiagnoses: soapNote.assessment?.differentialDiagnoses || [],
        clinicalImpression: soapNote.assessment?.clinicalImpression || '',
        riskFactors: soapNote.assessment?.riskFactors || [],
        prognosis: soapNote.assessment?.prognosis || ''
      },
      plan: {
        diagnostics: soapNote.plan?.diagnostics || [],
        treatments: soapNote.plan?.treatments || [],
        medications: soapNote.plan?.medications || [],
        patientEducation: soapNote.plan?.patientEducation || [],
        followUp: soapNote.plan?.followUp || {},
        referrals: soapNote.plan?.referrals || [],
        lifestyle: soapNote.plan?.lifestyle || [],
        monitoring: soapNote.plan?.monitoring || []
      }
    };

    return normalized;
  }

  /**
   * Extract SOAP note using regex patterns (fallback method)
   * @param {string} text - Generated text
   * @returns {Object} Extracted SOAP note
   */
  extractSoapNoteWithRegex(text) {
    logger.warn('Using regex fallback for SOAP note extraction');

    // Basic regex patterns to extract sections
    const subjectiveMatch = text.match(/SUBJECTIVE[:\s]*([\s\S]*?)(?=OBJECTIVE|$)/i);
    const objectiveMatch = text.match(/OBJECTIVE[:\s]*([\s\S]*?)(?=ASSESSMENT|$)/i);
    const assessmentMatch = text.match(/ASSESSMENT[:\s]*([\s\S]*?)(?=PLAN|$)/i);
    const planMatch = text.match(/PLAN[:\s]*([\s\S]*?)$/i);

    return {
      subjective: {
        chiefComplaint: this.extractChiefComplaint(subjectiveMatch?.[1] || ''),
        historyOfPresentIllness: subjectiveMatch?.[1]?.trim() || '',
        reviewOfSystems: {},
        pastMedicalHistory: '',
        medications: '',
        allergies: '',
        familyHistory: '',
        socialHistory: ''
      },
      objective: {
        vitalSigns: {},
        physicalExamination: {
          general: objectiveMatch?.[1]?.trim() || ''
        },
        diagnosticResults: {
          laboratoryResults: [],
          imagingResults: [],
          otherTests: []
        }
      },
      assessment: {
        primaryDiagnosis: {},
        secondaryDiagnoses: [],
        differentialDiagnoses: [],
        clinicalImpression: assessmentMatch?.[1]?.trim() || '',
        riskFactors: [],
        prognosis: ''
      },
      plan: {
        diagnostics: [],
        treatments: [],
        medications: [],
        patientEducation: [],
        followUp: {
          instructions: planMatch?.[1]?.trim() || ''
        },
        referrals: [],
        lifestyle: [],
        monitoring: []
      }
    };
  }

  /**
   * Extract chief complaint from subjective text
   * @param {string} subjectiveText - Subjective section text
   * @returns {string} Chief complaint
   */
  extractChiefComplaint(subjectiveText) {
    const ccMatch = subjectiveText.match(/(?:chief complaint|cc)[:\s]*(.*?)(?:\n|\.)/i);
    return ccMatch?.[1]?.trim() || subjectiveText.split('.')[0] || '';
  }

  /**
   * Calculate confidence score for generated note
   * @param {Object} soapNote - Generated SOAP note
   * @param {string} transcription - Original transcription
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidenceScore(soapNote, transcription) {
    let score = 0;
    let factors = 0;

    // Check completeness of required sections
    if (soapNote.subjective?.chiefComplaint) { score += 0.2; factors++; }
    if (soapNote.subjective?.historyOfPresentIllness) { score += 0.2; factors++; }
    if (soapNote.assessment?.clinicalImpression) { score += 0.3; factors++; }
    if (soapNote.plan?.followUp || soapNote.plan?.treatments?.length > 0) { score += 0.2; factors++; }

    // Check for medical terminology alignment
    const medicalTermsInTranscription = this.countMedicalTerms(transcription);
    const medicalTermsInNote = this.countMedicalTermsInNote(soapNote);

    if (medicalTermsInNote > 0 && medicalTermsInTranscription > 0) {
      const termAlignment = Math.min(medicalTermsInNote / medicalTermsInTranscription, 1);
      score += 0.1 * termAlignment;
      factors++;
    }

    return factors > 0 ? Math.min(score / factors, 1) : 0.5;
  }

  /**
   * Count medical terms in text
   * @param {string} text - Text to analyze
   * @returns {number} Count of medical terms
   */
  countMedicalTerms(text) {
    const medicalTerms = [
      ...this.medicalContext.commonConditions,
      ...this.medicalContext.vitalSigns,
      'pain', 'symptom', 'diagnosis', 'treatment', 'medication', 'prescription',
      'examination', 'history', 'patient', 'doctor', 'clinic', 'hospital'
    ];

    const lowerText = text.toLowerCase();
    return medicalTerms.filter(term => lowerText.includes(term.toLowerCase())).length;
  }

  /**
   * Count medical terms in SOAP note
   * @param {Object} soapNote - SOAP note object
   * @returns {number} Count of medical terms
   */
  countMedicalTermsInNote(soapNote) {
    const noteText = JSON.stringify(soapNote).toLowerCase();
    return this.countMedicalTerms(noteText);
  }

  /**
   * Assess quality of generated SOAP note
   * @param {Object} soapNote - Generated SOAP note
   * @returns {Object} Quality metrics
   */
  assessQuality(soapNote) {
    const completeness = this.assessCompleteness(soapNote);
    const accuracy = this.assessAccuracy(soapNote);
    const relevance = this.assessRelevance(soapNote);
    const clarity = this.assessClarity(soapNote);

    return {
      completeness,
      accuracy,
      relevance,
      clarity,
      overall: (completeness + accuracy + relevance + clarity) / 4
    };
  }

  /**
   * Assess completeness of SOAP note
   * @param {Object} soapNote - SOAP note
   * @returns {number} Completeness score (0-1)
   */
  assessCompleteness(soapNote) {
    const requiredFields = [
      soapNote.subjective?.chiefComplaint,
      soapNote.subjective?.historyOfPresentIllness,
      soapNote.assessment?.clinicalImpression,
      soapNote.plan?.followUp || soapNote.plan?.treatments?.length > 0
    ];

    const completedFields = requiredFields.filter(Boolean).length;
    return completedFields / requiredFields.length;
  }

  /**
   * Assess accuracy of SOAP note
   * @param {Object} soapNote - SOAP note
   * @returns {number} Accuracy score (0-1)
   */
  assessAccuracy(soapNote) {
    // Basic accuracy assessment based on structure and content
    let score = 0.8; // Base score

    // Check for proper medical terminology
    if (soapNote.assessment?.primaryDiagnosis?.description) score += 0.1;
    if (soapNote.plan?.medications?.length > 0) score += 0.1;

    return Math.min(score, 1);
  }

  /**
   * Assess relevance of SOAP note
   * @param {Object} soapNote - SOAP note
   * @returns {number} Relevance score (0-1)
   */
  assessRelevance(soapNote) {
    // Check if content is medically relevant
    const hasRelevantContent =
      soapNote.subjective?.chiefComplaint ||
      soapNote.assessment?.clinicalImpression ||
      soapNote.plan?.treatments?.length > 0;

    return hasRelevantContent ? 0.9 : 0.5;
  }

  /**
   * Assess clarity of SOAP note
   * @param {Object} soapNote - SOAP note
   * @returns {number} Clarity score (0-1)
   */
  assessClarity(soapNote) {
    // Basic clarity assessment based on content length and structure
    const sections = [
      soapNote.subjective?.chiefComplaint,
      soapNote.subjective?.historyOfPresentIllness,
      soapNote.assessment?.clinicalImpression
    ].filter(Boolean);

    const avgLength = sections.reduce((sum, section) => sum + section.length, 0) / sections.length;

    // Optimal length range: 50-500 characters per section
    if (avgLength >= 50 && avgLength <= 500) return 0.9;
    if (avgLength >= 20 && avgLength <= 1000) return 0.7;
    return 0.5;
  }

  /**
   * Estimate token usage for cost tracking
   * @param {string} prompt - Input prompt
   * @param {string} response - Generated response
   * @returns {Object} Token usage estimate
   */
  estimateTokenUsage(prompt, response) {
    // Rough estimation: 1 token ≈ 4 characters for English text
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(response.length / 4);

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens
    };
  }

  /**
   * Enhance SOAP note with additional medical context
   * @param {Object} soapNote - Base SOAP note
   * @param {Object} patientContext - Patient context
   * @returns {Object} Enhanced SOAP note
   */
  enhanceSoapNote(soapNote, patientContext = {}) {
    const enhanced = { ...soapNote };

    // Add ICD-10 codes if missing
    if (enhanced.assessment?.primaryDiagnosis && !enhanced.assessment.primaryDiagnosis.code) {
      enhanced.assessment.primaryDiagnosis.code = this.suggestICD10Code(
        enhanced.assessment.primaryDiagnosis.description
      );
    }

    // Add confidence scores if missing
    if (enhanced.assessment?.primaryDiagnosis && !enhanced.assessment.primaryDiagnosis.confidence) {
      enhanced.assessment.primaryDiagnosis.confidence = 0.8;
    }

    // Enhance with patient context
    if (patientContext.age && !enhanced.subjective?.socialHistory) {
      enhanced.subjective.socialHistory = `Patient age: ${patientContext.age}`;
    }

    return enhanced;
  }

  /**
   * Suggest ICD-10 code based on diagnosis description
   * @param {string} diagnosis - Diagnosis description
   * @returns {string} Suggested ICD-10 code
   */
  suggestICD10Code(diagnosis) {
    const commonCodes = {
      'hypertension': 'I10',
      'diabetes': 'E11.9',
      'chest pain': 'R06.02',
      'headache': 'R51',
      'fever': 'R50.9',
      'cough': 'R05',
      'fatigue': 'R53.83',
      'nausea': 'R11.10',
      'dizziness': 'R42'
    };

    const lowerDiagnosis = diagnosis.toLowerCase();
    for (const [condition, code] of Object.entries(commonCodes)) {
      if (lowerDiagnosis.includes(condition)) {
        return code;
      }
    }

    return ''; // Return empty if no match found
  }
}

module.exports = new GeminiService();
