/**
 * Logger Utility
 * This module provides a centralized logging mechanism for the user service
 */

const winston = require('winston');
const { format, transports } = winston;

// Load environment variables
require('dotenv').config();

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.colorize({ all: true }),
  format.printf((info) => {
    const { timestamp, level, message, ...args } = info;
    const service = 'user-service';
    
    // Format additional metadata
    const metadata = Object.keys(args).length
      ? JSON.stringify(args, null, 2)
      : '';
    
    return `${timestamp} [${service}] ${level}: ${message} ${metadata}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports: [
    // Console transport for all logs
    new transports.Console(),
    
    // File transport for error logs
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
        format.json()
      ),
    }),
    
    // File transport for all logs
    new transports.File({
      filename: 'logs/combined.log',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
        format.json()
      ),
    }),
  ],
});

// Export the logger
module.exports = {
  logger,
};
