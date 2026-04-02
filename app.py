from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import pandas as pd
import time
import sqlite3
import os
from datetime import datetime
import phonenumbers

app = Flask(__name__)
CORS(app)  # Allow widget requests from any PMS domain

# Veriphone API Key — loaded from environment variable
VERIPHONE_API_KEY = os.environ.get("VERIPHONE_API_KEY", "")

# Store validation progress
validation_progress = {
    'current': 0,
    'total': 0,
    'status': 'idle',
    'results': []
}

# ── TrueReach Database ─────────────────────────────────────────────────────
DB_PATH = os.path.join(os.path.dirname(__file__), "truereach_logs.db")

def init_db():
    """Creates the logs table if it doesn't exist yet."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS validation_events (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            api_key         TEXT,
            org_id          TEXT,
            user_id         TEXT,
            event_type      TEXT,
            phone_last4     TEXT,
            reason          TEXT,
            carrier         TEXT,
            previous_status TEXT,
            page_url        TEXT,
            timestamp       TEXT,
            created_at      TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()
    print("TrueReach DB initialized")

init_db()


# ── POST /api/truereach/log ────────────────────────────────────────────────
@app.route("/api/truereach/log", methods=["POST"])
def log_event():
    """Receives validation events from the embedded widget."""
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "No data received"}), 400
        if not data.get("api_key"):
            return jsonify({"error": "Missing API key"}), 401

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO validation_events
                (api_key, org_id, user_id, event_type, phone_last4,
                 reason, carrier, previous_status, page_url, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("api_key"),
            data.get("org_id"),
            data.get("user_id"),
            data.get("event_type"),
            data.get("phone_last4"),
            data.get("reason"),
            data.get("carrier"),
            data.get("previous_status"),
            data.get("page_url"),
            data.get("timestamp", datetime.utcnow().isoformat()),
        ))
        conn.commit()
        conn.close()
        return jsonify({"status": "logged"}), 200
    except Exception as e:
        print(f"Logging error: {e}")
        return jsonify({"error": "Internal server error"}), 500


# ── GET /api/truereach/events ──────────────────────────────────────────────
@app.route("/api/truereach/events", methods=["GET"])
def get_events():
    """Returns logged events for the dashboard with optional filters."""
    try:
        org_id     = request.args.get("org_id")
        event_type = request.args.get("event_type")
        limit      = int(request.args.get("limit", 500))

        query  = "SELECT * FROM validation_events WHERE 1=1"
        params = []

        if org_id:
            query += " AND org_id = ?"
            params.append(org_id)
        if event_type:
            query += " AND event_type = ?"
            params.append(event_type)

        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify({"events": rows, "count": len(rows)}), 200
    except Exception as e:
        print(f"Events fetch error: {e}")
        return jsonify({"error": "Internal server error"}), 500


# ── GET /api/truereach/stats ───────────────────────────────────────────────
@app.route("/api/truereach/stats", methods=["GET"])
def get_stats():
    """Returns summary stats for the dashboard header cards."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        def count(event_type):
            cursor.execute(
                "SELECT COUNT(*) FROM validation_events WHERE event_type = ?",
                (event_type,)
            )
            return cursor.fetchone()[0]

        total    = cursor.execute("SELECT COUNT(*) FROM validation_events").fetchone()[0]
        invalid  = count("invalid_detected")
        valid_sms = count("valid_sms")
        landline = count("valid_landline")
        updated  = count("phone_updated")

        cursor.execute("""
            SELECT COUNT(*) FROM validation_events
            WHERE event_type = 'phone_updated' AND previous_status = 'invalid'
        """)
        fixes    = cursor.fetchone()[0]
        fix_rate = round((fixes / invalid * 100) if invalid > 0 else 0)

        conn.close()
        return jsonify({
            "total":          total,
            "invalid":        invalid,
            "valid_sms":      valid_sms,
            "valid_landline": landline,
            "updated":        updated,
            "fix_rate":       fix_rate,
        }), 200
    except Exception as e:
        print(f"Stats error: {e}")
        return jsonify({"error": "Internal server error"}), 500


