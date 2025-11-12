# Flask Demo App - Phone Validator Pro 

This is the original Flask-based phone validator app saved alongside the new TrueReach JavaScript/React application.

## ⚡ Quick Start

### Option 1: Run Flask Demo Only (Port 5001)
```bash
python flask_app.py
```

Visit: `http://localhost:5001` or use the Webview on port 5001

### Option 2: Run Both Apps Simultaneously
```bash
./run_both_apps.sh
```

This starts:
- Flask Demo App on port 5001 (background)
- JavaScript App on port 5000 (main)

## 📊 What Each App Offers

### JavaScript Application (Port 5000) - **MAIN APP**
✅ **Currently Running** via "Start application" workflow

**Features:**
- Modern React UI with Material Design 3
- Healthcare-themed design targeting FQHCs
- Multiple validation modes:
  - Batch Upload (`/batch`)
  - Real-Time Validation (`/widget-demo`)
  - Widget Integration Guide (`/widget-integration`)
- Embeddable widget for EHR/Pharmacy Management systems
- Pricing page (`/pricing`)
- Professional landing page with conversion focus

### Flask Demo App (Port 5001) - **ORIGINAL DEMO**

**Features:**
- Single-page batch validation interface
- Purple gradient design (original styling)
- Validates first 50 phone numbers from CSV/Excel files
- Real-time progress bar with percentage
- Summary dashboard: Valid/Invalid/SMS-capable counts
- Detailed results table with carrier information

## 🔑 API Configuration

Both apps use the **VERIPHONE_API_KEY** environment variable.
- Configured in Replit Secrets
- Falls back to hardcoded demo key if not set

## 📁 Files

- `flask_app.py` - Original Flask application
- `run_both_apps.sh` - Convenience script to run both apps
- `FLASK_DEMO_README.md` - This file

## 🎯 Use Cases

**Use the JavaScript App (Port 5000) when:**
- Showcasing the full TrueReach platform
- Demonstrating the embeddable widget
- Presenting to healthcare organizations
- Production-ready deployment

**Use the Flask Demo (Port 5001) when:**
- Need a quick standalone validator
- Prefer simpler, single-page interface
- Want the original purple gradient design
- Testing batch validation only

## 🚀 Deployment Note

The JavaScript application (Port 5000) is the production-ready version designed for FQHCs. The Flask app is saved for reference and quick standalone demos.
