# Design System

This document outlines the comprehensive design system for the Dr. Assistant application, providing guidelines for visual design, interaction patterns, and component usage to ensure a consistent, accessible, and effective user experience.

## Design Principles

### 1. Clinical Focus

**Definition**: Design that prioritizes the clinical workflow and patient care above all else.

**Guidelines**:
- Optimize for the doctor's primary task flow
- Minimize distractions during patient interactions
- Prioritize clinical information over administrative details
- Design for the realities of clinical environments (interruptions, time pressure)

**Examples**:
- Voice-first interactions during patient consultations
- Critical clinical information visible at a glance
- Minimal interaction required for common tasks

### 2. Efficiency First

**Definition**: Design that maximizes the doctor's productivity and minimizes time spent on administrative tasks.

**Guidelines**:
- Minimize clicks, taps, and cognitive load
- Prioritize speed and performance
- Create shortcuts for frequent actions
- Design for expert users while supporting new users

**Examples**:
- Single-tap actions for common tasks
- Keyboard shortcuts for power users
- Predictive suggestions based on context
- Batch processing capabilities

### 3. Progressive Disclosure

**Definition**: Present only what is necessary for the current task, revealing more details as needed.

**Guidelines**:
- Show essential information by default
- Allow easy access to additional details
- Layer complexity based on user needs
- Create clear information hierarchy

**Examples**:
- Expandable sections for detailed information
- Summary views with drill-down capabilities
- Context-sensitive information display
- Intelligent defaults with customization options

### 4. Contextual Intelligence

**Definition**: Design that understands and adapts to the user's current context and needs.

**Guidelines**:
- Present relevant information based on current task
- Adapt interface based on user role and specialty
- Provide intelligent suggestions in context
- Remember user preferences and patterns

**Examples**:
- Specialty-specific views and workflows
- Contextual suggestions during documentation
- Personalized dashboard based on usage patterns
- Environment-aware interface (clinic vs. hospital)

### 5. Trust and Confidence

**Definition**: Design that builds trust through transparency, reliability, and user control.

**Guidelines**:
- Make AI assistance transparent and explainable
- Provide clear feedback on system actions
- Allow users to verify and correct automated content
- Maintain consistent performance and reliability

**Examples**:
- Highlighting AI-generated content for review
- Confidence indicators for suggestions
- Easy correction mechanisms
- Transparent data usage and privacy controls

## Visual Language

### Color System

#### Primary Palette

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary Blue** | #0055B8 | Primary actions, key UI elements |
| **Secondary Teal** | #00A3A1 | Secondary actions, accents |
| **Neutral Gray** | #4A5568 | Body text, secondary content |
| **Background Light** | #F7FAFC | Primary background |
| **White** | #FFFFFF | Cards, containers, foreground elements |

#### Semantic Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Success Green** | #38A169 | Positive outcomes, confirmations |
| **Warning Amber** | #DD6B20 | Warnings, alerts requiring attention |
| **Error Red** | #E53E3E | Errors, critical alerts |
| **Info Blue** | #3182CE | Informational messages |
| **Highlight Yellow** | #F6E05E | Highlighting important information |

#### Clinical Status Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Critical Red** | #C53030 | Critical clinical values |
| **Abnormal Orange** | #DD6B20 | Abnormal results |
| **Borderline Yellow** | #D69E2E | Borderline results |
| **Normal Green** | #2F855A | Normal results |
| **Pending Gray** | #718096 | Pending or incomplete |

#### Color Usage Guidelines

1. **Accessibility**: Maintain WCAG 2.1 AA compliance for all text and interactive elements
2. **Clinical Context**: Use status colors consistently for clinical information
3. **Hierarchy**: Use color to reinforce information hierarchy, not as the sole indicator
4. **Restraint**: Use accent colors sparingly to highlight important elements

### Typography

#### Font Family

- **Primary Font**: Inter (Sans-serif)
- **Monospace Font**: Roboto Mono (for code, IDs, measurements)

#### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Display** | 32px | 700 | 40px | Major headings, welcome screens |
| **Heading 1** | 24px | 700 | 32px | Page titles, major sections |
| **Heading 2** | 20px | 600 | 28px | Section headings |
| **Heading 3** | 16px | 600 | 24px | Subsection headings |
| **Body** | 14px | 400 | 20px | Primary content text |
| **Body Small** | 12px | 400 | 16px | Secondary content, captions |
| **Label** | 14px | 500 | 20px | Form labels, buttons |
| **Caption** | 12px | 500 | 16px | Supporting text, timestamps |
| **Monospace** | 14px | 400 | 20px | Code, measurements, IDs |

#### Typography Guidelines

