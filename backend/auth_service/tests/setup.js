// Mock modules
jest.mock('bcrypt', () => {
  return {
    genSalt: jest.fn().mockResolvedValue('mock-salt'),
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn().mockResolvedValue(true)
  };
});

jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
    verify: jest.fn().mockReturnValue({ sub: 'user-id', type: 'access' })
  };
});

jest.mock('speakeasy', () => {
  return {
    generateSecret: jest.fn().mockReturnValue({
      base32: 'ABCDEFGHIJKLMNOP',
      otpauth_url: 'otpauth://totp/Dr.%20Assistant%20(testuser)?secret=ABCDEFGHIJKLMNOP&issuer=Dr.%20Assistant'
    }),
    totp: {
      verify: jest.fn().mockReturnValue(true)
    }
  };
});

jest.mock('qrcode', () => {
  return {
    toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQRCodeData')
  };
});

jest.mock('uuid', () => {
  return {
    v4: jest.fn().mockReturnValue('mock-uuid')
  };
});

jest.mock('zxcvbn', () => {
  return jest.fn().mockReturnValue({
    score: 4,
    feedback: {
      warning: '',
      suggestions: []
    }
  });
});

// Mock crypto for tests
global.crypto = {
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock-random-bytes')
  })
};

// Mock sequelize models
jest.mock('../src/models', () => {
  const mockModel = {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    scope: jest.fn().mockReturnThis(),
    getUser: jest.fn(),
    addRole: jest.fn(),
    getRoles: jest.fn()
  };

  return {
    sequelize: {
      transaction: jest.fn(callback => callback()),
      close: jest.fn()
    },
    User: { ...mockModel },
    Role: { ...mockModel },
    Permission: { ...mockModel },
    RolePermission: { ...mockModel },
    UserRole: { ...mockModel },
    Token: { ...mockModel }
  };
});

// Mock logger
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Reset all mocks
jest.clearAllMocks();
