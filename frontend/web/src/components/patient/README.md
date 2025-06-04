# Pre-Diagnosis Summary Frontend Components

This directory contains the frontend components for the Pre-Diagnosis Summary feature, implementing MVP-027.

## Components Overview

### 1. PreDiagnosisQuestionnaire.tsx
**Purpose**: Interactive form for collecting patient information before generating a pre-diagnosis summary.

**Features**:
- Comprehensive questionnaire with medical history, symptoms, and current medications
- Real-time validation and error handling
- Severity assessment with visual indicators
- Privacy notice and HIPAA compliance information
- Responsive design for mobile and desktop

**Usage**:
```tsx
<PreDiagnosisQuestionnaire
  onSubmit={handleQuestionnaireSubmit}
  loading={isGenerating}
  disabled={false}
/>
```

### 2. PreDiagnosisSummaryCard.tsx
**Purpose**: Displays a generated pre-diagnosis summary with AI insights and recommendations.

**Features**:
- AI-generated key findings, risk factors, and recommendations
- Urgency level indicators with color coding
- Confidence score visualization
- Data source information (ABDM, local records, questionnaire)
- Technical details (processing time, token usage)
- Expandable sections for detailed information
- Action buttons for follow-up and consultation

**Usage**:
```tsx
<PreDiagnosisSummaryCard
  summary={preDiagnosisSummary}
  onRefresh={handleRefresh}
  onDownload={handleDownload}
  onShare={handleShare}
  loading={isRefreshing}
/>
```

### 3. PreDiagnosisSummaryList.tsx
**Purpose**: Lists multiple pre-diagnosis summaries with filtering and search capabilities.

**Features**:
- Displays summaries for a specific patient or all recent summaries
- Filtering by status, urgency level, and search terms
- Urgent summary highlighting with badges
- Pagination and load more functionality
- Click-to-view summary details
- Refresh and real-time updates

**Usage**:
```tsx
<PreDiagnosisSummaryList
  patientId={patient.id}
  showUrgentOnly={false}
  maxItems={10}
  onSummaryClick={handleSummaryClick}
  title="Patient Summaries"
/>
```

## Page Components

### PreDiagnosisSummary.tsx
**Purpose**: Main page that orchestrates the complete pre-diagnosis workflow.

**Features**:
- Step-by-step workflow with progress indicator
- Patient information display
- Questionnaire collection
- AI analysis progress tracking
- Summary display and management
- Navigation and breadcrumbs
- Error handling and retry mechanisms

**Workflow Steps**:
1. **Patient Information**: Display patient demographics
2. **Questionnaire**: Collect symptoms and medical history
3. **AI Analysis**: Show processing progress
4. **Summary**: Display generated insights and recommendations

## Integration Points

### Dashboard Integration
The pre-diagnosis summary components are integrated into the main dashboard:

- **Urgent Summaries Widget**: Shows high-priority summaries requiring immediate attention
- **Quick Actions**: Direct links to generate new summaries
- **Navigation**: Seamless routing to patient-specific summary pages

### Patient Detail Integration
Added as a new tab in the patient detail view:

- **Pre-Diagnosis Tab**: Lists all summaries for the patient
- **Generate Button**: Quick access to create new summaries
- **Summary History**: View past summaries and their outcomes

## Data Flow

```
User Input (Questionnaire) 
    ↓
Frontend Validation
    ↓
API Call to Pre-Diagnosis Service
    ↓
Service Gathers Data (ABDM + Local + Questionnaire)
    ↓
AI Processing (Gemini)
    ↓
Summary Generation
    ↓
Frontend Display with Actions
```

## State Management

### Local State
- Form data and validation errors
- Loading states for async operations
- UI state (expanded sections, filters)
- Snackbar notifications

### API Integration
- RESTful API calls through dedicated service
- Error handling and retry logic
- Mock service support for development
- Real-time updates and polling

## Styling and UX

### Material-UI Components
- Consistent design system with existing application
- Responsive grid layouts
- Accessibility compliance (ARIA labels, keyboard navigation)
- Loading states and progress indicators

### Color Coding
- **Urgent**: Red (error color)
- **High Priority**: Orange (warning color)
- **Medium Priority**: Blue (info color)
- **Low Priority**: Green (success color)

### Icons
- **Psychology Icon**: AI/brain-related features
- **Warning Icons**: Risk factors and urgent items
- **Check Icons**: Completed items and key findings
- **Medical Icons**: Recommendations and clinical actions

## Error Handling

### User-Friendly Messages
- Clear error descriptions for failed operations
- Retry mechanisms for transient failures
- Graceful degradation when services are unavailable
- Validation feedback for form inputs

### Fallback Behavior
- Mock data when backend services are unavailable
- Progressive enhancement for optional features
- Offline-capable design patterns

## Accessibility

### WCAG Compliance
- Proper heading hierarchy
- Alt text for images and icons
- Keyboard navigation support
- Screen reader compatibility
- High contrast color schemes

### Responsive Design
- Mobile-first approach
- Touch-friendly interface elements
- Adaptive layouts for different screen sizes
- Progressive disclosure of information

## Performance Optimization

### Code Splitting
- Lazy loading of components
- Route-based code splitting
- Dynamic imports for heavy dependencies

### Data Optimization
- Efficient API calls with pagination
- Caching of frequently accessed data
- Optimistic updates for better UX
- Debounced search and filtering

## Testing Strategy

### Unit Tests
- Component rendering and props
- User interaction handling
- Form validation logic
- API service methods

### Integration Tests
- Complete workflow testing
- API integration testing
- Error scenario handling
- Cross-component communication

### E2E Tests
- Full user journey testing
- Multi-step workflow validation
- Browser compatibility testing
- Performance testing

## Development Setup

### Environment Variables
```bash
REACT_APP_PRE_DIAGNOSIS_SERVICE_URL=http://localhost:9004
REACT_APP_USE_MOCK_SERVICES=true
```

### Mock Services
Enable mock services for development without backend:
```typescript
const useMockService = process.env.REACT_APP_USE_MOCK_SERVICES === 'true';
```

### Hot Reloading
Components support hot reloading for rapid development:
```bash
npm start
# Navigate to http://localhost:3000/patients/{id}/pre-diagnosis
```

## Future Enhancements

### Planned Features
- Real-time collaboration between doctors
- Voice input for questionnaire responses
- Integration with wearable device data
- Predictive analytics and trend analysis
- Multi-language support
- Offline mode with sync capabilities

### Technical Improvements
- WebSocket integration for real-time updates
- Advanced caching strategies
- Performance monitoring and analytics
- A/B testing framework integration
- Enhanced accessibility features

## Support and Maintenance

### Monitoring
- Error tracking and reporting
- Performance metrics collection
- User interaction analytics
- API usage monitoring

### Documentation
- Component API documentation
- User guides and tutorials
- Developer onboarding materials
- Troubleshooting guides
