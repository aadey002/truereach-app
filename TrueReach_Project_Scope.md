# TrueReach — Project Scope Document

**Document Version:** 1.0  
**Date:** March 27, 2026  
**Classification:** Internal / Client-Shareable  

---

| Field | Detail |
|---|---|
| **Project Name** | TrueReach Phone Validation Platform |
| **Document Owner** | Implementation Team |
| **Status** | Production — Live at https://true-reach.app |

---

## Business Need

Federally Qualified Health Centers (FQHCs), community health organizations, and pharmacy networks maintain patient contact records that contain a significant proportion of invalid, disconnected, or mistyped phone numbers. Staff time is wasted on failed outreach attempts, appointment reminder calls that never connect, and manual data correction workflows. There is no lightweight, healthcare-purpose-built tool that validates phone numbers at the point of capture across the wide variety of EHR and pharmacy management systems in use across the industry — without requiring backend modifications to those systems.

---

## Project Objective

Deliver a production-ready phone validation platform that:

1. Validates phone numbers in bulk from existing patient data files (CSV and Excel) to clean historical records
2. Provides a real-time validation API that any system can call at the moment a phone number is entered
3. Delivers an embeddable JavaScript widget that drops into EHR, pharmacy management, and patient portal systems with two lines of code — no backend changes required
4. Enforces North American Numbering Plan (NANP) rules and provides intelligent correction suggestions to help staff resolve invalid entries rather than simply rejecting them

---

## In Scope

### Requirements Gathering
- Batch phone validation workflow for uploaded CSV and Excel files
- Real-time single phone validation API (`POST /api/validate-realtime`)
- Embeddable JavaScript widget compatible with all major EHR and pharmacy management systems
- NANP validation enforcement (area codes, exchange codes, N11 service codes, leading digit rules, zero-line detection)
- Smart correction suggestions: transposed digit detection, placeholder pattern recognition, NANP-specific guidance with confidence tier scoring (LOW / MEDIUM / HIGH)
- Duplicate detection with pre-validation summary and user choice to remove or retain duplicates
- Patient data pass-through: extraction and inclusion of patient name, ID, email, and date of birth from uploaded files — no modification, validation only applies to phone numbers
- Real-time progress tracking during batch validation (progress bar, count, percentage)
- Summary dashboard: valid count, invalid count, SMS-capable count
- Excel export with full validation results and optional correction suggestions column
- Developer documentation portal (Replit OAuth login + developer access code, password-protected)
- API reference, widget API reference, framework integration guides (Angular, React, Vue.js, JavaScript, HTML)
- Operational run book for client deployments
- Landing page with feature overview and pricing
- Widget integration documentation page
- Enterprise security: Helmet.js security headers, CORS origin allowlist, gzip/brotli compression, Morgan request logging, health check endpoint
- Rate limiting: 100 requests/15 min for real-time validation, 10 uploads/min for batch — PostgreSQL-backed for production cross-instance consistency
- Production deployment at https://true-reach.app with HTTPS, HSTS, and custom domain

### Testing and Deployment
- Production smoke test: all page status codes, security headers, compression ratio, CORS enforcement, rate limit verification, API functionality
- Cross-browser compatibility for widget across Chrome, Firefox, Safari, Edge
- Deployment to Replit production environment at true-reach.app
- Cloudflare CDN with TLS 1.2+ enforcement and DDoS protection

---

## Out of Scope

- Modifications to client EHR or pharmacy management system backends
- HIPAA Business Associate Agreement (BAA) execution — compliance guidance is provided; legal execution is client responsibility
- Mobile application (iOS or Android)
- SMS or OTP message sending functionality
- Patient record creation, storage, or management
- Integration with specific EHR APIs (Epic FHIR, Cerner, eClinicalWorks) beyond widget drop-in
- International phone number validation beyond NANP (US and Canada)
- User account management or self-service subscription portal
- Ongoing technical support beyond the agreed delivery period
- Automated regression test suite for client internal systems
- Managed environment configuration for client infrastructure (endpoint URLs in config files)

---

## Key Deliverables

