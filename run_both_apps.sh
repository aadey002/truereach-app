#!/bin/bash

# Start Flask app in background on port 5001
echo "Starting Flask Demo App on port 5001..."
python flask_app.py &
FLASK_PID=$!

# Start the main JavaScript application on port 5000
echo "Starting TrueReach JavaScript App on port 5000..."
npm run dev

# When npm exits, kill the Flask app
kill $FLASK_PID 2>/dev/null
