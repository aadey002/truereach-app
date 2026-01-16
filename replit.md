# TrueReach - Healthcare Phone Validation

**Tagline**: Verify. Connect. Care!

## Recent Changes

**January 16, 2026 - Patient Data Pass-Through**:
- Added support for extracting patient data from CSV/Excel uploads (name, ID, email, DOB)
- Name detection handles multiple formats: separate First/Last columns, combined "First Last", "Last, First"
- Common FQHC/clinic column naming supported: First, Last, fname, lname, pt first, pt last, patient_name, etc.
- ID column detection: id, patient_id, mrn, record
- Results table shows Patient column (Name + ID) when data is present
- Excel download now includes: Patient ID, Name, Email, Date of Birth columns
- All patient data flows through without modification - validation only applies to phone numbers

**November 13, 2025 - PHASE 2 COMPLETE**: Shared NANP Failure Detection System
- Implemented centralized NANP validation with explicit failure codes (invalid_area_code, reserved_555_exchange, reserved_911_exchange, n11_reserved, leading_digit_violation, zero_line)
- Refactored `getNANPValidation()` to return both boolean and failure code, ensuring perfect lockstep between validation and suggestion logic
- Fixed critical bug: Exchange "111" now correctly identified as leading_digit_violation (not misidentified as N11)
- Updated `getNANPSuggestion()` to switch on failure codes, eliminating duplicate logic and ensuring every NANP rejection yields specific, actionable guidance
- All NANP suggestions now have 95% confidence (HIGH tier) with detailed explanations and NANP rule citations
- Combined suggestion system: NANP guidance prepended to placeholder, transposed, and format analyses
- Applied to both batch (`/api/validate`) and real-time (`/api/validate-realtime`) endpoints
- Architect-approved for production readiness with zero security concerns
- Next recommended actions: Add automated regression tests for each failure code, spot-check UI/export rendering, monitor VALID_US_AREA_CODES for updates

## Overview

TrueReach is a healthcare-focused phone validation application that provides three validation modes:

1. **Batch Upload Validation**: Upload CSV or Excel files containing phone numbers and validate them in bulk
2. **Real-Time Validation**: Validate individual phone numbers as users type in forms
3. **Healthcare Widget**: Embeddable JavaScript widget for integration into EHR and Pharmacy Management systems

The application uses the Veriphone API to identify valid phone numbers, determine their type (mobile/landline/VoIP), detect SMS capability, and provide carrier information. Built as a full-stack web application with a React frontend and Express backend.

## Features

### Batch Validation (Main App)
- Upload CSV and Excel files (.csv, .xlsx, .xls)
- Automatic phone column detection
- **Duplicate Detection**: Pre-validation summary with smart normalization (strips non-digit characters except leading +), choice to remove or keep duplicates, visual highlighting in results
- **Real-Time Progress**: Purple gradient progress bar showing "Validating: X of Y numbers (Z%)" with smooth animations
- **Smart Correction Suggestions (PHASE 2 COMPLETE)**: Multi-layered analysis with NANP validation, transposed digit detection, and pattern recognition
  - **NANP Validation**: Enforces North American Numbering Plan rules (overrides Veriphone API)
    - Invalid area codes (123, 999, etc.)
    - Reserved exchanges (555, 000, 911)
    - N11 service codes (211, 311, 411, 511, 611, 711, 811, 911)
    - Leading digit violations (exchange codes starting with 0 or 1)
    - Zero line numbers (last 4 digits cannot be 0000)
    - Uses shared failure detection system ensuring perfect lockstep between validation and suggestions
  - **Transposed Digit Detection**: Identifies adjacent digit swaps (410-555-1234 ↔ 410-555-1243)
    - Only suggests when resulting number passes FULL NANP validation
    - Safety guardrails: 10-digit numbers only, adjacent swaps only, no speculative fixes
  - **Placeholder Detection**: Enhanced pattern recognition (zero blocks, repeating digits, sequential patterns, 555 exchanges)
  - **Confidence Tier System**: LOW (<75), MEDIUM (75-89), HIGH (90+) with visual badges
  - **Combined Suggestions**: NANP guidance prepended to other analyses (format issues, extensions, etc.)
  - All suggestions require patient verification (prominent red warnings in UI)
  - Export Analysis feature creates CSV with "Possible Fix (VERIFY FIRST)" column showing top 3 suggestions with confidence tiers
- Summary dashboard showing valid/invalid counts and SMS-capable numbers
- Detailed results table with phone type, carrier information, and suggestions column with popover UI
- Rate limiting to respect API quotas

### Real-Time Validation (Widget Demo)
- Instant validation as users complete form fields
- Detailed response with formatted phone numbers
- Smart warnings for landlines, VoIP numbers, and invalid entries
- Auto-formatting of phone numbers
- Perfect for patient registration forms
- Available at `/widget-demo` route

### Embeddable Widget for Healthcare Systems
- Drop-in JavaScript widget for EHR and Pharmacy Management systems
- No backend modifications required - just 2 lines of JavaScript
- CORS-enabled API for cross-origin validation requests
- Auto-attaches to phone input fields
- Inline validation results with customizable CSS
- Supports validate-on-blur and validate-while-typing modes
- Integration documentation at `/widget-integration`
- Test page available at `/widget-test.html`
- Works with PioneerRx, Rx30, PrimeRx, ScriptPro, EnterpriseRx, and all major pharmacy systems

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component Library**: Shadcn/ui (built on Radix UI primitives) following Material Design 3 principles with healthcare theming

