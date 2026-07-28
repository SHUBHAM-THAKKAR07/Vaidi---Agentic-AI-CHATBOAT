#!/bin/bash
set -e

echo ""
echo " ╔══════════════════════════════════════╗"
echo " ║    Vaidi — Rural Health Companion    ║"
echo " ║    IBM Hackathon Demo                ║"
echo " ╚══════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check .env
if [ ! -f "server/.env" ]; then
    echo "[!] server/.env not found."
    echo "    Copy .env.example to server/.env and fill in your WatsonX credentials."
    exit 1
fi

# Install dependencies
if [ ! -d "server/node_modules" ]; then
    echo "[*] Installing server dependencies..."
    (cd server && npm install)
fi

if [ ! -d "client/node_modules" ]; then
    echo "[*] Installing client dependencies..."
    (cd client && npm install)
fi

# Start server in background
echo "[*] Starting backend server on port 5000..."
(cd server && node index.js) &
SERVER_PID=$!

# Wait for server
sleep 2

echo "[*] Starting frontend on http://localhost:5173"
echo ""
echo " Open your browser to: http://localhost:5173"
echo " Demo credentials:"
echo "   Patient:       9876543210 / demo1234"
echo "   Health Worker: 9000000001 / worker123"
echo ""
echo " Press Ctrl+C to stop."

# Start client
(cd client && npm run dev)

# Cleanup on exit
trap "kill $SERVER_PID 2>/dev/null" EXIT
