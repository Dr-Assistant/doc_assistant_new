/**
 * Comprehensive Medications Database
 * Contains common medications, dosages, interactions, and guidelines
 */

const medications = {
  // Cardiovascular Medications
  'metoprolol': {
    genericName: 'metoprolol',
    brandNames: ['Lopressor', 'Toprol-XL'],
    category: 'cardiovascular',
    class: 'beta-blocker',
    commonDosages: ['25mg', '50mg', '100mg', '200mg'],
    frequencies: ['once daily', 'twice daily'],
    routes: ['oral'],
    indications: ['hypertension', 'angina', 'heart failure', 'myocardial infarction'],
    contraindications: ['severe bradycardia', 'heart block', 'cardiogenic shock'],
    sideEffects: ['fatigue', 'dizziness', 'bradycardia', 'hypotension'],
    maxDailyDose: '400mg',
    renalAdjustment: true,
    hepaticAdjustment: false
  },
  'lisinopril': {
    genericName: 'lisinopril',
    brandNames: ['Prinivil', 'Zestril'],
    category: 'cardiovascular',
    class: 'ACE inhibitor',
    commonDosages: ['2.5mg', '5mg', '10mg', '20mg', '40mg'],
    frequencies: ['once daily', 'twice daily'],
    routes: ['oral'],
    indications: ['hypertension', 'heart failure', 'post-MI'],
    contraindications: ['pregnancy', 'angioedema', 'bilateral renal artery stenosis'],
    sideEffects: ['dry cough', 'hyperkalemia', 'angioedema', 'hypotension'],
    maxDailyDose: '80mg',
    renalAdjustment: true,
    hepaticAdjustment: false
  },
  'amlodipine': {
    genericName: 'amlodipine',
    brandNames: ['Norvasc'],
    category: 'cardiovascular',
    class: 'calcium channel blocker',
    commonDosages: ['2.5mg', '5mg', '10mg'],
    frequencies: ['once daily'],
    routes: ['oral'],
    indications: ['hypertension', 'angina'],
    contraindications: ['severe aortic stenosis'],
    sideEffects: ['peripheral edema', 'flushing', 'dizziness', 'fatigue'],
    maxDailyDose: '10mg',
    renalAdjustment: false,
    hepaticAdjustment: true
  },

  // Diabetes Medications
  'metformin': {
    genericName: 'metformin',
    brandNames: ['Glucophage', 'Fortamet'],
    category: 'endocrine',
    class: 'biguanide',
    commonDosages: ['500mg', '850mg', '1000mg'],
    frequencies: ['once daily', 'twice daily', 'three times daily'],
    routes: ['oral'],
    indications: ['type 2 diabetes', 'prediabetes', 'PCOS'],
    contraindications: ['severe renal impairment', 'metabolic acidosis', 'severe heart failure'],
    sideEffects: ['nausea', 'diarrhea', 'metallic taste', 'vitamin B12 deficiency'],
    maxDailyDose: '2550mg',
    renalAdjustment: true,
    hepaticAdjustment: false
  },
  'glipizide': {
    genericName: 'glipizide',
    brandNames: ['Glucotrol'],
    category: 'endocrine',
    class: 'sulfonylurea',
    commonDosages: ['2.5mg', '5mg', '10mg'],
    frequencies: ['once daily', 'twice daily'],
    routes: ['oral'],
    indications: ['type 2 diabetes'],
    contraindications: ['type 1 diabetes', 'diabetic ketoacidosis', 'severe renal impairment'],
    sideEffects: ['hypoglycemia', 'weight gain', 'nausea'],
    maxDailyDose: '40mg',
    renalAdjustment: true,
    hepaticAdjustment: true
  },

  // Antibiotics
  'amoxicillin': {
    genericName: 'amoxicillin',
    brandNames: ['Amoxil', 'Trimox'],
    category: 'antibiotic',
    class: 'penicillin',
    commonDosages: ['250mg', '500mg', '875mg'],
    frequencies: ['twice daily', 'three times daily'],
    routes: ['oral'],
    indications: ['bacterial infections', 'pneumonia', 'UTI', 'skin infections'],
    contraindications: ['penicillin allergy'],
    sideEffects: ['nausea', 'diarrhea', 'rash', 'allergic reactions'],
    maxDailyDose: '3000mg',
    renalAdjustment: true,
    hepaticAdjustment: false
  },
  'azithromycin': {
    genericName: 'azithromycin',
    brandNames: ['Zithromax', 'Z-Pak'],
    category: 'antibiotic',
    class: 'macrolide',
    commonDosages: ['250mg', '500mg'],
    frequencies: ['once daily'],
    routes: ['oral', 'IV'],
    indications: ['respiratory infections', 'skin infections', 'STDs'],
    contraindications: ['macrolide allergy', 'severe hepatic impairment'],
    sideEffects: ['nausea', 'diarrhea', 'QT prolongation'],
    maxDailyDose: '500mg',
    renalAdjustment: false,
    hepaticAdjustment: true
  },

  // Pain Management
  'ibuprofen': {
    genericName: 'ibuprofen',
    brandNames: ['Advil', 'Motrin'],
    category: 'analgesic',
    class: 'NSAID',
    commonDosages: ['200mg', '400mg', '600mg', '800mg'],
    frequencies: ['every 6 hours', 'every 8 hours', 'twice daily', 'three times daily'],
    routes: ['oral'],
    indications: ['pain', 'inflammation', 'fever'],
    contraindications: ['peptic ulcer', 'severe renal impairment', 'severe heart failure'],
    sideEffects: ['GI upset', 'renal impairment', 'cardiovascular risk'],
    maxDailyDose: '3200mg',
    renalAdjustment: true,
    hepaticAdjustment: true
  },
  'acetaminophen': {
    genericName: 'acetaminophen',
    brandNames: ['Tylenol'],
    category: 'analgesic',
    class: 'analgesic/antipyretic',
    commonDosages: ['325mg', '500mg', '650mg'],
    frequencies: ['every 4 hours', 'every 6 hours', 'four times daily'],
    routes: ['oral', 'IV', 'rectal'],
    indications: ['pain', 'fever'],
    contraindications: ['severe hepatic impairment'],
    sideEffects: ['hepatotoxicity (overdose)', 'rare allergic reactions'],
    maxDailyDose: '4000mg',
    renalAdjustment: false,
    hepaticAdjustment: true
  },

  // Respiratory
  'albuterol': {
    genericName: 'albuterol',
    brandNames: ['ProAir', 'Ventolin'],
    category: 'respiratory',
    class: 'beta2-agonist',
    commonDosages: ['90mcg/puff', '2.5mg/3ml'],
    frequencies: ['as needed', 'every 4-6 hours'],
    routes: ['inhalation', 'nebulizer'],
    indications: ['asthma', 'COPD', 'bronchospasm'],
    contraindications: ['hypersensitivity to albuterol'],
    sideEffects: ['tremor', 'tachycardia', 'nervousness'],
    maxDailyDose: '8 puffs',
    renalAdjustment: false,
    hepaticAdjustment: false
  },

  // Psychiatric
  'sertraline': {
    genericName: 'sertraline',
    brandNames: ['Zoloft'],
    category: 'psychiatric',
    class: 'SSRI',
    commonDosages: ['25mg', '50mg', '100mg'],
    frequencies: ['once daily'],
    routes: ['oral'],
    indications: ['depression', 'anxiety', 'PTSD', 'OCD'],
    contraindications: ['MAOI use', 'pimozide use'],
    sideEffects: ['nausea', 'sexual dysfunction', 'insomnia', 'weight changes'],
    maxDailyDose: '200mg',
    renalAdjustment: false,
    hepaticAdjustment: true
  }
};

