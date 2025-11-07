# Patient Phone Validator - Healthcare

## Overview

This is a healthcare-focused phone validation application that allows users to upload CSV or Excel files containing phone numbers and validate them using the Veriphone API. The application identifies valid phone numbers, determines their type (mobile/landline), and flags which numbers can receive SMS messages. Built as a full-stack web application with a React frontend and Express backend, it provides an intuitive interface for bulk phone number validation with detailed reporting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component Library**: Shadcn/ui (built on Radix UI primitives) following Material Design 3 principles with healthcare theming

**Styling**: Tailwind CSS with custom design tokens defined in CSS variables for consistent theming across light/dark modes

**State Management**: TanStack Query (React Query) for server state management and data fetching

**Routing**: Wouter for lightweight client-side routing

**Key Design Decisions**:
- Component-based architecture with reusable UI components in `client/src/components/ui/`
- Custom components for domain-specific functionality (FileUpload, ValidationResults, LoadingState)
- Type-safe props using TypeScript interfaces
- Responsive design with mobile-first approach using Tailwind breakpoints
- Toast notifications for user feedback

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**File Processing**: 
- Multer for handling multipart/form-data file uploads (in-memory storage)
- Papa Parse for CSV parsing
- XLSX library for Excel file processing

**API Design**: RESTful API with a single validation endpoint (`POST /api/validate`) that accepts file uploads and returns validation results

**Data Flow**:
1. File uploaded via multipart form data
2. File parsed based on type (CSV vs Excel)
3. Phone numbers extracted from first column
4. Each number validated against Veriphone API
5. Results aggregated and returned as JSON

**Error Handling**: Centralized error handling with appropriate HTTP status codes and descriptive error messages

### Database Architecture

**ORM**: Drizzle ORM configured for PostgreSQL (via `@neondatabase/serverless`)

**Current State**: Database schema is defined (`shared/schema.ts`) but the application currently operates statelessly without persistent storage - all validation results are computed on-demand

**Session Management**: Infrastructure exists for session storage (`connect-pg-simple`) but is not currently utilized

**Design Decision**: The application was designed to be stateless for simplicity, with the option to add persistent storage for validation history, user accounts, or API usage tracking in the future

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