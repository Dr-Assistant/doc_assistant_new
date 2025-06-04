const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const { InternalServerError, ValidationError } = require('../middleware/errorHandler');

class GeminiService {
  constructor() {
    // Initialize Google Generative AI
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

    // Get the model
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro'
    });

    // Default generation configuration for pre-diagnosis summaries
    this.defaultConfig = {
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.2, // Lower temperature for medical accuracy
      topP: parseFloat(process.env.GEMINI_TOP_P) || 0.8,
      topK: parseInt(process.env.GEMINI_TOP_K) || 40,
      maxOutputTokens: parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 4096,
    };

    // Medical context for pre-diagnosis summaries
    this.medicalContext = {
      urgencyLevels: ['low', 'medium', 'high', 'urgent'],
      riskFactors: [
        'Age', 'Gender', 'Family History', 'Smoking', 'Alcohol Use', 'Obesity',
        'Hypertension', 'Diabetes', 'Heart Disease', 'Chronic Conditions'
      ],
      commonSymptoms: [
        'Chest Pain', 'Shortness of Breath', 'Fever', 'Cough', 'Headache',
        'Abdominal Pain', 'Nausea', 'Vomiting', 'Dizziness', 'Fatigue'
      ]
    };
  }

  /**
   * Generate pre-diagnosis summary from patient data
   * @param {Object} patientData - Comprehensive patient data
   * @param {Object} context - Additional context
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated pre-diagnosis summary
   */
  async generatePreDiagnosisSummary(patientData, context = {}, options = {}) {
    try {
      logger.info('Starting pre-diagnosis summary generation', {
        patientId: context.patientId,
        encounterId: context.encounterId,
        hasLocalData: patientData.sources?.local,
        hasAbdmData: patientData.sources?.abdm,
        hasQuestionnaire: patientData.sources?.questionnaire
      });

      const startTime = Date.now();

      // Build the prompt for pre-diagnosis summary
      const prompt = this.buildPreDiagnosisPrompt(patientData, context);

      // Generate content
      const config = { ...this.defaultConfig, ...options };
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: config
      });

      const response = await result.response;
      const generatedText = response.text();

      // Parse the generated summary
      const parsedSummary = this.parsePreDiagnosisSummary(generatedText);

      // Calculate processing metrics
      const processingTime = Date.now() - startTime;
      const tokenUsage = this.estimateTokenUsage(prompt, generatedText);

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(parsedSummary, patientData);

      logger.info('Pre-diagnosis summary generation completed', {
        processingTime,
        confidenceScore,
        urgencyLevel: parsedSummary.urgencyLevel,
        tokenUsage: tokenUsage.totalTokens
      });

      return {
        keyFindings: parsedSummary.keyFindings,
        riskFactors: parsedSummary.riskFactors,
        recommendations: parsedSummary.recommendations,
        urgencyLevel: parsedSummary.urgencyLevel,
        confidenceScore,
        generatedAt: new Date(),
        model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
        version: '1.0',
        processingTime,
        tokenUsage
      };

    } catch (error) {
      logger.error('Pre-diagnosis summary generation failed', {
        error: error.message,
        stack: error.stack,
        patientId: context.patientId
      });
      throw new InternalServerError('Failed to generate pre-diagnosis summary');
    }
  }

  /**
   * Build the prompt for pre-diagnosis summary generation
   * @param {Object} patientData - Patient data
   * @param {Object} context - Additional context
   * @returns {string} Formatted prompt
   */
  buildPreDiagnosisPrompt(patientData, context) {
    const { demographics = {}, medicalHistory = [], medications = [], allergies = [], questionnaire = {} } = patientData;

    return `You are an expert medical AI assistant specializing in pre-diagnosis patient summaries. Your task is to analyze comprehensive patient data and generate a concise, actionable pre-diagnosis summary for a doctor preparing for a patient consultation.

**PATIENT DEMOGRAPHICS:**
- Name: ${demographics.fullName || 'Not provided'}
- Age: ${demographics.age || 'Not provided'}
- Gender: ${demographics.gender || 'Not provided'}
- Blood Group: ${demographics.bloodGroup || 'Not provided'}

**MEDICAL HISTORY:**
${medicalHistory.length > 0 ? medicalHistory.map(h => 
  `- ${h.condition} (${h.status}, diagnosed: ${h.diagnosedDate || 'unknown'}, source: ${h.source})`
).join('\n') : 'No significant medical history recorded'}

**CURRENT MEDICATIONS:**
${medications.length > 0 ? medications.map(m => 
  `- ${m.name} ${m.dosage || ''} ${m.frequency || ''} (${m.status}, source: ${m.source})`
).join('\n') : 'No current medications recorded'}

**ALLERGIES:**
${allergies.length > 0 ? allergies.map(a => 
  `- ${a.allergen} (${a.type}, severity: ${a.severity}, reaction: ${a.reaction || 'not specified'})`
).join('\n') : 'No known allergies'}

**PATIENT QUESTIONNAIRE RESPONSES:**
${Object.keys(questionnaire).length > 0 ? Object.entries(questionnaire).map(([key, value]) => 
  `- ${key}: ${value}`
).join('\n') : 'No questionnaire data available'}

**VITAL SIGNS (if available):**
${patientData.vitalSigns ? `
- Blood Pressure: ${patientData.vitalSigns.bloodPressure?.systolic || 'N/A'}/${patientData.vitalSigns.bloodPressure?.diastolic || 'N/A'} mmHg
- Heart Rate: ${patientData.vitalSigns.heartRate?.value || 'N/A'} bpm
- Temperature: ${patientData.vitalSigns.temperature?.value || 'N/A'}°${patientData.vitalSigns.temperature?.unit || 'C'}
- Respiratory Rate: ${patientData.vitalSigns.respiratoryRate?.value || 'N/A'} breaths/min
- Oxygen Saturation: ${patientData.vitalSigns.oxygenSaturation?.value || 'N/A'}%
- BMI: ${patientData.vitalSigns.bmi || 'N/A'}
` : 'No recent vital signs available'}

**DATA SOURCES:**
- Local Records: ${patientData.sources?.local ? 'Available' : 'Not available'}
- ABDM Records: ${patientData.sources?.abdm ? 'Available' : 'Not available'}
- Patient Questionnaire: ${patientData.sources?.questionnaire ? 'Completed' : 'Not completed'}

**INSTRUCTIONS:**
1. Analyze all available patient data comprehensively
2. Identify key medical findings that require attention
3. Assess risk factors based on demographics, history, and current conditions
4. Determine urgency level for the consultation
5. Provide actionable recommendations for the doctor
6. Highlight any critical allergies or drug interactions
7. Note any gaps in information that should be addressed

**OUTPUT FORMAT:**
Please structure your response as a JSON object with the following format:

\`\`\`json
{
  "keyFindings": [
    "Most important medical findings from patient data",
    "Significant symptoms or conditions requiring attention",
    "Notable changes from previous visits (if applicable)"
  ],
  "riskFactors": [
    "Age-related risks",
    "Chronic condition complications",
    "Drug interaction risks",
    "Family history concerns",
    "Lifestyle risk factors"
  ],
  "recommendations": [
    "Specific areas to focus on during consultation",
    "Tests or assessments to consider",
    "Medication review recommendations",
    "Follow-up care suggestions",
    "Patient education priorities"
  ],
  "urgencyLevel": "low|medium|high|urgent",
  "criticalAlerts": [
    "Severe allergies to highlight",
    "Drug interaction warnings",
    "Urgent symptoms requiring immediate attention"
  ],
  "informationGaps": [
    "Missing vital information",
    "Incomplete medical history areas",
    "Additional data needed for assessment"
  ],
  "patientSummary": "Brief 2-3 sentence summary of the patient's current status and primary concerns"
}
\`\`\`

**URGENCY LEVEL GUIDELINES:**
- **Low**: Routine follow-up, stable chronic conditions, preventive care
- **Medium**: New symptoms, medication adjustments, minor acute conditions
- **High**: Concerning symptoms, unstable chronic conditions, potential complications
- **Urgent**: Severe symptoms, critical values, immediate intervention needed

Please analyze this patient data and generate a comprehensive pre-diagnosis summary that will help the doctor prepare for an effective consultation.`;
  }

  /**
   * Parse the generated pre-diagnosis summary
   * @param {string} generatedText - Raw response from Gemini
   * @returns {Object} Parsed summary
   */
  parsePreDiagnosisSummary(generatedText) {
    try {
      // Extract JSON from the response
      const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) ||
                       generatedText.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, generatedText];

      const jsonString = jsonMatch[1] || generatedText;
      const parsed = JSON.parse(jsonString.trim());

      // Validate and normalize the structure
      return this.validateAndNormalizeSummary(parsed);
    } catch (error) {
      logger.error('Failed to parse pre-diagnosis summary JSON', {
        error: error.message,
        generatedText: generatedText.substring(0, 500)
      });

      // Fallback: try to extract information using regex patterns
      return this.extractSummaryWithRegex(generatedText);
    }
  }

  /**
   * Validate and normalize summary structure
   * @param {Object} summary - Parsed summary
   * @returns {Object} Validated summary
   */
  validateAndNormalizeSummary(summary) {
    return {
      keyFindings: Array.isArray(summary.keyFindings) ? summary.keyFindings : [],
      riskFactors: Array.isArray(summary.riskFactors) ? summary.riskFactors : [],
      recommendations: Array.isArray(summary.recommendations) ? summary.recommendations : [],
      urgencyLevel: this.validateUrgencyLevel(summary.urgencyLevel),
      criticalAlerts: Array.isArray(summary.criticalAlerts) ? summary.criticalAlerts : [],
      informationGaps: Array.isArray(summary.informationGaps) ? summary.informationGaps : [],
      patientSummary: summary.patientSummary || 'Patient summary not available'
    };
  }

  /**
   * Validate urgency level
   * @param {string} urgencyLevel - Urgency level from AI
   * @returns {string} Valid urgency level
   */
  validateUrgencyLevel(urgencyLevel) {
    const validLevels = ['low', 'medium', 'high', 'urgent'];
    return validLevels.includes(urgencyLevel) ? urgencyLevel : 'medium';
  }

  /**
   * Extract summary using regex patterns (fallback method)
   * @param {string} text - Generated text
   * @returns {Object} Extracted summary
   */
  extractSummaryWithRegex(text) {
    logger.warn('Using regex fallback for summary extraction');

    return {
      keyFindings: this.extractListItems(text, /key findings?[:\s]*([\s\S]*?)(?=risk factors?|recommendations?|$)/i),
      riskFactors: this.extractListItems(text, /risk factors?[:\s]*([\s\S]*?)(?=recommendations?|urgency|$)/i),
      recommendations: this.extractListItems(text, /recommendations?[:\s]*([\s\S]*?)(?=urgency|critical|$)/i),
      urgencyLevel: this.extractUrgencyLevel(text),
      criticalAlerts: [],
      informationGaps: [],
      patientSummary: 'Summary extracted from unstructured text'
    };
  }

  /**
   * Extract list items from text
   * @param {string} text - Text to search
   * @param {RegExp} pattern - Regex pattern
   * @returns {Array} Extracted items
   */
  extractListItems(text, pattern) {
    const match = text.match(pattern);
    if (!match) return [];

    const section = match[1];
    return section
      .split(/[-•*]\s+/)
      .filter(item => item.trim().length > 0)
      .map(item => item.trim().replace(/\n/g, ' '))
      .slice(0, 5); // Limit to 5 items
  }

  /**
   * Extract urgency level from text
   * @param {string} text - Text to search
   * @returns {string} Urgency level
   */
  extractUrgencyLevel(text) {
    const urgencyMatch = text.match(/urgency[:\s]*(low|medium|high|urgent)/i);
    return urgencyMatch ? urgencyMatch[1].toLowerCase() : 'medium';
  }

  /**
   * Calculate confidence score for generated summary
   * @param {Object} summary - Generated summary
   * @param {Object} patientData - Original patient data
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidenceScore(summary, patientData) {
    let score = 0;
    let factors = 0;

    // Check data availability
    if (patientData.sources?.local) { score += 0.3; factors++; }
    if (patientData.sources?.abdm) { score += 0.2; factors++; }
    if (patientData.sources?.questionnaire) { score += 0.2; factors++; }

    // Check summary completeness
    if (summary.keyFindings?.length > 0) { score += 0.1; factors++; }
    if (summary.riskFactors?.length > 0) { score += 0.1; factors++; }
    if (summary.recommendations?.length > 0) { score += 0.1; factors++; }

    return factors > 0 ? Math.min(score / factors, 1) : 0.5;
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
}

module.exports = new GeminiService();
