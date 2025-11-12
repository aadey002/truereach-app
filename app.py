from flask import Flask, request, jsonify
import requests
import pandas as pd
import time

app = Flask(__name__)

# Your Veriphone API Key
VERIPHONE_API_KEY = "D1D21F3D6FB74E909A0045FB3CA33F1A"

# Store validation progress
validation_progress = {
    'current': 0,
    'total': 0,
    'status': 'idle',
    'results': []
}

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
        