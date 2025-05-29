const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const { medications, drugInteractions, prescriptionPatterns, frequencyMappings } = require('../data/medications');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro'
    });
    this.medicationNames = Object.keys(medications);
  }

  /**
   * Generate prescription from transcription or clinical note
   * @param {string} text - Input text (transcription or clinical note)
   * @param {Object} context - Additional context
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated prescription data
   */
  async generatePrescription(text, context = {}, options = {}) {
    try {
      const startTime = Date.now();

      // Build comprehensive prompt
      const prompt = this.buildPrescriptionPrompt(text, context);

      // Configure generation parameters
      const generationConfig = {
        temperature: options.temperature || parseFloat(process.env.GEMINI_TEMPERATURE) || 0.2,
        topP: options.topP || parseFloat(process.env.GEMINI_TOP_P) || 0.8,
        topK: options.topK || parseInt(process.env.GEMINI_TOP_K) || 40,
        maxOutputTokens: options.maxOutputTokens || parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 4096
      };

      logger.info('Generating prescription with Gemini', {
        textLength: text.length,
        context: Object.keys(context),
        config: generationConfig
      });

      // Generate content
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig
      });

      const response = result.response;
      const generatedText = response.text();

      // Parse prescription data
      const prescriptionData = this.parsePrescriptionData(generatedText);

      // Enhance with medication database information
      const enhancedPrescription = this.enhancePrescriptionData(prescriptionData, context);

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(enhancedPrescription, text);

      // Assess quality
      const qualityMetrics = this.assessQuality(enhancedPrescription);

      // Estimate token usage
      const tokenUsage = this.estimateTokenUsage(prompt, generatedText);

      const processingTime = Date.now() - startTime;

      logger.info('Prescription generation completed', {
        medicationsExtracted: enhancedPrescription.medications.length,
        confidenceScore,
        processingTime,
        tokenUsage
      });

      return {
        prescription: enhancedPrescription,
        metadata: {
          model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
          version: '1.0',
          confidenceScore,
          processingTime,
          tokenUsage,
          qualityMetrics,
          generationConfig
        },
        rawResponse: generatedText
      };
    } catch (error) {
      logger.error('Prescription generation failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Build comprehensive prescription generation prompt
   * @param {string} text - Input text
   * @param {Object} context - Additional context
   * @returns {string} Generated prompt
   */
  buildPrescriptionPrompt(text, context) {
    const patientInfo = context.patientInfo || {};
    const encounterInfo = context.encounterInfo || {};
    const clinicalNote = context.clinicalNote || {};

    return `You are an expert clinical pharmacist and AI assistant specializing in prescription generation from medical documentation. Your task is to extract and structure prescription information from the provided text.

**CONTEXT INFORMATION:**
- Patient Age: ${patientInfo.age || 'Not specified'}
- Patient Gender: ${patientInfo.gender || 'Not specified'}
- Patient Weight: ${patientInfo.weight || 'Not specified'}
- Known Allergies: ${patientInfo.allergies?.join(', ') || 'None specified'}
- Current Medications: ${patientInfo.currentMedications?.join(', ') || 'None specified'}
- Encounter Type: ${encounterInfo.type || 'Not specified'}
- Specialty: ${context.specialty || 'General Medicine'}

**MEDICAL TEXT TO ANALYZE:**
${text}

**INSTRUCTIONS:**
1. Extract ALL medications mentioned in the text that are being prescribed (not just mentioned as current medications)
2. For each medication, identify:
   - Medication name (generic preferred, but include brand if mentioned)
   - Dosage (amount and unit)
   - Frequency (how often to take)
   - Duration (how long to take)
   - Route of administration
   - Special instructions
   - Indication (what it's for)

3. Use standard medical abbreviations where appropriate:
   - qd (once daily), bid (twice daily), tid (three times daily), qid (four times daily)
   - prn (as needed), ac (before meals), pc (after meals), qhs (at bedtime)

4. Consider patient-specific factors:
   - Age-appropriate dosing
   - Weight-based dosing if applicable
   - Allergy considerations
   - Drug interactions with current medications

**COMMON MEDICATIONS DATABASE:**
${this.medicationNames.slice(0, 20).join(', ')}... (and many more)

**OUTPUT FORMAT:**
Provide your response as a JSON object with the following structure:

\`\`\`json
{
  "medications": [
    {
      "medicationName": "medication name",
      "genericName": "generic name if different",
      "brandName": "brand name if mentioned",
      "dosage": {
        "amount": number,
        "unit": "mg|mcg|g|ml|units|puffs|drops|tablets|capsules"
      },
      "frequency": {
        "times": number,
        "period": "daily|weekly|monthly|as needed",
        "abbreviation": "qd|bid|tid|qid|prn|etc"
      },
      "duration": {
        "amount": number,
        "unit": "days|weeks|months|ongoing"
      },
      "route": "oral|topical|injection|inhalation|etc",
      "instructions": "special instructions",
      "indication": "what condition this treats",
      "category": "cardiovascular|endocrine|antibiotic|analgesic|etc",
      "confidenceScore": 0.0-1.0
    }
  ],
  "extractionNotes": "Any important notes about the extraction process",
  "clinicalContext": "Relevant clinical context that influenced prescribing"
}
\`\`\`

**IMPORTANT GUIDELINES:**
- Only extract medications that are being newly prescribed or modified
- If dosage is unclear, indicate in instructions
- If frequency is vague (e.g., "as needed"), use "prn"
- Include confidence score based on clarity of information
- Be conservative with dosages - prefer lower doses if range is given
- Flag any potential safety concerns in instructions

**SAFETY CONSIDERATIONS:**
- Check for age-inappropriate medications
- Consider drug-drug interactions
- Note any allergy conflicts
- Flag high-risk medications or dosages

Please analyze the text and extract prescription information following these guidelines.`;
  }

  /**
   * Parse prescription data from Gemini response
   * @param {string} response - Raw response from Gemini
   * @returns {Object} Parsed prescription data
   */
  parsePrescriptionData(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const parsed = JSON.parse(jsonStr);
        return this.validateAndNormalizePrescription(parsed);
      }

      // Fallback: try to parse as direct JSON
      try {
        const parsed = JSON.parse(response);
        return this.validateAndNormalizePrescription(parsed);
      } catch (e) {
        // Fallback: use regex extraction
        return this.extractPrescriptionWithRegex(response);
      }
    } catch (error) {
      logger.warn('Failed to parse prescription JSON, using regex fallback', {
        error: error.message
      });
      return this.extractPrescriptionWithRegex(response);
    }
  }

  /**
   * Extract prescription data using regex patterns
   * @param {string} text - Text to extract from
   * @returns {Object} Extracted prescription data
   */
  extractPrescriptionWithRegex(text) {
    const medications = [];

    // Try each prescription pattern
    prescriptionPatterns.forEach(pattern => {
      const matches = text.matchAll(new RegExp(pattern.pattern, 'gi'));
      for (const match of matches) {
        const medication = this.buildMedicationFromMatch(match, pattern.groups);
        if (medication) {
          medications.push(medication);
        }
      }
    });

    return {
      medications,
      extractionNotes: 'Extracted using regex patterns due to JSON parsing failure',
      clinicalContext: 'Limited context available from regex extraction'
    };
  }

  /**
   * Build medication object from regex match
   * @param {Array} match - Regex match array
   * @param {Array} groups - Group names
   * @returns {Object} Medication object
   */
  buildMedicationFromMatch(match, groups) {
    const medication = {
      medicationName: '',
      dosage: { amount: 0, unit: 'mg' },
      frequency: { times: 1, period: 'daily', abbreviation: 'qd' },
      route: 'oral',
      instructions: '',
      indication: '',
      confidenceScore: 0.6
    };

    groups.forEach((group, index) => {
      const value = match[index + 1];
      if (!value) return;

      switch (group) {
        case 'medication':
          medication.medicationName = value.toLowerCase();
          break;
        case 'dose':
          medication.dosage.amount = parseFloat(value);
          break;
        case 'unit':
          medication.dosage.unit = value.toLowerCase();
          break;
        case 'frequency_count':
          const count = this.parseFrequencyCount(value);
          medication.frequency.times = count;
          medication.frequency.abbreviation = this.getFrequencyAbbreviation(count);
          break;
        case 'frequency_abbrev':
          medication.frequency.abbreviation = value.toLowerCase();
          medication.frequency.times = this.getTimesFromAbbreviation(value);
          break;
        case 'interval':
          const hours = parseInt(value);
          medication.frequency.times = Math.round(24 / hours);
          medication.frequency.abbreviation = `q${hours}h`;
          break;
        case 'prn':
          medication.frequency.abbreviation = 'prn';
          medication.frequency.period = 'as needed';
          break;
      }
    });

    return medication.medicationName ? medication : null;
  }

  /**
   * Validate and normalize prescription data
   * @param {Object} prescription - Raw prescription data
   * @returns {Object} Normalized prescription data
   */
  validateAndNormalizePrescription(prescription) {
    const normalized = {
      medications: [],
      extractionNotes: prescription.extractionNotes || '',
      clinicalContext: prescription.clinicalContext || ''
    };

    if (prescription.medications && Array.isArray(prescription.medications)) {
      prescription.medications.forEach(med => {
        const normalizedMed = {
          medicationName: med.medicationName || '',
          genericName: med.genericName || '',
          brandName: med.brandName || '',
          dosage: {
            amount: parseFloat(med.dosage?.amount) || 0,
            unit: med.dosage?.unit || 'mg'
          },
          frequency: {
            times: parseInt(med.frequency?.times) || 1,
            period: med.frequency?.period || 'daily',
            abbreviation: med.frequency?.abbreviation || 'qd'
          },
          duration: {
            amount: parseInt(med.duration?.amount) || null,
            unit: med.duration?.unit || 'days'
          },
          route: med.route || 'oral',
          instructions: med.instructions || '',
          indication: med.indication || '',
          category: med.category || 'other',
          confidenceScore: parseFloat(med.confidenceScore) || 0.5
        };

        if (normalizedMed.medicationName) {
          normalized.medications.push(normalizedMed);
        }
      });
    }

    return normalized;
  }

  /**
   * Enhance prescription data with medication database information
   * @param {Object} prescription - Base prescription data
   * @param {Object} context - Additional context
   * @returns {Object} Enhanced prescription data
   */
  enhancePrescriptionData(prescription, context) {
    const enhanced = { ...prescription };

    enhanced.medications = prescription.medications.map(med => {
      const enhancedMed = { ...med };

      // Find medication in database
      const dbMed = this.findMedicationInDatabase(med.medicationName);
      if (dbMed) {
        enhancedMed.genericName = enhancedMed.genericName || dbMed.genericName;
        enhancedMed.brandName = enhancedMed.brandName || dbMed.brandNames?.[0];
        enhancedMed.category = enhancedMed.category || dbMed.category;
        enhancedMed.drugClass = dbMed.class;
        enhancedMed.indication = enhancedMed.indication || dbMed.indications?.[0];

        // Validate dosage against common dosages
        if (dbMed.commonDosages) {
          const dosageStr = `${enhancedMed.dosage.amount}${enhancedMed.dosage.unit}`;
          if (!dbMed.commonDosages.includes(dosageStr)) {
            enhancedMed.dosageAlert = `Unusual dosage: ${dosageStr}. Common dosages: ${dbMed.commonDosages.join(', ')}`;
          }
        }
      }

      return enhancedMed;
    });

    return enhanced;
  }

  /**
   * Find medication in database
   * @param {string} medicationName - Medication name to search
   * @returns {Object|null} Medication data or null
   */
  findMedicationInDatabase(medicationName) {
    const name = medicationName.toLowerCase();

    // Direct match
    if (medications[name]) {
      return medications[name];
    }

    // Search by brand names
    for (const [key, med] of Object.entries(medications)) {
      if (med.brandNames && med.brandNames.some(brand =>
        brand.toLowerCase() === name
      )) {
        return med;
      }
    }

    // Partial match
    for (const [key, med] of Object.entries(medications)) {
      if (key.includes(name) || name.includes(key)) {
        return med;
      }
    }

    return null;
  }

  /**
   * Calculate confidence score for prescription
   * @param {Object} prescription - Prescription data
   * @param {string} originalText - Original text
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidenceScore(prescription, originalText) {
    if (!prescription.medications || prescription.medications.length === 0) {
      return 0;
    }

    let totalScore = 0;
    let medicationCount = 0;

    prescription.medications.forEach(med => {
      let score = 0;

      // Base score from individual medication confidence
      score += (med.confidenceScore || 0.5) * 0.3;

      // Medication name recognition
      if (this.findMedicationInDatabase(med.medicationName)) {
        score += 0.2;
      }

      // Dosage completeness
      if (med.dosage && med.dosage.amount > 0 && med.dosage.unit) {
        score += 0.2;
      }

      // Frequency completeness
      if (med.frequency && med.frequency.times > 0 && med.frequency.period) {
        score += 0.15;
      }

      // Instructions presence
      if (med.instructions && med.instructions.length > 0) {
        score += 0.1;
      }

      // Indication presence
      if (med.indication && med.indication.length > 0) {
        score += 0.05;
      }

      totalScore += Math.min(score, 1);
      medicationCount++;
    });

    return medicationCount > 0 ? totalScore / medicationCount : 0;
  }

  /**
   * Assess quality of prescription
   * @param {Object} prescription - Prescription data
   * @returns {Object} Quality metrics
   */
  assessQuality(prescription) {
    const metrics = {
      completeness: 0,
      accuracy: 0,
      clarity: 0,
      safety: 0,
      overall: 0
    };

    if (!prescription.medications || prescription.medications.length === 0) {
      return metrics;
    }

    let completenessSum = 0;
    let accuracySum = 0;
    let claritySum = 0;
    let safetySum = 0;

    prescription.medications.forEach(med => {
      // Completeness: all required fields present
      let completeness = 0;
      if (med.medicationName) completeness += 0.3;
      if (med.dosage && med.dosage.amount > 0) completeness += 0.25;
      if (med.frequency && med.frequency.times > 0) completeness += 0.25;
      if (med.route) completeness += 0.1;
      if (med.instructions) completeness += 0.1;

      // Accuracy: medication exists in database
      let accuracy = 0.5; // Base score
      if (this.findMedicationInDatabase(med.medicationName)) {
        accuracy = 0.9;
      }

      // Clarity: clear instructions and dosing
      let clarity = 0.5; // Base score
      if (med.instructions && med.instructions.length > 10) clarity += 0.2;
      if (med.indication) clarity += 0.2;
      if (med.frequency.abbreviation !== 'prn') clarity += 0.1;

      // Safety: reasonable dosages and no obvious issues
      let safety = 0.8; // Base score (assume safe unless flagged)
      if (med.dosageAlert) safety -= 0.3;
      if (med.dosage.amount > 1000 && med.dosage.unit === 'mg') safety -= 0.2;

      completenessSum += completeness;
      accuracySum += accuracy;
      claritySum += clarity;
      safetySum += safety;
    });

    const count = prescription.medications.length;
    metrics.completeness = completenessSum / count;
    metrics.accuracy = accuracySum / count;
    metrics.clarity = claritySum / count;
    metrics.safety = safetySum / count;
    metrics.overall = (metrics.completeness + metrics.accuracy + metrics.clarity + metrics.safety) / 4;

    return metrics;
  }

  /**
   * Helper methods for frequency parsing
   */
  parseFrequencyCount(text) {
    const map = { 'once': 1, 'twice': 2, 'three': 3, 'four': 4 };
    return map[text.toLowerCase()] || parseInt(text) || 1;
  }

  getFrequencyAbbreviation(times) {
    const map = { 1: 'qd', 2: 'bid', 3: 'tid', 4: 'qid' };
    return map[times] || 'qd';
  }

  getTimesFromAbbreviation(abbrev) {
    const map = { 'qd': 1, 'bid': 2, 'tid': 3, 'qid': 4 };
    return map[abbrev.toLowerCase()] || 1;
  }

  /**
   * Estimate token usage
   * @param {string} prompt - Input prompt
   * @param {string} response - Generated response
   * @returns {Object} Token usage estimate
   */
  estimateTokenUsage(prompt, response) {
    // Rough estimation: 1 token ≈ 4 characters
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(response.length / 4);

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens
    };
  }

  /**
   * Check for drug interactions
   * @param {Array} medications - List of medications
   * @returns {Array} Drug interactions found
   */
  checkDrugInteractions(medications) {
    const interactions = [];

    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const med1 = medications[i].medicationName.toLowerCase();
        const med2 = medications[j].medicationName.toLowerCase();

        // Check both directions
        const interaction = drugInteractions[med1]?.[med2] || drugInteractions[med2]?.[med1];

        if (interaction) {
          interactions.push({
            medication1: medications[i].medicationName,
            medication2: medications[j].medicationName,
            severity: interaction.severity,
            description: interaction.description,
            recommendation: interaction.recommendation || 'Monitor closely'
          });
        }
      }
    }

    return interactions;
  }

  /**
   * Validate dosages against guidelines
   * @param {Array} medications - List of medications
   * @param {Object} patientInfo - Patient information
   * @returns {Array} Dosage alerts
   */
  validateDosages(medications, patientInfo = {}) {
    const alerts = [];

    medications.forEach(med => {
      const dbMed = this.findMedicationInDatabase(med.medicationName);
      if (!dbMed) return;

      // Check maximum daily dose
      if (dbMed.maxDailyDose) {
        const dailyDose = this.calculateDailyDose(med);
        const maxDose = parseFloat(dbMed.maxDailyDose.replace(/[^\d.]/g, ''));

        if (dailyDose > maxDose) {
          alerts.push({
            medication: med.medicationName,
            alertType: 'overdose',
            description: `Daily dose (${dailyDose}${med.dosage.unit}) exceeds maximum (${dbMed.maxDailyDose})`,
            recommendation: `Consider reducing dose to maximum ${dbMed.maxDailyDose}`
          });
        }
      }

      // Age-specific checks
      if (patientInfo.age) {
        if (patientInfo.age >= 65 && dbMed.category === 'psychiatric') {
          alerts.push({
            medication: med.medicationName,
            alertType: 'age-inappropriate',
            description: 'Consider dose reduction in elderly patients',
            recommendation: 'Start with lower dose and titrate slowly'
          });
        }

        if (patientInfo.age < 18 && !dbMed.pediatricDosing) {
          alerts.push({
            medication: med.medicationName,
            alertType: 'age-inappropriate',
            description: 'Pediatric dosing not established',
            recommendation: 'Verify pediatric dosing guidelines'
          });
        }
      }
    });

    return alerts;
  }

  /**
   * Calculate daily dose for a medication
   * @param {Object} medication - Medication object
   * @returns {number} Daily dose amount
   */
  calculateDailyDose(medication) {
    const { dosage, frequency } = medication;
    let timesPerDay = frequency.times;

    if (frequency.period === 'weekly') {
      timesPerDay = frequency.times / 7;
    } else if (frequency.period === 'monthly') {
      timesPerDay = frequency.times / 30;
    }

    return dosage.amount * timesPerDay;
  }
}

module.exports = new GeminiService();