| # | Deliverable | Description | Status |
|---|---|---|---|
| 1 | Working web application | Full-stack React / Express application at https://true-reach.app with all validation features | Delivered |
| 2 | Embeddable widget | Standalone JavaScript file (`/phone-validator-widget.js`) requiring no backend changes in client system | Delivered |
| 3 | Widget test page | Live test page (`/widget-test.html`) demonstrating widget functionality | Delivered |
| 4 | Developer documentation portal | Password-protected technical docs with API reference, widget API, framework guides, run book, and technical specs | Delivered |
| 5 | Client delivery run book | Step-by-step operational guidance for client QA, deployment validation, and troubleshooting | Delivered |
| 6 | HIPAA/HITRUST Compliance SRS/PRD | Audit-ready compliance document mapping HIPAA 164.308/310/312 and HITRUST CSF to TrueReach architecture with gap analysis | Delivered |
| 7 | Production smoke test results | Verified test results covering all pages, security headers, compression, CORS, rate limiting, and API responses | Delivered |

---

## Dependencies

| Dependency | Type | Owner | Risk |
|---|---|---|---|
| Veriphone API (`api.veriphone.io`) | External API | Idomoo Ltd | HIGH — single point of failure for all validation; no BAA currently executed |
| Replit hosting platform | Infrastructure | Replit Inc | HIGH — no HIPAA BAA available on standard plan; production PHI workload risk |
| Neon Serverless PostgreSQL | Database | Neon Inc | MEDIUM — rate limiting depends on database availability; fallback to in-memory on failure |
| Cloudflare CDN | TLS / CDN | Cloudflare Inc | MEDIUM — TLS termination and DDoS protection; BAA not executed |
| Client EHR / Pharmacy System | Integration target | Client IT team | MEDIUM — firewall rules must allow outbound HTTPS to true-reach.app |
| Client IT team access | Deployment | Client | MEDIUM — widget deployment requires access to modify HTML/JS in client system |

---

## Constraints

| Constraint | Detail |
|---|---|
| **Technology — No Backend Modification** | The widget integration must not require any changes to client EHR or pharmacy management system backends. All validation logic runs on TrueReach infrastructure. |
| **Technology — Browser Compatibility** | Widget must function in all browsers supported by the client healthcare system, including legacy versions used in clinical environments. |
| **Technology — Phone Scope** | Validation is limited to NANP numbers (US and Canada). International numbers beyond NANP are outside current scope. |
| **Compliance — PHI Handling** | Phone numbers are classified as PHI. The system is designed stateless (no PHI stored) but BAA gaps must be resolved before live patient data is processed at scale. See HIPAA/HITRUST Compliance SRS/PRD for full gap analysis. |
| **Hosting — Replit** | Current production deployment is on Replit infrastructure. HIPAA BAA for Replit is not confirmed on the current plan. Migration to BAA-covered infrastructure is required for full HIPAA compliance. |

---

## Acceptance Criteria

The following conditions must be verified before client handoff and go-live:

### Technical Acceptance
- All application pages return HTTP 200 in production smoke test (`/`, `/batch`, `/widget-demo`, `/widget-integration`, `/pricing`, `/health`, `/dev-docs`)
- Widget script (`/phone-validator-widget.js`) loads successfully over HTTPS
- Real-time validation API correctly validates a known valid number and rejects a known invalid number (e.g., 555 exchange)
- Batch upload processes a CSV file and returns results including valid count, invalid count, and SMS-capable count
- Rate limiting blocks requests at threshold (request 11 of 10/min limit returns HTTP 429 with `Retry-After` header)
- CORS correctly allows the widget endpoint from any origin and blocks non-allowed origins on other endpoints (HTTP 403)
- Security headers present in all responses: `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
- Response compression active: minimum 50% size reduction measured on landing page

### Widget Integration Acceptance (Client System)
- Widget loads without JavaScript console errors in client system browser
- Phone field validation triggers after configured debounce delay (300-500ms)
- Valid phone number displays positive feedback to user
- Invalid phone number displays negative feedback and (where required) blocks form submission
- No outbound network errors to `true-reach.app` endpoints in browser network tab

### Documentation Acceptance
- Developer documentation accessible after Replit login and developer access code
- All five tabs render correctly: API Reference, Widget, Frameworks, Run Book, Technical Specs
- Client delivery run book reviewed and approved by client representative
- Compliance SRS/PRD reviewed by client legal or compliance team

### Operational Acceptance
- Health check endpoint (`/health`) returns `{"status":"ok"}` with HTTP 200
- Application restarts cleanly after deployment without manual intervention
- Rate limit counters persist correctly across application restarts (PostgreSQL-backed)
