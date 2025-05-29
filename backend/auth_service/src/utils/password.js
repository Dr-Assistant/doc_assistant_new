const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');
const { ValidationError } = require('./error-handler');

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a password with a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches hash
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {Object} userData - User data for context (username, email, etc.)
 * @returns {Object} Validation result
 */
const validatePasswordStrength = (password, userData = {}) => {
  // Check length
  if (!password || password.length < 12) {
    throw new ValidationError('Password must be at least 12 characters long');
  }
  
  // Check complexity
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    throw new ValidationError('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    throw new ValidationError('Password must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new ValidationError('Password must contain at least one special character');
  }
  
  // Use zxcvbn for advanced password strength checking
  const userInputs = [];
  if (userData.username) userInputs.push(userData.username);
  if (userData.email) userInputs.push(userData.email);
  if (userData.full_name) {
    userInputs.push(userData.full_name);
    userData.full_name.split(/\s+/).forEach(name => userInputs.push(name));
  }
  
  const result = zxcvbn(password, userInputs);
  
  // Require a minimum score of 3 (0-4 scale, 4 being strongest)
  if (result.score < 3) {
    throw new ValidationError(
      'Password is too weak. ' + 
      (result.feedback.warning ? result.feedback.warning + '. ' : '') +
      (result.feedback.suggestions ? result.feedback.suggestions.join('. ') : '')
    );
  }
  
  return {
    score: result.score,
    feedback: result.feedback
  };
};

/**
 * Generate a secure random password
 * @returns {string} Random password
 */
const generateRandomPassword = () => {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
  let password = '';
  
  // Ensure at least one of each required character type
  password += getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  password += getRandomChar('abcdefghijklmnopqrstuvwxyz');
  password += getRandomChar('0123456789');
  password += getRandomChar('!@#$%^&*()-_=+');
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Get a random character from a charset
 * @param {string} charset - Character set to choose from
 * @returns {string} Random character
 */
const getRandomChar = (charset) => {
  return charset.charAt(Math.floor(Math.random() * charset.length));
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateRandomPassword
};
