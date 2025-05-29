const { Op } = require('sequelize');
const axios = require('axios');
const { logger } = require('../utils/logger');
const { User, Role, Permission, Token } = require('../models');
const {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeAllUserTokens,
  revokeRefreshToken,
  verifyToken
} = require('../utils/jwt');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { generateTOTPSecret, generateTOTPQRCode, verifyTOTP, generateBackupCodes, verifyBackupCode } = require('../utils/mfa');
const {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError
} = require('../utils/error-handler');

/**
 * Helper function to parse ms from string like '7d', '15m', etc.
 * @param {string} str - Time string
 * @returns {number} Milliseconds
 */
function ms(str) {
  const match = str.match(/^(\d+)([smhdwy])$/);
  if (!match) return 0;

  const num = parseInt(match[1]);
  const type = match[2];

  switch (type) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    case 'w': return num * 7 * 24 * 60 * 60 * 1000;
    case 'y': return num * 365 * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

/**
 * Create user profile in User Service
 * @param {Object} user - User object from auth service
 * @returns {Promise<boolean>} Success status
 */
async function createUserProfile(user) {
  try {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8012';

    // Generate a service-to-service token for internal communication
    const serviceToken = generateToken(
      {
        sub: 'auth-service',
        type: 'service',
        permissions: ['user:create']
      },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    const response = await axios.post(
      `${userServiceUrl}/api/users/internal/create`,
      {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        specialty: user.specialty,
        phone: user.phone,
        status: 'active'
      },
      {
        headers: {
          'Authorization': `Bearer ${serviceToken}`,
          'Content-Type': 'application/json',
          'X-Service-Name': 'auth-service'
        },
        timeout: 5000
      }
    );

    logger.info(`User profile created in User Service for user: ${user.id}`);
    return true;
  } catch (error) {
    logger.error(`Failed to create user profile in User Service for user: ${user.id}`, {
      error: error.message,
      response: error.response?.data
    });
    // Don't throw error - we don't want to fail registration if user service is down
    return false;
  }
}

/**
 * Register a new user
 * @param {Object} userData - User data
 * @param {string} userData.username - User's username
 * @param {string} userData.email - User's email
 * @param {string} userData.full_name - User's full name
 * @param {string} userData.password - User's password
 * @param {string} [userData.role='doctor'] - User's role
 * @param {string} [userData.specialty] - User's specialty (for doctors)
 * @param {string} [userData.phone] - User's phone number
 * @returns {Object} User and tokens
 */
exports.registerUser = async (userData) => {
  logger.info(`Registering user: ${userData.email}`);

  // Validate password strength
  validatePasswordStrength(userData.password, userData);

  // Check if user already exists
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [
        { email: userData.email },
        { username: userData.username }
      ]
    }
  });

  if (existingUser) {
    throw new ConflictError(
      existingUser.email === userData.email
        ? 'Email already in use'
        : 'Username already taken'
    );
  }

  // Hash password
  const passwordHash = await hashPassword(userData.password);

  // Create user
  const user = await User.create({
    username: userData.username,
    email: userData.email,
    full_name: userData.full_name,
    password_hash: passwordHash,
    role: userData.role || 'doctor',
    specialty: userData.specialty,
    phone: userData.phone,
    status: 'active',
    password_changed_at: new Date()
  });

  // Assign default role
  const defaultRole = await Role.findOne({ where: { name: userData.role || 'doctor' } });
  if (defaultRole) {
    await user.addRole(defaultRole);
  }

  // Create user profile in User Service
  await createUserProfile(user);

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  // Return user and tokens
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      specialty: user.specialty,
      createdAt: user.createdAt,
    },
    tokens: {
      access: {
        token: accessToken,
        expires: new Date(Date.now() + ms(process.env.JWT_EXPIRES_IN || '15m'))
      },
      refresh: {
        token: refreshToken.token,
        expires: refreshToken.expires
      }
    }
  };
};

/**
 * Login a user
 * @param {string} username - User's username or email
 * @param {string} password - User's password
 * @param {Object} [options] - Login options
 * @param {string} [options.ipAddress] - IP address
 * @param {Object} [options.deviceInfo] - Device information
 * @returns {Object} User and tokens
 */