// Drug Interactions Matrix
const drugInteractions = {
  'metoprolol': {
    'verapamil': { severity: 'major', description: 'Increased risk of bradycardia and heart block' },
    'insulin': { severity: 'moderate', description: 'May mask hypoglycemia symptoms' },
    'epinephrine': { severity: 'moderate', description: 'Reduced effectiveness of epinephrine' }
  },
  'lisinopril': {
    'potassium': { severity: 'major', description: 'Increased risk of hyperkalemia' },
    'lithium': { severity: 'major', description: 'Increased lithium levels' },
    'ibuprofen': { severity: 'moderate', description: 'Reduced antihypertensive effect' }
  },
  'metformin': {
    'contrast_dye': { severity: 'major', description: 'Increased risk of lactic acidosis' },
    'alcohol': { severity: 'moderate', description: 'Increased risk of lactic acidosis' }
  },
  'amoxicillin': {
    'warfarin': { severity: 'moderate', description: 'Increased anticoagulant effect' },
    'methotrexate': { severity: 'moderate', description: 'Increased methotrexate toxicity' }
  },
  'ibuprofen': {
    'warfarin': { severity: 'major', description: 'Increased bleeding risk' },
    'lisinopril': { severity: 'moderate', description: 'Reduced antihypertensive effect' },
    'methotrexate': { severity: 'major', description: 'Increased methotrexate toxicity' }
  },
  'sertraline': {
    'warfarin': { severity: 'major', description: 'Increased bleeding risk' },
    'tramadol': { severity: 'major', description: 'Increased risk of serotonin syndrome' },
    'aspirin': { severity: 'moderate', description: 'Increased bleeding risk' }
  }
};

