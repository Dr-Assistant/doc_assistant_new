/**
 * User Service Tests
 */

const { v4: uuidv4 } = require('uuid');
const userService = require('../../src/services/user.service');
const { User } = require('../../src/models');
const { NotFoundError, ConflictError } = require('../../src/utils/error-handler');

describe('User Service', () => {
  let testUserId;
  let testUser;

  beforeAll(async () => {
    // Clean up any existing test data
    await User.destroy({ where: { email: 'test@example.com' } });
  });

  beforeEach(async () => {
    // Create a test user for each test
    testUserId = uuidv4();
    testUser = {
      id: testUserId,
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'doctor',
      specialty: 'General Medicine',
      phone: '+1234567890',
      status: 'active'
    };
  });

  afterEach(async () => {
    // Clean up test data after each test
    try {
      await User.destroy({ where: { email: 'test@example.com' } });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    // Final cleanup
    await User.destroy({ where: { email: 'test@example.com' } });
  });

  describe('getAllUsers', () => {
    it('should return all users with pagination', async () => {
      // Create test user
      await User.create(testUser);

      // Execute
      const result = await userService.getAllUsers();

      // Assert
      expect(result.users).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBeGreaterThanOrEqual(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(Array.isArray(result.users)).toBe(true);

      // Check if our test user is in the results
      const foundUser = result.users.find(u => u.email === testUser.email);
      expect(foundUser).toBeDefined();
      expect(foundUser.username).toBe(testUser.username);
    });
  });

  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      // Create test user
      const createdUser = await User.create(testUser);

      // Execute
      const result = await userService.getUserById(createdUser.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(createdUser.id);
      expect(result.username).toBe(testUser.username);
      expect(result.email).toBe(testUser.email);
    });

    it('should throw NotFoundError if user not found', async () => {
      const nonExistentId = uuidv4();

      // Execute and assert
      await expect(userService.getUserById(nonExistentId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      // Execute
      const result = await userService.createUser(testUser);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(testUser.id);
      expect(result.username).toBe(testUser.username);
      expect(result.email).toBe(testUser.email);
      expect(result.full_name).toBe(testUser.full_name);
    });

    it('should throw ConflictError if email already exists', async () => {
      // Create a user first
      await User.create(testUser);

      // Try to create another user with same email
      const duplicateUser = {
        ...testUser,
        id: uuidv4(),
        username: 'differentusername'
      };

      // Execute and assert
      await expect(userService.createUser(duplicateUser)).rejects.toThrow(ConflictError);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      // Create test user
      const createdUser = await User.create(testUser);
      const updateData = { full_name: 'Updated User', specialty: 'Updated Specialty' };

      // Execute
      const result = await userService.updateUser(createdUser.id, updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(createdUser.id);
      expect(result.full_name).toBe(updateData.full_name);
      expect(result.specialty).toBe(updateData.specialty);
      expect(result.email).toBe(testUser.email); // Should remain unchanged
    });

    it('should throw NotFoundError if user not found', async () => {
      const nonExistentId = uuidv4();

      // Execute and assert
      await expect(userService.updateUser(nonExistentId, {})).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      // Create test user
      const createdUser = await User.create(testUser);

      // Execute
      const result = await userService.deleteUser(createdUser.id);

      // Assert
      expect(result).toBe(true);

      // Verify user is deleted
      const deletedUser = await User.findByPk(createdUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should throw NotFoundError if user not found', async () => {
      const nonExistentId = uuidv4();

      // Execute and assert
      await expect(userService.deleteUser(nonExistentId)).rejects.toThrow(NotFoundError);
    });
  });
});