**Styling**: Tailwind CSS with custom design tokens defined in CSS variables for consistent theming across light/dark modes

**State Management**: TanStack Query (React Query) for server state management and data fetching

**Routing**: Wouter for lightweight client-side routing with five main routes:
- `/` - Landing page with hero section and feature overview
- `/batch` - Batch Upload validation for CSV/Excel files
- `/widget-demo` - Real-Time validation demo
- `/widget-integration` - Healthcare widget documentation and integration guide (EHR & Pharmacy systems)
- `/pricing` - Pricing and plan information

**Static Assets**: Public directory serves the embeddable widget:
- `/phone-validator-widget.js` - Standalone JavaScript widget file
- `/widget-test.html` - Live test page demonstrating widget functionality

**Key Design Decisions**:
- Component-based architecture with reusable UI components in `client/src/components/ui/`
- Custom components for domain-specific functionality (FileUpload, ValidationResults, LoadingState, Navigation)
- Type-safe props using TypeScript interfaces
- Responsive design with mobile-first approach using Tailwind breakpoints
- Toast notifications for user feedback
- Global navigation bar for easy access to all features

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**File Processing**: 
- Multer for handling multipart/form-data file uploads (in-memory storage)
- Papa Parse for CSV parsing
- XLSX library for Excel file processing

**API Design**: RESTful API with two main validation endpoints:
- `POST /api/validate` - Batch validation via file upload (CSV/Excel)
- `POST /api/validate-realtime` - Real-time validation of single phone numbers (CORS-enabled)

**CORS Configuration**: The `/api/validate-realtime` endpoint includes CORS headers to allow cross-origin requests from external healthcare systems:
- `Access-Control-Allow-Origin: *` - Allows requests from any domain
- Handles OPTIONS preflight requests for browser compatibility
- Enables the embeddable widget to work from any EHR or Pharmacy Management system

**Data Flow (Batch Validation)**:
1. File uploaded via multipart form data
2. File parsed based on type (CSV vs Excel)
3. Phone numbers extracted from phone column (or first column)
4. Each number validated against Veriphone API with rate limiting
5. Results aggregated and returned as JSON

**Data Flow (Real-Time Validation)**:
1. Single phone number submitted via JSON request
2. Number validated against Veriphone API
3. Detailed response returned including formatted number, warnings, and carrier info
4. Can be integrated into forms for instant validation

**Error Handling**: Centralized error handling with appropriate HTTP status codes and descriptive error messages

### Database Architecture

**ORM**: Drizzle ORM configured for PostgreSQL (via `@neondatabase/serverless`)

**Current State**: Database schema is defined (`shared/schema.ts`) but the application currently operates statelessly without persistent storage - all validation results are computed on-demand

**Session Management**: Infrastructure exists for session storage (`connect-pg-simple`) but is not currently utilized

**Design Decision**: The application was designed to be stateless for simplicity, with the option to add persistent storage for validation history, user accounts, or API usage tracking in the future

### Widget Architecture

**Embeddable Widget**: Standalone JavaScript file (`public/phone-validator-widget.js`) that provides:
- Global `window.PhoneValidatorWidget` API
- Zero dependencies - works in any HTML page
- Self-contained CSS injection for inline validation UI
- Configurable validation modes (blur, typing)
- Batch validation support
- Rate limiting and debouncing built-in

**Widget API Methods**:
- `init(options)` - Initialize with API URL and configuration
- `validate(phone)` - Manually validate a single phone number
- `attach(selector, options)` - Auto-attach validation to input fields
- `validateBatch(phones, onProgress)` - Validate multiple numbers with progress callback

**Integration Pattern**: Healthcare systems (EHR and Pharmacy Management) include the widget via script tag, initialize with their API URL, and attach to existing phone input fields without modifying backend code. Compatible with all major pharmacy systems including PioneerRx, Rx30, PrimeRx, ScriptPro, EnterpriseRx, BestRx, Liberty Software, and others.

### External Dependencies

**Third-Party APIs**:
- **Veriphone API**: Core phone validation service that provides:
  - Phone number validity checking
  - Phone type identification (mobile/landline/VoIP)
  - Carrier information
  - SMS capability detection
  - API endpoint: `https://api.veriphone.io/v2/verify`
  - Authentication via API key in query parameters

**Database Services**:
- **Neon Database**: Serverless PostgreSQL provider (configured but not actively used)
- Connection via `@neondatabase/serverless` driver
- Database URL expected in `DATABASE_URL` environment variable

**Build & Development Tools**:
- **Vite**: Frontend build tool and development server with HMR
- **Replit-specific plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment
- **ESBuild**: Server-side bundling for production deployment

**UI Dependencies**:
- **Radix UI**: Headless UI component primitives (40+ component packages)
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management with Zod validation
- **date-fns**: Date manipulation and formatting

**Design Rationale**:
- Veriphone API chosen for comprehensive validation including SMS capability detection
- Neon Database selected for serverless PostgreSQL with auto-scaling
- Shadcn/ui chosen for accessible, customizable components that match Material Design 3 guidelines
- In-memory file processing avoids filesystem dependencies for serverless deployment compatibility