# ── Serve widget JS ────────────────────────────────────────────────────────
@app.route("/widget/truereach-widget.js")
def serve_widget():
    """Serves the embeddable widget script to PMS customers."""
    widget_dir = os.path.join(os.path.dirname(__file__), "static", "widget")
    return send_from_directory(widget_dir, "truereach-widget.js",
                               mimetype="application/javascript")


def pre_validate(phone):
    try:
        parsed = phonenumbers.parse(phone, "US")

        if not phonenumbers.is_valid_number(parsed):
            return {"status": "invalid", "color": "red",
                    "reason": "invalid_format", "source": "local",
                    "carrier": None}

        num_type = phonenumbers.number_type(parsed)

        if num_type == phonenumbers.PhoneNumberType.TOLL_FREE:
            return {"status": "landline", "color": "blue",
                    "reason": "toll_free", "source": "local",
                    "carrier": "Toll-Free"}

        if num_type == phonenumbers.PhoneNumberType.PREMIUM_RATE:
            return {"status": "invalid", "color": "red",
                    "reason": "premium_rate", "source": "local",
                    "carrier": None}

        if num_type == phonenumbers.PhoneNumberType.VOICEMAIL:
            return {"status": "invalid", "color": "red",
                    "reason": "voicemail_number", "source": "local",
                    "carrier": None}

        e164 = phonenumbers.format_number(
            parsed, phonenumbers.PhoneNumberFormat.E164
        )
        return {"pass": True, "e164": e164}

    except phonenumbers.NumberParseException:
        return {"status": "invalid", "color": "red",
                "reason": "parse_error", "source": "local",
                "carrier": None}


