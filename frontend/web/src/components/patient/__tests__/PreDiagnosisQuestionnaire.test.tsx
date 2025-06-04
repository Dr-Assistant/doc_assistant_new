/**
 * Tests for PreDiagnosisQuestionnaire Component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PreDiagnosisQuestionnaire from '../PreDiagnosisQuestionnaire';
import { QuestionnaireData } from '../../../types/patient.types';

// Mock the onSubmit function
const mockOnSubmit = jest.fn();

describe('PreDiagnosisQuestionnaire', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders the questionnaire form', () => {
    render(
      <PreDiagnosisQuestionnaire
        onSubmit={mockOnSubmit}
        loading={false}
        disabled={false}
      />
    );

    expect(screen.getByText('Pre-Consultation Questionnaire')).toBeInTheDocument();
    expect(screen.getByLabelText(/Chief Complaint/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/)).toBeInTheDocument();
    expect(screen.getByText('Severity *')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <PreDiagnosisQuestionnaire
        onSubmit={mockOnSubmit}
        loading={false}
        disabled={false}
      />
    );

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /Generate Pre-Diagnosis Summary/ });
    await user.click(submitButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText('Chief complaint is required')).toBeInTheDocument();
      expect(screen.getByText('Duration is required')).toBeInTheDocument();
      expect(screen.getByText('Severity is required')).toBeInTheDocument();
    });

    // Ensure onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    
    render(
      <PreDiagnosisQuestionnaire
        onSubmit={mockOnSubmit}
        loading={false}
        disabled={false}
      />
    );

    // Fill in required fields
    const chiefComplaintInput = screen.getByLabelText(/Chief Complaint/);
    const durationInput = screen.getByLabelText(/Duration/);
    const severityRadio = screen.getByRole('radio', { name: /Moderate/ });

    await user.type(chiefComplaintInput, 'Chest pain and shortness of breath');
    await user.type(durationInput, '2 days');
    await user.click(severityRadio);

    // Fill in optional fields
    const symptomsInput = screen.getByLabelText(/Associated Symptoms/);
    await user.type(symptomsInput, 'Nausea and sweating');

    const historyInput = screen.getByLabelText(/Past Medical History/);
    await user.type(historyInput, 'Hypertension, diabetes');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Generate Pre-Diagnosis Summary/ });
    await user.click(submitButton);

    // Verify onSubmit was called with correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        chiefComplaint: 'Chest pain and shortness of breath',
        duration: '2 days',
        severity: 'moderate',
        associatedSymptoms: 'Nausea and sweating',
        pastMedicalHistory: 'Hypertension, diabetes'
      });
    });
  });

  it('clears validation errors when user starts typing', async () => {
    const user = userEvent.setup();
    
    render(
      <PreDiagnosisQuestionnaire
        onSubmit={mockOnSubmit}
        loading={false}
        disabled={false}
      />
    );

    // Submit to trigger validation errors
    const submitButton = screen.getByRole('button', { name: /Generate Pre-Diagnosis Summary/ });
    await user.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Chief complaint is required')).toBeInTheDocument();
    });

    // Start typing in the field
    const chiefComplaintInput = screen.getByLabelText(/Chief Complaint/);
    await user.type(chiefComplaintInput, 'C');

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Chief complaint is required')).not.toBeInTheDocument();
    });
  });

  it('resets form when reset button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <PreDiagnosisQuestionnaire
        onSubmit={mockOnSubmit}
        loading={false}
        disabled={false}
      />
    );

    // Fill in some fields
    const chiefComplaintInput = screen.getByLabelText(/Chief Complaint/);
    const durationInput = screen.getByLabelText(/Duration/);

    await user.type(chiefComplaintInput, 'Test complaint');
    await user.type(durationInput, 'Test duration');

    // Click reset button
    const resetButton = screen.getByRole('button', { name: /Reset/ });
    await user.click(resetButton);

    // Fields should be cleared
    expect(chiefComplaintInput).toHaveValue('');
    expect(durationInput).toHaveValue('');
  });

  it('disables form when loading', () => {
    render(
      <PreDiagnosisQuestionnaire
        onSubmit={mockOnSubmit}
        loading={true}
        disabled={false}
      />
    );

    // All inputs should be disabled
    const chiefComplaintInput = screen.getByLabelText(/Chief Complaint/);
    const durationInput = screen.getByLabelText(/Duration/);
    const submitButton = screen.getByRole('button', { name: /Generating Summary/ });

    expect(chiefComplaintInput).toBeDisabled();
    expect(durationInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state in submit button', () => {
    render(
      <PreDiagnosisQuestionnaire
        onSubmit={mockOnSubmit}
        loading={true}
        disabled={false}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Generating Summary/ });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('handles smoking status selection', async () => {
    const user = userEvent.setup();
    
    render(
      <PreDiagnosisQuestionnaire
        onSubmit={mockOnSubmit}
        loading={false}
        disabled={false}
      />
    );

    // Select smoking status
    const formerSmokerRadio = screen.getByRole('radio', { name: /Former smoker/ });
    await user.click(formerSmokerRadio);

    // Fill required fields and submit
    const chiefComplaintInput = screen.getByLabelText(/Chief Complaint/);
    const durationInput = screen.getByLabelText(/Duration/);
    const severityRadio = screen.getByRole('radio', { name: /Mild/ });

    await user.type(chiefComplaintInput, 'Test complaint');
    await user.type(durationInput, 'Test duration');
    await user.click(severityRadio);

    const submitButton = screen.getByRole('button', { name: /Generate Pre-Diagnosis Summary/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          smokingStatus: 'former'
        })
      );
    });
  });

  it('displays privacy notice', () => {
    render(
      <PreDiagnosisQuestionnaire
        onSubmit={mockOnSubmit}
        loading={false}
        disabled={false}
      />
    );

    expect(screen.getByText(/Privacy Notice/)).toBeInTheDocument();
    expect(screen.getByText(/HIPAA guidelines/)).toBeInTheDocument();
  });

  it('filters out empty values on submit', async () => {
    const user = userEvent.setup();
    
    render(
      <PreDiagnosisQuestionnaire
        onSubmit={mockOnSubmit}
        loading={false}
        disabled={false}
      />
    );

    // Fill only required fields, leave optional fields empty
    const chiefComplaintInput = screen.getByLabelText(/Chief Complaint/);
    const durationInput = screen.getByLabelText(/Duration/);
    const severityRadio = screen.getByRole('radio', { name: /High/ });

    await user.type(chiefComplaintInput, 'Test complaint');
    await user.type(durationInput, 'Test duration');
    await user.click(severityRadio);

    const submitButton = screen.getByRole('button', { name: /Generate Pre-Diagnosis Summary/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        chiefComplaint: 'Test complaint',
        duration: 'Test duration',
        severity: 'severe'
      });
    });

    // Should not include empty fields
    expect(mockOnSubmit).not.toHaveBeenCalledWith(
      expect.objectContaining({
        associatedSymptoms: '',
        pastMedicalHistory: ''
      })
    );
  });
});
