#!/usr/bin/env node

/**
 * Dr. Assistant - Environment Setup Script
 * This script sets up environment files for all services
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function warning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function error(message) {
    log(`❌ ${message}`, 'red');
}

function info(message) {
    log(`ℹ️  ${message}`, 'cyan');
}

// Service directories that need .env files
const serviceDirectories = [
    'frontend/web',
    'backend/auth_service',
    'backend/user_service',
    'backend/patient_service',
    'backend/schedule_service',
    'backend/dashboard_service',
    'backend/task_service',
    'backend/voice_recording_service',
    'ai_services/clinical_note_generation',
    'ai_services/prescription_generation',
    'ai_services/pre_diagnosis_summary',
    'ai_services/voice_transcription',
    'integration_services/abdm_integration'
];

// Load main .env file
function loadMainEnv() {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        error('.env file not found in root directory');
        return null;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
    
    return envVars;
}

// Create .env file for a service
function createServiceEnv(serviceDir, mainEnv) {
    const servicePath = path.join(process.cwd(), serviceDir);
    const envExamplePath = path.join(servicePath, '.env.example');
    const envPath = path.join(servicePath, '.env');
    
    if (!fs.existsSync(servicePath)) {
        warning(`Service directory ${serviceDir} not found, skipping`);
        return;
    }
    
    // If .env already exists, skip
    if (fs.existsSync(envPath)) {
        info(`${serviceDir}/.env already exists, skipping`);
        return;
    }
    
    // If .env.example exists, use it as template
    if (fs.existsSync(envExamplePath)) {
        let envContent = fs.readFileSync(envExamplePath, 'utf8');
        
        // Replace placeholders with values from main .env
        Object.keys(mainEnv).forEach(key => {
            const placeholder = `\${${key}}`;
            if (envContent.includes(placeholder)) {
                envContent = envContent.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), mainEnv[key]);
            }
        });
        
        fs.writeFileSync(envPath, envContent);
        success(`Created ${serviceDir}/.env from .env.example`);
    } else {
        // Create basic .env with common variables
        const basicEnv = `# ${serviceDir} Environment Configuration
NODE_ENV=${mainEnv.NODE_ENV || 'development'}
PORT=${getServicePort(serviceDir, mainEnv)}

# Database Configuration
DB_HOST=${mainEnv.DB_HOST || 'localhost'}
DB_PORT=${mainEnv.DB_PORT || '5434'}
DB_NAME=${mainEnv.DB_NAME || 'dr_assistant'}
DB_USER=${mainEnv.DB_USER || 'postgres'}
DB_PASSWORD=${mainEnv.DB_PASSWORD || 'postgres'}

# MongoDB
MONGODB_URI=${mainEnv.MONGODB_URI || 'mongodb://localhost:27019/dr_assistant'}

# Redis
REDIS_HOST=${mainEnv.REDIS_HOST || 'localhost'}
REDIS_PORT=${mainEnv.REDIS_PORT || '6380'}
REDIS_URI=${mainEnv.REDIS_URI || 'redis://localhost:6380'}

# JWT
JWT_SECRET=${mainEnv.JWT_SECRET || 'your_jwt_secret_key_here_for_local_dev'}

# Service URLs
AUTH_SERVICE_URL=${mainEnv.AUTH_SERVICE_URL || 'http://localhost:8020'}
USER_SERVICE_URL=${mainEnv.USER_SERVICE_URL || 'http://localhost:8012'}
PATIENT_SERVICE_URL=${mainEnv.PATIENT_SERVICE_URL || 'http://localhost:8017'}
`;
        
        fs.writeFileSync(envPath, basicEnv);
        success(`Created basic ${serviceDir}/.env`);
    }
}

// Get service port from main env
function getServicePort(serviceDir, mainEnv) {
    const servicePortMap = {
        'backend/auth_service': mainEnv.AUTH_SERVICE_PORT || '8020',
        'backend/user_service': mainEnv.USER_SERVICE_PORT || '8012',
        'backend/patient_service': mainEnv.PATIENT_SERVICE_PORT || '8017',
        'backend/schedule_service': mainEnv.SCHEDULE_SERVICE_PORT || '8014',
        'backend/dashboard_service': mainEnv.DASHBOARD_SERVICE_PORT || '8015',
        'backend/task_service': mainEnv.TASK_SERVICE_PORT || '8016',
        'backend/voice_recording_service': mainEnv.VOICE_RECORDING_SERVICE_PORT || '8013',
        'ai_services/clinical_note_generation': mainEnv.CLINICAL_NOTE_SERVICE_PORT || '9002',
        'ai_services/prescription_generation': mainEnv.PRESCRIPTION_SERVICE_PORT || '9003',
        'ai_services/pre_diagnosis_summary': mainEnv.PRE_DIAGNOSIS_SERVICE_PORT || '9004',
        'ai_services/voice_transcription': mainEnv.VOICE_TRANSCRIPTION_SERVICE_PORT || '9001',
        'integration_services/abdm_integration': mainEnv.ABDM_INTEGRATION_PORT || '8101',
        'frontend/web': mainEnv.FRONTEND_WEB_PORT || '3001'
    };
    
    return servicePortMap[serviceDir] || '3000';
}

// Main execution
function main() {
    log('🔧 Setting up environment files for all services...', 'blue');
    
    // Load main environment variables
    const mainEnv = loadMainEnv();
    if (!mainEnv) {
        error('Failed to load main .env file');
        process.exit(1);
    }
    
    success('Loaded main .env file');
    
    // Create .env files for each service
    serviceDirectories.forEach(serviceDir => {
        createServiceEnv(serviceDir, mainEnv);
    });
    
    log('\n🎉 Environment setup completed!', 'green');
    info('All services now have their .env files configured');
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { main };
