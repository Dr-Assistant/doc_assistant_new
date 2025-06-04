import unittest
from ai_services.pre_diagnosis_summary.pre_diagnosis_summary_service import PreDiagnosisSummaryService

class TestPreDiagnosisSummaryService(unittest.TestCase):
    def setUp(self):
        self.service = PreDiagnosisSummaryService()

    def test_process_questionnaire_data(self):
        questionnaire_data = {"symptom": "fever", "duration": "3 days"}
        processed = self.service.process_questionnaire_data(questionnaire_data)
        self.assertEqual(processed, questionnaire_data)

    def test_extract_key_medical_history(self):
        records = {
            "medicalHistory": {"diabetes": True},
            "allergies": ["penicillin"],
            "medications": ["metformin"]
        }
        key_history = self.service.extract_key_medical_history(records)
        self.assertIn("medical_history", key_history)
        self.assertIn("allergies", key_history)
        self.assertIn("medications", key_history)

    def test_generate_summary(self):
        # Mock patient ID and questionnaire data
        patient_id = "patient123"
        questionnaire_data = {"symptom": "cough", "duration": "5 days"}

        # Since generate_ai_summary and fetch_abdm_health_records are external,
        # this test should ideally mock those calls. Here we just test method call.
        summary = self.service.generate_summary(patient_id, questionnaire_data)
        self.assertIsNotNone(summary)

if __name__ == "__main__":
    unittest.main()