exports.loginUser = async (username, password, options = {}) => {
  logger.info(`Login attempt for: ${username}`);

  // Find user with password (using scope)
  const user = await User.scope('withPassword').findOne({
    where: {
      [Op.or]: [
        { email: username },
        { username: username }
      ]
    }
  });

  if (!user) {
    // Use a consistent error message to prevent username enumeration
    throw new AuthenticationError('Invalid credentials');
  }

  // Check if account is locked
  if (user.account_locked_until && user.account_locked_until > new Date()) {
    const waitTime = Math.ceil((user.account_locked_until - new Date()) / 1000 / 60);
    throw new AuthenticationError(`Account is temporarily locked. Please try again in ${waitTime} minutes.`);
  }

  // Check password
  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    // Increment failed login attempts
    user.failed_login_attempts += 1;

    // Lock account after 5 failed attempts
    if (user.failed_login_attempts >= 5) {
      user.account_locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      user.failed_login_attempts = 0;
      await user.save();
      throw new AuthenticationError('Too many failed login attempts. Account is temporarily locked for 15 minutes.');
    }

    await user.save();
    throw new AuthenticationError('Invalid credentials');
  }

  // Reset failed login attempts
  user.failed_login_attempts = 0;

  // Update last login timestamp
  user.last_login_at = new Date();
  await user.save();

  // Check if MFA is required
  if (user.mfa_enabled) {
    return {
      requireMFA: true,
      userId: user.id,
      tempToken: generateToken(
        { sub: user.id, type: 'mfa_required' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      )
    };
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(
    user,
    null,
    options.deviceInfo || {},
    options.ipAddress
  );

  // Get user roles and permissions
  const roles = await user.getRoles({
    include: [{
      model: Permission,
      as: 'permissions'
    }]
  });

  const permissions = roles.reduce((acc, role) => {
    role.permissions.forEach(permission => {
      acc.push(`${permission.resource}:${permission.action}`);
    });
    return acc;
  }, []);

  // Return user and tokens
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      specialty: user.specialty,
      roles: roles.map(role => role.name),
      permissions,
      createdAt: user.createdAt,
    },
    tokens: {
      access: {
        token: accessToken,
        expires: new Date(Date.now() + ms(process.env.JWT_EXPIRES_IN || '15m'))
      },
      refresh: {
        token: refreshToken.token,
        expires: refreshToken.expires
      }
    }
  };
};

/**
 * Verify MFA code
 * @param {string} userId - User ID
 * @param {string} code - MFA code
 * @param {Object} [options] - Options
 * @param {string} [options.ipAddress] - IP address
 * @param {Object} [options.deviceInfo] - Device information
 * @returns {Object} User and tokens
 */
exports.verifyMFA = async (userId, code, options = {}) => {
  logger.info(`Verifying MFA for user: ${userId}`);

  // Find user
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if MFA is enabled
  if (!user.mfa_enabled) {
    throw new ValidationError('MFA is not enabled for this user');
  }

  // Verify TOTP code
  const isValid = verifyTOTP(code, user.mfa_secret);

  // If TOTP is not valid, check backup codes
  let usedBackupCode = null;
  if (!isValid && user.mfa_backup_codes) {
    usedBackupCode = verifyBackupCode(code, user.mfa_backup_codes);

    if (usedBackupCode) {
      // Mark backup code as used
      const updatedBackupCodes = user.mfa_backup_codes.map(bc => {
        if (bc.code === usedBackupCode.code) {
          return { ...bc, used: true, used_at: new Date() };
        }
        return bc;
      });

      user.mfa_backup_codes = updatedBackupCodes;
      await user.save();
    }
  }

  if (!isValid && !usedBackupCode) {
    throw new AuthenticationError('Invalid MFA code');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(
    user,
    null,
    options.deviceInfo || {},
    options.ipAddress
  );

  // Get user roles and permissions
  const roles = await user.getRoles({
    include: [{
      model: Permission,
      as: 'permissions'
    }]
  });

  const permissions = roles.reduce((acc, role) => {
    role.permissions.forEach(permission => {
      acc.push(`${permission.resource}:${permission.action}`);
    });
    return acc;
  }, []);

  // Return user and tokens
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      specialty: user.specialty,
      roles: roles.map(role => role.name),
      permissions,
      createdAt: user.createdAt,
    },
    tokens: {
      access: {
        token: accessToken,
        expires: new Date(Date.now() + ms(process.env.JWT_EXPIRES_IN || '15m'))
      },
      refresh: {
        token: refreshToken.token,
        expires: refreshToken.expires
      }
    }
  };
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @param {Object} [options] - Options
 * @param {string} [options.ipAddress] - IP address
 * @param {Object} [options.deviceInfo] - Device information
 * @returns {Object} New tokens
 */