@app.route('/api/validate', methods=['GET'])
def api_validate():
    phone = request.args.get('phone', '')
    if not phone:
        return jsonify({"error": "Phone number required"}), 400

    pre = pre_validate(phone)
    if "pass" not in pre:
        return jsonify(pre)
    phone = pre["e164"]

    # Use libphonenumber to determine number type locally
    try:
        parsed = phonenumbers.parse(phone, "US")
        num_type = phonenumbers.number_type(parsed)
    except Exception:
        num_type = None

    # Map libphonenumber types to line types
    MOBILE_TYPES = {
        phonenumbers.PhoneNumberType.MOBILE,
        phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE,
    }
    LANDLINE_TYPES = {
        phonenumbers.PhoneNumberType.FIXED_LINE,
        phonenumbers.PhoneNumberType.TOLL_FREE,
        phonenumbers.PhoneNumberType.PREMIUM_RATE,
        phonenumbers.PhoneNumberType.SHARED_COST,
        phonenumbers.PhoneNumberType.UAN,
    }

    try:
        response = requests.get(
            'https://api.veriphone.io/v2/verify',
            params={
                'phone': phone,
                'key': VERIPHONE_API_KEY,
                'default_country': 'US'
            },
            timeout=10
        )
        data = response.json()

        api_type = (data.get('phone_type') or 'unknown').lower()
        api_valid = data.get('phone_valid', False)

        # Determine SMS capability: trust libphonenumber type first,
        # fall back to Veriphone phone_type
        if num_type in LANDLINE_TYPES:
            is_sms = False
            line_type = 'fixed_line'
        elif num_type in MOBILE_TYPES:
            is_sms = True
            line_type = 'mobile'
        elif api_type == 'mobile':
            is_sms = True
            line_type = 'mobile'
        elif api_type in ('fixed_line', 'landline'):
            is_sms = False
            line_type = 'fixed_line'
        else:
            # VOIP or unknown — mark not SMS-capable to be safe
            is_sms = False
            line_type = api_type if api_type != 'unknown' else 'unknown'

        return jsonify({
            'valid': api_valid,
            'phone_type': line_type,
            'is_sms_capable': is_sms,
            'can_receive_sms': is_sms,
            'carrier': data.get('carrier', 'Unknown'),
            'line_type': line_type,
            'international_number': data.get('international_number', ''),
            'local_format': data.get('local_format', ''),
            'country_code': data.get('country_code', 'US'),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/')
def home():
    return '''
<!DOCTYPE html>
<html>
<head>
    <title>Phone Validator Pro</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        .header {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 { color: #667eea; font-size: 2.5em; margin-bottom: 10px; }
        .card {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .upload-area {
            border: 3px dashed #667eea;
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        .upload-area:hover { background: #f8f9ff; }
        input[type="file"] { display: none; }
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            margin: 5px;
            transition: all 0.3s;
        }
        .btn-primary { background: #667eea; color: white; }
        .btn-primary:hover { background: #764ba2; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .progress-container { display: none; margin-top: 20px; }
        .progress-bar-wrapper {
            background: #e2e8f0;
            border-radius: 10px;
            height: 30px;
            overflow: hidden;
            margin-bottom: 15px;
        }
        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            width: 0%;
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
        }
        .progress-text {
            text-align: center;
            color: #4a5568;
            font-size: 16px;
        }
        .results { display: none; margin-top: 20px; }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .summary-card {
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-card.valid { background: #c6f6d5; border: 2px solid #48bb78; }
        .summary-card.invalid { background: #fed7d7; border: 2px solid #f56565; }
        .summary-card.sms { background: #bee3f8; border: 2px solid #4299e1; }
        .summary-card h3 { font-size: 2em; margin-bottom: 5px; }
        .demo-badge {
            background: #fbbf24;
            color: #78350f;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Phone Validator Pro</h1>
            <p>Batch Upload & Validation</p>
            <span class="demo-badge">DEMO: First 50 numbers</span>
        </div>

        <div class="card">
            <div class="upload-area" onclick="document.getElementById('fileInput').click()">
                <div style="font-size: 4em; margin-bottom: 20px;">📂</div>
                <h3>Click to Upload CSV or Excel File</h3>
                <p style="margin-top: 15px; color: #666;">Demo validates first 50 numbers</p>
            </div>
            <input type="file" id="fileInput" accept=".csv,.xlsx,.xls">
            <button class="btn btn-primary" onclick="startValidation()" id="validateBtn" disabled>
                🚀 Start Validation
            </button>

            <div class="progress-container" id="progressContainer">
                <div class="progress-bar-wrapper">
                    <div class="progress-bar" id="progressBar">0%</div>
                </div>
                <div class="progress-text" id="progressText">Validating...</div>
            </div>
        </div>

        <div class="card results" id="results">
            <h2>📊 Results</h2>
            <div class="summary">
                <div class="summary-card valid">
                    <h3 id="validCount">0</h3>
                    <p>Valid</p>
                </div>
                <div class="summary-card invalid">
                    <h3 id="invalidCount">0</h3>
                    <p>Invalid</p>
                </div>
                <div class="summary-card sms">
                    <h3 id="smsCount">0</h3>
                    <p>SMS Capable</p>
                </div>
            </div>
            <div id="resultsList"></div>
            <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px;">
                🔄 New Validation
            </button>
        </div>
    </div>

    <script>
        let uploadedFile = null;

        document.getElementById('fileInput').addEventListener('change', function(e) {
            uploadedFile = e.target.files[0];
            if (uploadedFile) {
                document.getElementById('validateBtn').disabled = false;
            }
        });

        async function startValidation() {
            if (!uploadedFile) return;

            const formData = new FormData();
            formData.append('file', uploadedFile);

            document.getElementById('validateBtn').disabled = true;
            document.getElementById('progressContainer').style.display = 'block';

            fetch('/validate', {
                method: 'POST',
                body: formData
            }).then(response => response.json())
              .then(results => {
                displayResults(results);
                document.getElementById('progressContainer').style.display = 'none';
            });

            pollProgress();
        }

        function pollProgress() {
        