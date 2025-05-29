/**
 * User Service
 * This module provides user management functionality
 */

const { Op } = require('sequelize');
const { User } = require('../models');
const { NotFoundError, ConflictError } = require('../utils/error-handler');

/**
 * Get all users
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Users
 */
exports.getAllUsers = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    role = null,
    status = null,
    search = null,
    sort = 'full_name',
    order = 'ASC'
  } = options;

  // Build where clause
  const where = {};

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where[Op.or] = [
      { full_name: { [Op.iLike]: `%${search}%` } },
      { username: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Calculate pagination
  const offset = (page - 1) * limit;

  // Get users
  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sort, order]],
    attributes: {
      exclude: ['preferences']
    }
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    users: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev
    }
  };
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} User
 */
exports.getUserById = async (id) => {
  const user = await User.findByPk(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
exports.createUser = async (userData) => {
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

  // Create user
  const user = await User.create(userData);

  return user;
};

/**
 * Update user
 * @param {string} id - User ID
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Updated user
 */
exports.updateUser = async (id, userData) => {
  const user = await User.findByPk(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if email or username is being changed and if it's already in use
  if (userData.email && userData.email !== user.email) {
    const existingEmail = await User.findOne({
      where: { email: userData.email }
    });

    if (existingEmail) {
      throw new ConflictError('Email already in use');
    }
  }

  if (userData.username && userData.username !== user.username) {
    const existingUsername = await User.findOne({
      where: { username: userData.username }
    });

    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }
  }

  // Update user
  await user.update(userData);

  return user;
};

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {Promise<boolean>} Success flag
 */
exports.deleteUser = async (id) => {
  const user = await User.findByPk(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  await user.destroy();

  return true;
};

/**
 * Update user preferences
 * @param {string} id - User ID
 * @param {Object} preferences - User preferences
 * @returns {Promise<Object>} Updated user
 */
exports.updateUserPreferences = async (id, preferences) => {
  const user = await User.findByPk(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Merge existing preferences with new preferences
  const updatedPreferences = {
    ...user.preferences,
    ...preferences
  };

  // Update user
  await user.update({ preferences: updatedPreferences });

  return user;
};

/**
 * Get user preferences
 * @param {string} id - User ID
 * @returns {Promise<Object>} User preferences
 */
exports.getUserPreferences = async (id) => {
  const user = await User.findByPk(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user.preferences || {};
};

/**
 * Create a new user (internal service-to-service method)
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
exports.createUserInternal = async (userData) => {
  // Check if user already exists
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [
        { id: userData.id },
        { email: userData.email },
        { username: userData.username }
      ]
    }
  });

  if (existingUser) {
    if (existingUser.id === userData.id) {
      // User already exists with same ID, just return it
      return existingUser;
    }
    throw new ConflictError(
      existingUser.email === userData.email
        ? 'Email already in use'
        : 'Username already taken'
    );
  }

  // Create user with provided ID (from auth service)
  const user = await User.create(userData);

  return user;
};
