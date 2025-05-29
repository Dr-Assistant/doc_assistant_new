const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');
const {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateRandomPassword
} = require('../../src/utils/password');
const { ValidationError } = require('../../src/utils/error-handler');

describe('Password Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      // Mock data
      const password = 'Password123!';
      const salt = 'mock-salt';
      const hashedPassword = 'hashed-password';

      // Mock implementation
      bcrypt.genSalt.mockResolvedValue(salt);
      bcrypt.hash.mockResolvedValue(hashedPassword);

      // Execute
      const result = await hashPassword(password);

      // Assert
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, salt);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      // Mock data
      const password = 'Password123!';
      const hash = 'hashed-password';

      // Mock implementation
      bcrypt.compare.mockResolvedValue(true);

      // Execute
      const result = await comparePassword(password, hash);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      // Mock data
      const password = 'WrongPassword';
      const hash = 'hashed-password';

      // Mock implementation
      bcrypt.compare.mockResolvedValue(false);

      // Execute
      const result = await comparePassword(password, hash);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate a strong password', () => {
      // Mock data
      const password = 'StrongPassword123!';
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
      };

      // Mock implementation
      zxcvbn.mockReturnValue({
        score: 4,
        feedback: {
          warning: '',
          suggestions: [],
        },
      });

      // Execute
      const result = validatePasswordStrength(password, userData);

      // Assert
      expect(zxcvbn).toHaveBeenCalledWith(password, expect.arrayContaining([
        userData.username,
        userData.email,
        userData.full_name,
      ]));
      expect(result).toEqual({
        score: 4,
        feedback: {
          warning: '',
          suggestions: [],
        },
      });
    });

    it('should throw an error for short password', () => {
      // Mock data
      const password = 'Short1!';

      // Execute and assert
      expect(() => validatePasswordStrength(password)).toThrow('Password must be at least 12 characters long');
      expect(zxcvbn).not.toHaveBeenCalled();
    });

    it('should throw an error for password without uppercase letter', () => {
      // Mock data
      const password = 'password123!';

      // Execute and assert
      expect(() => validatePasswordStrength(password)).toThrow('Password must contain at least one uppercase letter');
      expect(zxcvbn).not.toHaveBeenCalled();
    });

    it('should throw an error for password without lowercase letter', () => {
      // Mock data
      const password = 'PASSWORD123!';

      // Execute and assert
      expect(() => validatePasswordStrength(password)).toThrow('Password must contain at least one lowercase letter');
      expect(zxcvbn).not.toHaveBeenCalled();
    });

    it('should throw an error for password without number', () => {
      // Mock data
      const password = 'PasswordTest!';

      // Execute and assert
      expect(() => validatePasswordStrength(password)).toThrow('Password must contain at least one number');
      expect(zxcvbn).not.toHaveBeenCalled();
    });

    it('should throw an error for password without special character', () => {
      // Mock data
      const password = 'Password123Password'; // Make sure it's long enough

      // Execute and assert
      expect(() => validatePasswordStrength(password)).toThrow('Password must contain at least one special character');
      expect(zxcvbn).not.toHaveBeenCalled();
    });

    it('should throw an error for weak password', () => {
      // Mock data
      const password = 'Password123!';
      const userData = {
        username: 'testuser',
      };

      // Mock implementation
      zxcvbn.mockReturnValue({
        score: 2,
        feedback: {
          warning: 'This is a common password',
          suggestions: ['Add more words', 'Use a longer keyboard pattern'],
        },
      });

      // Execute and assert
      expect(() => validatePasswordStrength(password, userData)).toThrow(
        'Password is too weak. This is a common password. Add more words. Use a longer keyboard pattern'
      );
      expect(zxcvbn).toHaveBeenCalledWith(password, expect.arrayContaining([userData.username]));
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate a random password with required characteristics', () => {
      // Execute
      const password = generateRandomPassword();

      // Assert
      expect(password.length).toBe(16);
      expect(password).toMatch(/[A-Z]/); // Has uppercase
      expect(password).toMatch(/[a-z]/); // Has lowercase
      expect(password).toMatch(/[0-9]/); // Has number
      expect(password).toMatch(/[^A-Za-z0-9]/); // Has special character
    });
  });
});
