/**
 * Logger Configuration
 * Centralized logging for the Encounter Service
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Add colors to winston
winston.addColors(logColors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define file format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
require('fs').mkdirSync(logsDir, { recursive: true });

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: fileFormat,
  transports,
  exitOnError: false
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'exceptions.log'),
    format: fileFormat
  })
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'rejections.log'),
    format: fileFormat
  })
);

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Add custom methods for structured logging
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id || 'anonymous'
  };
  
  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

logger.logError = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    ...context
  };
  
  logger.error('Application Error', errorData);
};

logger.logDatabaseOperation = (operation, table, duration, success = true) => {
  const logData = {
    operation,
    table,
    duration: `${duration}ms`,
    success
  };
  
  if (success) {
    logger.debug('Database Operation', logData);
  } else {
    logger.warn('Database Operation Failed', logData);
  }
};

logger.logServiceCall = (service, method, duration, success = true, statusCode = null) => {
  const logData = {
    service,
    method,
    duration: `${duration}ms`,
    success,
    statusCode
  };
  
  if (success) {
    logger.info('Service Call', logData);
  } else {
    logger.warn('Service Call Failed', logData);
  }
};

logger.logUserAction = (userId, action, resource, details = {}) => {
  const logData = {
    userId,
    action,
    resource,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  logger.info('User Action', logData);
};

logger.logSecurityEvent = (event, userId, ip, details = {}) => {
  const logData = {
    event,
    userId,
    ip,
    timestamp: new Date().toISOString(),
    severity: 'security',
    ...details
  };
  
  logger.warn('Security Event', logData);
};

logger.logPerformanceMetric = (metric, value, unit = 'ms', context = {}) => {
  const logData = {
    metric,
    value,
    unit,
    timestamp: new Date().toISOString(),
    ...context
  };
  
  logger.info('Performance Metric', logData);
};

// Environment-specific configuration
if (process.env.NODE_ENV === 'production') {
  // In production, reduce console logging
  logger.remove(winston.transports.Console);
  logger.add(new winston.transports.Console({
    level: 'warn',
    format: winston.format.simple()
  }));
} else if (process.env.NODE_ENV === 'test') {
  // In test environment, suppress most logging
  logger.transports.forEach((transport) => {
    transport.silent = true;
  });
}

module.exports = { logger };
