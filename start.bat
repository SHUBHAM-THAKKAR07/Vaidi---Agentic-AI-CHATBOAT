@echo off
echo.
echo  ╔══════════════════════════════════════╗
echo  ║    Vaidi — Rural Health Companion    ║
echo  ║    IBM Hackathon Demo                ║
echo  ╚══════════════════════════════════════╝
echo.

:: Check if .env exists in server
if not exist "server\.env" (
    echo [!] server/.env not found.
    echo     Copy .env.example to server/.env and fill in your WatsonX credentials.
    pause
    exit /b 1
)

:: Install server dependencies if needed
if not exist "server\node_modules" (
    echo [*] Installing server dependencies...
    cd server
    call npm install
    cd ..
)

:: Install client dependencies if needed
if not exist "client\node_modules" (
    echo [*] Installing client dependencies...
    cd client
    call npm install
    cd ..
)

:: Start server in background
echo [*] Starting backend server on port 5000...
start "Vaidi Server" cmd /k "cd server && node index.js"

:: Wait a moment for server to start
timeout /t 2 /nobreak > nul

:: Start client dev server
echo [*] Starting frontend on http://localhost:5173
echo.
echo  Open your browser to: http://localhost:5173
echo  Demo credentials:
echo    Patient:       9876543210 / demo1234
echo    Health Worker: 9000000001 / worker123
echo.
cd client && npm run dev