1. **Readability**: Prioritize readability in all environments, including low light
2. **Hierarchy**: Use size, weight, and spacing to create clear hierarchy
3. **Consistency**: Maintain consistent type styles across the application
4. **Responsiveness**: Adjust type scale appropriately for different screen sizes

### Iconography

#### Icon System

- **Style**: Outlined with 2px stroke, rounded corners
- **Size**: 24px × 24px (standard), 16px × 16px (compact)
- **Grid**: 24px × 24px with 2px padding

#### Icon Categories

1. **Navigation Icons**: Used in navigation elements
2. **Action Icons**: Represent actions users can take
3. **Status Icons**: Indicate status or state
4. **Clinical Icons**: Represent medical concepts
5. **Object Icons**: Represent digital or physical objects

#### Icon Usage Guidelines

1. **Clarity**: Icons should be immediately recognizable
2. **Consistency**: Use icons consistently throughout the application
3. **Labeling**: Pair icons with text labels when possible
4. **Touchability**: Ensure interactive icons have adequate touch targets (minimum 44px × 44px)

### Spacing System

#### Spacing Scale

| Name | Size | Usage |
|------|------|-------|
| **4xs** | 2px | Minimal separation |
| **3xs** | 4px | Tight spacing, icons |
| **2xs** | 8px | Compact elements |
| **xs** | 12px | Close elements |
| **sm** | 16px | Related elements |
| **md** | 24px | Standard spacing |
| **lg** | 32px | Section separation |
| **xl** | 48px | Major section separation |
| **2xl** | 64px | Page-level separation |

#### Layout Grid

- **Base Unit**: 8px
- **Columns**: 12-column grid for desktop, 4-column for mobile
- **Gutters**: 16px (desktop), 8px (mobile)
- **Margins**: 24px (desktop), 16px (mobile)

#### Spacing Guidelines

1. **Consistency**: Use the spacing scale consistently
2. **Proximity**: Use spacing to indicate relationships between elements
3. **Breathing Room**: Provide adequate white space for readability
4. **Density**: Balance information density with usability

## Components

### Core Components

#### Buttons

**Primary Button**
- Purpose: Main actions, most important action on screen
- Appearance: Filled with Primary Blue, white text
- States: Default, Hover, Active, Focused, Disabled

**Secondary Button**
- Purpose: Alternative actions, secondary importance
- Appearance: Outlined with Primary Blue, Primary Blue text
- States: Default, Hover, Active, Focused, Disabled

**Tertiary Button**
- Purpose: Least important actions, supporting functions
- Appearance: Text only, Primary Blue text
- States: Default, Hover, Active, Focused, Disabled

**Icon Button**
- Purpose: Compact actions, toolbar functions
- Appearance: Icon only with tooltip
- States: Default, Hover, Active, Focused, Disabled

**Button Guidelines**:
- Use consistent button hierarchy across the application
- Provide clear visual feedback for all states
- Ensure adequate touch targets for mobile use
- Use descriptive action verbs for button labels

#### Input Controls

**Text Input**
- Purpose: Single-line text entry
- Variants: Default, With icon, With validation
- States: Default, Focused, Filled, Error, Disabled

**Text Area**
- Purpose: Multi-line text entry
- Variants: Default, With character count
- States: Default, Focused, Filled, Error, Disabled

**Select**
- Purpose: Selection from predefined options
- Variants: Default, With search, Multi-select
- States: Default, Focused, Selected, Error, Disabled

**Checkbox**
- Purpose: Multiple selection, toggle settings
- Variants: Default, Indeterminate
- States: Unchecked, Checked, Focused, Disabled

**Radio Button**
- Purpose: Single selection from options
- Variants: Default only
- States: Unselected, Selected, Focused, Disabled

**Input Guidelines**:
- Provide clear labels for all input controls
- Show validation feedback inline
- Support keyboard navigation and screen readers
- Maintain consistent appearance and behavior

#### Cards

**Information Card**
- Purpose: Display related content as a unit
- Variants: Default, Interactive, Elevated
- Components: Header, Body, Footer, Actions

**Patient Card**
- Purpose: Display patient information
- Variants: Compact, Standard, Detailed
- Components: Avatar, Demographics, Status, Actions

**Clinical Card**
- Purpose: Display clinical information
- Variants: Result, Note, Order, Prescription
- Components: Header, Content, Metadata, Actions

**Card Guidelines**:
- Use consistent card structure throughout the application
- Clearly indicate interactive cards
- Maintain appropriate information density
- Use consistent spacing within and between cards

### Clinical Components

#### Patient Banner

**Purpose**: Display key patient information at the top of patient-specific screens

**Content**:
- Patient name and demographics
- MRN/ID
- Critical alerts
- Allergies
- Current visit context
- Key actions