exports.refreshToken = async (refreshToken, options = {}) => {
  logger.info('Refreshing token');

  // Rotate refresh token (this will validate the token and generate a new one)
  const newRefreshToken = await rotateRefreshToken(
    refreshToken,
    options.deviceInfo || {},
    options.ipAddress
  );

  // Get user
  const tokenRecord = await Token.findOne({
    where: { token: newRefreshToken.token, type: 'refresh' }
  });

  const user = await User.findByPk(tokenRecord.userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Generate new access token
  const accessToken = generateAccessToken(user);

  return {
    tokens: {
      access: {
        token: accessToken,
        expires: new Date(Date.now() + ms(process.env.JWT_EXPIRES_IN || '15m'))
      },
      refresh: {
        token: newRefreshToken.token,
        expires: newRefreshToken.expires
      }
    }
  };
};

/**
 * Logout user
 * @param {string} refreshToken - Refresh token
 * @returns {boolean} Success
 */
exports.logout = async (refreshToken) => {
  logger.info('Logging out user');

  // Revoke refresh token
  const success = await revokeRefreshToken(refreshToken);

  return { success };
};

/**
 * Logout user from all devices
 * @param {string} userId - User ID
 * @returns {Object} Result
 */
exports.logoutAll = async (userId) => {
  logger.info(`Logging out user ${userId} from all devices`);

  // Revoke all refresh tokens for user
  const count = await revokeAllUserTokens(userId);

  return {
    success: true,
    message: `Logged out from ${count} devices`
  };
};

/**
 * Setup MFA for a user
 * @param {string} userId - User ID
 * @returns {Object} MFA setup data
 */
exports.setupMFA = async (userId) => {
  logger.info(`Setting up MFA for user: ${userId}`);

  // Find user
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Generate TOTP secret
  const secret = generateTOTPSecret(user.username);

  // Generate backup codes
  const backupCodes = generateBackupCodes().map(code => ({
    code,
    used: false,
    created_at: new Date()
  }));

  // Generate QR code
  const qrCode = await generateTOTPQRCode(secret);

  // Save secret and backup codes to user
  user.mfa_secret = secret.base32;
  user.mfa_backup_codes = backupCodes;
  await user.save();

  return {
    secret: secret.base32,
    qrCode,
    backupCodes: backupCodes.map(bc => bc.code)
  };
};

/**
 * Enable MFA for a user
 * @param {string} userId - User ID
 * @param {string} code - Verification code
 * @returns {Object} Result
 */
exports.enableMFA = async (userId, code) => {
  logger.info(`Enabling MFA for user: ${userId}`);

  // Find user
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if MFA is already enabled
  if (user.mfa_enabled) {
    throw new ValidationError('MFA is already enabled for this user');
  }

  // Verify TOTP code
  const isValid = verifyTOTP(code, user.mfa_secret);
  if (!isValid) {
    throw new ValidationError('Invalid verification code');
  }

  // Enable MFA
  user.mfa_enabled = true;
  await user.save();

  return {
    success: true,
    message: 'MFA enabled successfully'
  };
};

/**
 * Disable MFA for a user
 * @param {string} userId - User ID
 * @param {string} code - Verification code
 * @returns {Object} Result
 */
exports.disableMFA = async (userId, code) => {
  logger.info(`Disabling MFA for user: ${userId}`);

  // Find user
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if MFA is enabled
  if (!user.mfa_enabled) {
    throw new ValidationError('MFA is not enabled for this user');
  }

  // Verify TOTP code
  const isValid = verifyTOTP(code, user.mfa_secret);

  // If TOTP is not valid, check backup codes
  let usedBackupCode = null;
  if (!isValid && user.mfa_backup_codes) {
    usedBackupCode = verifyBackupCode(code, user.mfa_backup_codes);
  }

  if (!isValid && !usedBackupCode) {
    throw new ValidationError('Invalid verification code');
  }

  // Disable MFA
  user.mfa_enabled = false;
  user.mfa_secret = null;
  user.mfa_backup_codes = null;
  await user.save();

  return {
    success: true,
    message: 'MFA disabled successfully'
  };
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Object} User
 */
exports.getUserById = async (id) => {
  const user = await User.findByPk(id, {
    include: [{
      model: Role,
      as: 'roles',
      include: [{
        model: Permission,
        as: 'permissions'
      }]
    }]
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Format permissions
  const permissions = user.roles.reduce((acc, role) => {
    role.permissions.forEach(permission => {
      acc.push(`${permission.resource}:${permission.action}`);
    });
    return acc;
  }, []);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    specialty: user.specialty,
    phone: user.phone,
    profile_image_url: user.profile_image_url,
    status: user.status,
    mfa_enabled: user.mfa_enabled,
    last_login_at: user.last_login_at,
    roles: user.roles.map(role => role.name),
    permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};