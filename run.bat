@echo off
echo Starting SkyGuard-X Backend and Frontend...
start "SkyGuard-X API" cmd /k "cd apps\api && ..\..\.venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000"
start "SkyGuard-X Frontend" cmd /k "cd apps\web && npm run dev"
echo Both services started!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