**Variants**:
- Expanded (full details)
- Collapsed (minimal details)
- Mini (for embedded contexts)

#### Clinical Timeline

**Purpose**: Display chronological patient events and records

**Content**:
- Visit dates
- Encounter types
- Key clinical events
- Documents and notes
- Test results
- Medications

**Variants**:
- Detailed (full information)
- Compact (key events only)
- Filtered (by event type)

#### Vital Signs Display

**Purpose**: Display patient vital signs with trends

**Content**:
- Current vital signs
- Historical trends
- Normal ranges
- Critical indicators

**Variants**:
- Current only
- With trends
- With detailed history

#### Clinical Note Editor

**Purpose**: Create and edit clinical documentation

**Content**:
- Structured sections (SOAP, etc.)
- Voice input controls
- Template selection
- AI assistance indicators
- Validation status

**Variants**:
- Voice-first mode
- Template-based
- Free-form
- Review mode

### Navigation Components

#### Top Navigation Bar

**Purpose**: Primary navigation and global actions

**Content**:
- Logo/home
- Primary navigation
- Search
- Notifications
- User profile
- Global actions

**Variants**:
- Desktop (expanded)
- Mobile (collapsed)
- Contextual (with patient context)

#### Side Navigation

**Purpose**: Secondary navigation within sections

**Content**:
- Section links
- Subsection links
- Context indicators
- Collapse/expand controls

**Variants**:
- Expanded
- Collapsed
- Mobile drawer

#### Tab Navigation

**Purpose**: Tertiary navigation within pages

**Content**:
- Related content tabs
- Selection indicator
- Optional counts/badges

**Variants**:
- Horizontal tabs
- Vertical tabs
- Scrollable tabs

#### Breadcrumbs

**Purpose**: Hierarchical navigation and context

**Content**:
- Navigation path
- Current location
- Optional actions

**Variants**:
- Simple path
- With actions
- Responsive (collapsing)

### Feedback Components

#### Alerts and Notifications

**Purpose**: Communicate important information to users

**Types**:
- Success: Confirmation of completed actions
- Warning: Potential issues requiring attention
- Error: Problems requiring resolution
- Info: Neutral information

**Variants**:
- Toast (temporary)
- Inline (embedded in content)
- Modal (requiring acknowledgment)
- Banner (persistent at page level)

#### Progress Indicators

**Purpose**: Show status of processes and loading

**Types**:
- Determinate: Known progress percentage
- Indeterminate: Unknown completion time
- Step indicator: Multi-step processes

**Variants**:
- Linear (horizontal bar)
- Circular (spinner)
- Skeleton (content placeholder)
- Steps (numbered or labeled)

#### Empty States

**Purpose**: Provide guidance when no content is available

**Content**:
- Illustrative icon
- Explanatory text
- Suggested actions
- Optional help link

**Variants**:
- First-use (onboarding)
- No results (search/filter)
- No data (empty section)
- Error state (failed loading)

## Interaction Patterns

### Voice Interaction

#### Voice Recording

**Initiation**:
- Explicit: Tap microphone button
- Implicit: Context-aware activation in documentation mode

**Feedback**:
- Visual: Recording indicator, voice visualization
- Audio: Subtle sounds for start/stop
- Haptic: Vibration for start/stop (mobile)

**Control**:
- Pause/resume recording
- Cancel recording
- Manual stop

#### Voice Commands

**Types**:
- Navigation commands ("Go to schedule")
- Action commands ("Create new note")
- Documentation commands ("New paragraph", "Section: Assessment")

**Feedback**:
- Visual confirmation
- Command execution
- Error handling for unrecognized commands

#### Voice-to-Text

**Modes**:
- Continuous transcription
- Command-then-dictate
- Structured dictation (templates)

**Editing**:
- Voice correction commands
- Touch/keyboard editing
- Suggestion acceptance/rejection

### Touch and Gesture

#### Touch Targets

- Minimum size: 44px × 44px
- Spacing between targets: Minimum 8px
- Hit area: May extend beyond visual boundaries

#### Common Gestures

- Tap: Primary action, selection
- Double tap: Zoom, expand
- Long press: Context menu, selection mode
- Swipe: Navigation, dismissal, reveal actions
- Pinch: Zoom in/out
- Two-finger tap: Secondary action

#### Custom Gestures

- Quick actions: Swipe patterns for common tasks
- Clinical shortcuts: Specialty-specific gestures
- Accessibility gestures: Alternative interaction methods

### Keyboard and Shortcuts

#### Keyboard Navigation

- Tab order: Logical flow through interface
- Focus indicators: Clear visual indication
- Keyboard access: All functions accessible without mouse

