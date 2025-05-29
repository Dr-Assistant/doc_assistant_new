/**
 * ABDM Authentication Service Tests
 */

const axios = require('axios');
const { getAccessToken, createAbdmApiClient, testConnectivity } = require('../src/services/abdm-auth.service');
const { AbdmError } = require('../src/middleware/error.middleware');

// Mock axios
jest.mock('axios');

describe('ABDM Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('should return a valid access token', async () => {
      // Mock successful response
      axios.post.mockResolvedValueOnce({
        data: {
          accessToken: 'mock-token-123',
          expiresIn: 3600
        }
      });

      const token = await getAccessToken();
      
      expect(token).toBe('mock-token-123');
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          clientId: expect.any(String),
          clientSecret: expect.any(String)
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-CM-ID': 'sbx'
          })
        })
      );
    });

    it('should throw AbdmError when authentication fails', async () => {
      // Mock failed response
      axios.post.mockRejectedValueOnce(new Error('Authentication failed'));

      await expect(getAccessToken()).rejects.toThrow(AbdmError);
    });

    it('should throw AbdmError when response is missing token', async () => {
      // Mock response without token
      axios.post.mockResolvedValueOnce({
        data: { message: 'Success but no token' }
      });

      await expect(getAccessToken()).rejects.toThrow(AbdmError);
    });
  });

  describe('createAbdmApiClient', () => {
    it('should create an axios instance with auth headers', async () => {
      // Mock getAccessToken
      jest.spyOn(require('../src/services/abdm-auth.service'), 'getAccessToken')
        .mockResolvedValueOnce('mock-token-123');
      
      // Mock axios.create
      const mockAxiosInstance = {};
      axios.create.mockReturnValueOnce(mockAxiosInstance);

      const client = await createAbdmApiClient();
      
      expect(client).toBe(mockAxiosInstance);
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: expect.any(String),
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token-123',
            'Content-Type': 'application/json',
            'X-CM-ID': 'sbx',
            'X-Request-ID': expect.any(String)
          })
        })
      );
    });
  });

  describe('testConnectivity', () => {
    it('should return true when connection is successful', async () => {
      // Mock getAccessToken
      jest.spyOn(require('../src/services/abdm-auth.service'), 'getAccessToken')
        .mockResolvedValueOnce('mock-token-123');

      const result = await testConnectivity();
      
      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      // Mock getAccessToken to throw error
      jest.spyOn(require('../src/services/abdm-auth.service'), 'getAccessToken')
        .mockRejectedValueOnce(new Error('Connection failed'));

      const result = await testConnectivity();
      
      expect(result).toBe(false);
    });
  });
});
