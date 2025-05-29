#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building all services for production...${NC}"

# Build frontend
echo -e "${GREEN}Building frontend web...${NC}"
if [ -d "frontend/web" ]; then
  cd frontend/web
  npm run build
  cd ../..
  echo -e "${GREEN}Frontend web built successfully.${NC}"
else
  echo -e "${RED}Frontend web directory not found. Skipping.${NC}"
fi

echo -e "${GREEN}Building frontend mobile...${NC}"
if [ -d "frontend/mobile" ]; then
  cd frontend/mobile
  npm run build
  cd ../..
  echo -e "${GREEN}Frontend mobile built successfully.${NC}"
else
  echo -e "${RED}Frontend mobile directory not found. Skipping.${NC}"
fi

# Build backend services
echo -e "${GREEN}Building backend services...${NC}"

# API Gateway
if [ -d "backend/api_gateway" ]; then
  cd backend/api_gateway
  npm run build
  cd ../..
  echo -e "${GREEN}API Gateway built successfully.${NC}"
else
  echo -e "${RED}API Gateway directory not found. Skipping.${NC}"
fi

# Auth Service
if [ -d "backend/auth_service" ]; then
  cd backend/auth_service
  npm run build
  cd ../..
  echo -e "${GREEN}Auth Service built successfully.${NC}"
else
  echo -e "${RED}Auth Service directory not found. Skipping.${NC}"
fi

# User Service
if [ -d "backend/user_service" ]; then
  cd backend/user_service
  npm run build
  cd ../..
  echo -e "${GREEN}User Service built successfully.${NC}"
else
  echo -e "${RED}User Service directory not found. Skipping.${NC}"
fi

# Patient Service
if [ -d "backend/patient_service" ]; then
  cd backend/patient_service
  npm run build
  cd ../..
  echo -e "${GREEN}Patient Service built successfully.${NC}"
else
  echo -e "${RED}Patient Service directory not found. Skipping.${NC}"
fi

# Schedule Service
if [ -d "backend/schedule_service" ]; then
  cd backend/schedule_service
  npm run build
  cd ../..
  echo -e "${GREEN}Schedule Service built successfully.${NC}"
else
  echo -e "${RED}Schedule Service directory not found. Skipping.${NC}"
fi

# Build AI services
echo -e "${GREEN}Building AI services...${NC}"

# Voice Transcription Service
if [ -d "ai_services/voice_transcription" ]; then
  cd ai_services/voice_transcription
  # Python services typically don't need a build step
  cd ../..
  echo -e "${GREEN}Voice Transcription Service prepared for production.${NC}"
else
  echo -e "${RED}Voice Transcription Service directory not found. Skipping.${NC}"
fi

# Clinical Note Generation Service
if [ -d "ai_services/clinical_note_generation" ]; then
  cd ai_services/clinical_note_generation
  # Python services typically don't need a build step
  cd ../..
  echo -e "${GREEN}Clinical Note Generation Service prepared for production.${NC}"
else
  echo -e "${RED}Clinical Note Generation Service directory not found. Skipping.${NC}"
fi

# Build integration services
echo -e "${GREEN}Building integration services...${NC}"

# ABDM Integration Service
if [ -d "integration_services/abdm_integration" ]; then
  cd integration_services/abdm_integration
  npm run build
  cd ../..
  echo -e "${GREEN}ABDM Integration Service built successfully.${NC}"
else
  echo -e "${RED}ABDM Integration Service directory not found. Skipping.${NC}"
fi

echo -e "${GREEN}All services built successfully!${NC}"
