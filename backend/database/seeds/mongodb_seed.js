/**
 * MongoDB Seed Data
 * This script seeds the MongoDB database with initial data
 */

module.exports = async function(db) {
  // Seed clinical notes
  const clinicalNotes = [
    {
      encounterId: '11111111-eeee-eeee-eeee-eeeeeeeeeeee',
      patientId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      doctorId: '22222222-2222-2222-2222-222222222222',
      status: 'signed',
      noteType: 'soap',
      content: {
        subjective: {
          chiefComplaint: 'Chest pain',
          historyOfPresentIllness: 'Patient reports chest pain for the past 2 days. Pain is described as pressure-like, located in the center of the chest, non-radiating, and rated 5/10 in intensity. Pain is worse with exertion and relieved with rest. No associated shortness of breath, nausea, or diaphoresis.',
          reviewOfSystems: {
            constitutional: 'No fever, chills, or weight loss',
            cardiovascular: 'Chest pain as described above, no palpitations',
            respiratory: 'No shortness of breath, cough, or wheezing',
            gastrointestinal: 'No nausea, vomiting, or abdominal pain'
          },
          pastMedicalHistory: 'Hypertension, Type 2 Diabetes',
          medications: 'Lisinopril 10mg daily, Metformin 500mg twice daily',
          allergies: 'No known drug allergies',
          familyHistory: 'Father had MI at age 60, Mother with hypertension',
          socialHistory: 'Non-smoker, occasional alcohol use'
        },
        objective: {
          vitalSigns: {
            temperature: '98.6 F',
            heartRate: '82 bpm',
            respiratoryRate: '16/min',
            bloodPressure: '142/88 mmHg',
            oxygenSaturation: '98% on room air'
          },
          physicalExam: {
            general: 'Alert and oriented, no acute distress',
            cardiovascular: 'Regular rate and rhythm, no murmurs, rubs, or gallops',
            respiratory: 'Clear to auscultation bilaterally',
            abdomen: 'Soft, non-tender, non-distended'
          },
          labResults: 'ECG: Normal sinus rhythm, no ST-T wave changes\nTroponin: Negative',
          imagingResults: 'Chest X-ray: No acute cardiopulmonary process'
        },
        assessment: {
          clinicalImpression: 'Stable angina',
          differentialDiagnosis: 'Acute coronary syndrome, GERD, Musculoskeletal pain',
          problemList: ['Stable angina', 'Hypertension', 'Type 2 Diabetes']
        },
        plan: {
          diagnostics: 'Stress test to be scheduled',
          therapeutics: 'Start Aspirin 81mg daily, Nitroglycerin 0.4mg SL PRN chest pain',
          patientEducation: 'Discussed importance of medication adherence and lifestyle modifications',
          followUp: 'Return in 2 weeks for stress test results'
        }
      },
      signedBy: '22222222-2222-2222-2222-222222222222',
      signedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      encounterId: '33333333-eeee-eeee-eeee-eeeeeeeeeeee',
      patientId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      doctorId: '33333333-3333-3333-3333-333333333333',
      status: 'signed',
      noteType: 'soap',
      content: {
        subjective: {
          chiefComplaint: 'Headache',
          historyOfPresentIllness: 'Patient reports headache for the past 3 days. Pain is described as throbbing, located in the bilateral temporal regions, and rated 7/10 in intensity. Associated with photophobia and phonophobia. No nausea or vomiting.',
          reviewOfSystems: {
            constitutional: 'No fever or chills',
            neurological: 'Headache as described above, no focal deficits',
            eyes: 'Photophobia, no vision changes',
            ears: 'Phonophobia, no hearing changes'
          },
          pastMedicalHistory: 'Migraine, Anxiety',
          medications: 'Sumatriptan PRN, Sertraline 50mg daily',
          allergies: 'Penicillin (rash)',
          familyHistory: 'Mother with migraines',
          socialHistory: 'Non-smoker, rare alcohol use'
        },
        objective: {
          vitalSigns: {
            temperature: '98.4 F',
            heartRate: '76 bpm',
            respiratoryRate: '14/min',
            bloodPressure: '124/78 mmHg',
            oxygenSaturation: '99% on room air'
          },
          physicalExam: {
            general: 'Alert and oriented, mild distress due to headache',
            neurological: 'Cranial nerves II-XII intact, no focal deficits, no meningeal signs',
            head: 'Tenderness to palpation in bilateral temporal regions',
            eyes: 'PERRLA, no papilledema'
          },
          labResults: 'None',
          imagingResults: 'None'
        },
        assessment: {
          clinicalImpression: 'Migraine headache',
          differentialDiagnosis: 'Tension headache, Cluster headache, Sinusitis',
          problemList: ['Migraine headache', 'Anxiety']
        },
        plan: {
          diagnostics: 'None at this time',
          therapeutics: 'Sumatriptan 100mg PO at onset of headache, may repeat in 2 hours if needed',
          patientEducation: 'Discussed headache triggers and avoidance strategies',
          followUp: 'Return in 1 month for follow-up'
        }
      },
      signedBy: '33333333-3333-3333-3333-333333333333',
      signedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];
  
  // Insert clinical notes
  if (await db.collection('clinicalNotes').countDocuments() === 0) {
    await db.collection('clinicalNotes').insertMany(clinicalNotes);
    console.log('Clinical notes seeded successfully');
  } else {
    console.log('Clinical notes collection already has data, skipping seed');
  }
  
  // Seed voice recordings
  const voiceRecordings = [
    {
      encounterId: '11111111-eeee-eeee-eeee-eeeeeeeeeeee',
      patientId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      doctorId: '22222222-2222-2222-2222-222222222222',
      status: 'processed',
      fileId: 'file123',
      duration: 300, // 5 minutes
      transcription: 'Doctor: Hello, how are you feeling today? Patient: I\'ve been having chest pain for the past 2 days...',
      metadata: {
        recordingDevice: 'iPhone 12',
        fileFormat: 'mp3',
        fileSize: 5000000
      },
      retentionPolicy: {
        retentionPeriod: 90, // days
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      encounterId: '33333333-eeee-eeee-eeee-eeeeeeeeeeee',
      patientId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      doctorId: '33333333-3333-3333-3333-333333333333',
      status: 'processed',
      fileId: 'file456',
      duration: 240, // 4 minutes
      transcription: 'Doctor: Hello, what brings you in today? Patient: I\'ve been having a headache for the past 3 days...',
      metadata: {
        recordingDevice: 'Samsung Galaxy S21',
        fileFormat: 'mp3',
        fileSize: 4000000
      },
      retentionPolicy: {
        retentionPeriod: 90, // days
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];
  
  // Insert voice recordings
  if (await db.collection('voiceRecordings').countDocuments() === 0) {
    await db.collection('voiceRecordings').insertMany(voiceRecordings);
    console.log('Voice recordings seeded successfully');
  } else {
    console.log('Voice recordings collection already has data, skipping seed');
  }
};