#### Keyboard Shortcuts

- Global shortcuts: Application-wide actions
- Contextual shortcuts: Context-specific actions
- Custom shortcuts: User-defined shortcuts

#### Shortcut Discovery

- Keyboard shortcut overlay (press and hold Cmd/Ctrl)
- Tooltip hints
- Settings page with all shortcuts

## Responsive Design

### Device Support

- **Desktop**: Primary workstation experience
- **Tablet**: Clinical mobility experience
- **Mobile**: On-the-go access
- **Large Displays**: Information-rich dashboards

### Responsive Principles

1. **Content Priority**: Prioritize critical content on smaller screens
2. **Consistent Experience**: Maintain core functionality across devices
3. **Optimized Interactions**: Adapt interaction patterns to device capabilities
4. **Performance Focus**: Ensure performance on all devices, especially mobile

### Breakpoints

| Breakpoint | Range | Target Devices |
|------------|-------|----------------|
| **Small** | 320px - 639px | Mobile phones |
| **Medium** | 640px - 1023px | Tablets, small laptops |
| **Large** | 1024px - 1439px | Laptops, desktops |
| **Extra Large** | 1440px+ | Large monitors |

### Layout Adaptations

- **Navigation**: Collapses to drawer/hamburger menu on smaller screens
- **Multi-column**: Reduces columns as screen size decreases
- **Information Density**: Adjusts based on screen size
- **Touch Optimization**: Increases touch target size on touch devices

## Accessibility

### Standards Compliance

- WCAG 2.1 AA compliance as minimum standard
- Section 508 compliance for U.S. market
- ARIA implementation for dynamic content

### Vision Considerations

- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Color Independence**: No information conveyed by color alone
- **Text Sizing**: Support for browser text resizing up to 200%
- **Screen Readers**: Full support for screen reader technology

### Motor Considerations

- **Keyboard Navigation**: Complete keyboard accessibility
- **Touch Targets**: Adequately sized and spaced
- **Reduced Motion**: Option to reduce or eliminate animations
- **Input Alternatives**: Support for various input methods

### Cognitive Considerations

- **Clear Language**: Simple, direct language
- **Consistent Patterns**: Predictable interface behavior
- **Error Prevention**: Confirmation for destructive actions
- **Help and Documentation**: Contextual assistance

## Design Tokens

Design tokens are the visual design atoms of the design system—specifically, they are named entities that store visual design attributes. We use them in place of hard-coded values to ensure flexibility and consistency.

### Color Tokens

```
colors.primary.default: #0055B8
colors.primary.light: #4D8FD6
colors.primary.dark: #003B80
colors.secondary.default: #00A3A1
colors.secondary.light: #4DC7C6
colors.secondary.dark: #007170
...
```

### Typography Tokens

```
typography.family.sans: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
typography.family.mono: 'Roboto Mono, monospace'
typography.size.display: 32px
typography.size.heading1: 24px
...
```

### Spacing Tokens

```
spacing.4xs: 2px
spacing.3xs: 4px
spacing.2xs: 8px
spacing.xs: 12px
...
```

### Shadow Tokens

```
shadows.sm: '0 1px 3px rgba(0,0,0,0.12)'
shadows.md: '0 4px 6px rgba(0,0,0,0.12)'
shadows.lg: '0 10px 15px rgba(0,0,0,0.12)'
...
```

### Border Tokens

```
borders.radius.sm: 2px
borders.radius.md: 4px
borders.radius.lg: 8px
borders.width.default: 1px
...
```

## Implementation Guidelines

### Design-to-Development Handoff

1. **Component Documentation**: Complete specifications for all components
2. **Design Files**: Maintained in Figma with component library
3. **Token Implementation**: Design tokens implemented in code
4. **Prototype Links**: Interactive prototypes for complex interactions

### Quality Assurance

1. **Visual Regression Testing**: Automated tests for visual consistency
2. **Accessibility Testing**: Regular audits and user testing
3. **Cross-Device Testing**: Verification across supported devices
4. **Performance Testing**: Monitoring of rendering and interaction performance

### Governance and Maintenance

1. **Design Review Process**: Regular review of new designs
2. **Component Approval**: Process for adding new components
3. **Version Control**: Semantic versioning for design system
4. **Feedback Loop**: Mechanism for user and developer feedback

## Conclusion

This design system provides a comprehensive framework for creating a consistent, efficient, and accessible user experience for the Dr. Assistant application. By adhering to these guidelines, we can ensure that the product meets the unique needs of healthcare providers while maintaining a high standard of usability and visual quality.

The design system should be treated as a living document that evolves based on user feedback, technological advancements, and changing requirements. Regular reviews and updates will ensure that it remains relevant and effective.
