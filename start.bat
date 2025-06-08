@echo off
REM Dr. Assistant - Docker Compose Startup Script for Windows
REM This script provides a simple way to start the application

echo [%date% %time%] Starting Dr. Assistant with Docker Compose...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo [WARNING] .env file not found. Creating from .env.example...
    copy .env.example .env >nul
    echo [SUCCESS] Created .env file. Please update it with your API keys if needed.
)

echo [%date% %time%] Starting all services...

REM Start all services
docker-compose up -d

echo.
echo [SUCCESS] All services are starting!
echo.
echo Service URLs:
echo   Frontend Web App:       http://localhost:3001
echo   API Gateway:            http://localhost:8000
echo   Auth Service:           http://localhost:8020
echo   User Service:           http://localhost:8012
echo   Voice Recording:        http://localhost:8013
echo   Schedule Service:       http://localhost:8014
echo   Dashboard Service:      http://localhost:8015
echo   Encounter Service:      http://localhost:8006
echo   Patient Service:        http://localhost:8017
echo   Task Service:           http://localhost:8016
echo   Clinical Notes:         http://localhost:9002
echo   Prescription Gen:       http://localhost:9003
echo   Pre-Diagnosis:          http://localhost:9004
echo   ABDM Integration:       http://localhost:8101
echo.
echo Databases:
echo   PostgreSQL:            localhost:5432
echo   MongoDB:               localhost:27017
echo   Redis:                 localhost:6379
echo.
echo Useful commands:
echo   View logs: npm run logs
echo   Stop services: npm run stop
echo   Check status: npm run status
echo.
echo [INFO] Services are starting up. Please wait a few moments for all services to be ready.
echo [INFO] You can monitor the startup progress with: npm run logs
echo.
pause
