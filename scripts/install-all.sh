#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Installing dependencies for all services...${NC}"

# Install frontend dependencies
echo -e "${GREEN}Installing frontend web dependencies...${NC}"
if [ -d "frontend/web" ]; then
  cd frontend/web
  npm install
  cd ../..
  echo -e "${GREEN}Frontend web dependencies installed successfully.${NC}"
else
  echo -e "${RED}Frontend web directory not found. Skipping.${NC}"
fi

echo -e "${GREEN}Installing frontend mobile dependencies...${NC}"
if [ -d "frontend/mobile" ]; then
  cd frontend/mobile
  npm install
  cd ../..
  echo -e "${GREEN}Frontend mobile dependencies installed successfully.${NC}"
else
  echo -e "${RED}Frontend mobile directory not found. Skipping.${NC}"
fi

# Install backend dependencies
echo -e "${GREEN}Installing backend dependencies...${NC}"

# API Gateway
if [ -d "backend/api_gateway" ]; then
  cd backend/api_gateway
  npm install
  cd ../..
  echo -e "${GREEN}API Gateway dependencies installed successfully.${NC}"
else
  echo -e "${RED}API Gateway directory not found. Skipping.${NC}"
fi

# Auth Service
if [ -d "backend/auth_service" ]; then
  cd backend/auth_service
  npm install
  cd ../..
  echo -e "${GREEN}Auth Service dependencies installed successfully.${NC}"
else
  echo -e "${RED}Auth Service directory not found. Skipping.${NC}"
fi

# User Service
if [ -d "backend/user_service" ]; then
  cd backend/user_service
  npm install
  cd ../..
  echo -e "${GREEN}User Service dependencies installed successfully.${NC}"
else
  echo -e "${RED}User Service directory not found. Skipping.${NC}"
fi

# Patient Service
if [ -d "backend/patient_service" ]; then
  cd backend/patient_service
  npm install
  cd ../..
  echo -e "${GREEN}Patient Service dependencies installed successfully.${NC}"
else
  echo -e "${RED}Patient Service directory not found. Skipping.${NC}"
fi

# Schedule Service
if [ -d "backend/schedule_service" ]; then
  cd backend/schedule_service
  npm install
  cd ../..
  echo -e "${GREEN}Schedule Service dependencies installed successfully.${NC}"
else
  echo -e "${RED}Schedule Service directory not found. Skipping.${NC}"
fi

# Install AI services dependencies
echo -e "${GREEN}Installing AI services dependencies...${NC}"

# Voice Transcription Service
if [ -d "ai_services/voice_transcription" ]; then
  cd ai_services/voice_transcription
  if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
  fi
  cd ../..
  echo -e "${GREEN}Voice Transcription Service dependencies installed successfully.${NC}"
else
  echo -e "${RED}Voice Transcription Service directory not found. Skipping.${NC}"
fi

# Clinical Note Generation Service
if [ -d "ai_services/clinical_note_generation" ]; then
  cd ai_services/clinical_note_generation
  if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
  fi
  cd ../..
  echo -e "${GREEN}Clinical Note Generation Service dependencies installed successfully.${NC}"
else
  echo -e "${RED}Clinical Note Generation Service directory not found. Skipping.${NC}"
fi

# Install integration services dependencies
echo -e "${GREEN}Installing integration services dependencies...${NC}"

# ABDM Integration Service
if [ -d "integration_services/abdm_integration" ]; then
  cd integration_services/abdm_integration
  npm install
  cd ../..
  echo -e "${GREEN}ABDM Integration Service dependencies installed successfully.${NC}"
else
  echo -e "${RED}ABDM Integration Service directory not found. Skipping.${NC}"
fi

echo -e "${GREEN}All dependencies installed successfully!${NC}"