// Dosage Guidelines by Age and Weight
const dosageGuidelines = {
  pediatric: {
    ageRanges: {
      'infant': { min: 0, max: 2 },
      'toddler': { min: 2, max: 5 },
      'child': { min: 5, max: 12 },
      'adolescent': { min: 12, max: 18 }
    },
    weightBasedDosing: {
      'acetaminophen': '10-15mg/kg every 4-6 hours',
      'ibuprofen': '5-10mg/kg every 6-8 hours',
      'amoxicillin': '20-40mg/kg/day divided every 8 hours'
    }
  },
  geriatric: {
    ageThreshold: 65,
    adjustmentFactors: {
      'metoprolol': 0.5,
      'lisinopril': 0.5,
      'sertraline': 0.5
    },
    avoidMedications: ['glipizide', 'high-dose ibuprofen']
  }
};

// Common Prescription Patterns
const prescriptionPatterns = [
  {
    pattern: /(\w+)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g)\s+(once|twice|three times|four times)\s+(daily|a day)/i,
    groups: ['medication', 'dose', 'unit', 'frequency_count', 'frequency_period']
  },
  {
    pattern: /(\w+)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g)\s+every\s+(\d+)\s+(hours|hrs)/i,
    groups: ['medication', 'dose', 'unit', 'interval', 'interval_unit']
  },
  {
    pattern: /(\w+)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g)\s+(bid|tid|qid|qd)/i,
    groups: ['medication', 'dose', 'unit', 'frequency_abbrev']
  },
  {
    pattern: /(\w+)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g)\s+as\s+needed/i,
    groups: ['medication', 'dose', 'unit', 'prn']
  }
];

// Frequency Mappings
const frequencyMappings = {
  'once daily': 'qd',
  'twice daily': 'bid',
  'three times daily': 'tid',
  'four times daily': 'qid',
  'every 4 hours': 'q4h',
  'every 6 hours': 'q6h',
  'every 8 hours': 'q8h',
  'every 12 hours': 'q12h',
  'as needed': 'prn',
  'at bedtime': 'qhs',
  'before meals': 'ac',
  'after meals': 'pc'
};

module.exports = {
  medications,
  drugInteractions,
  dosageGuidelines,
  prescriptionPatterns,
  frequencyMappings
};
