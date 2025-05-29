/**
 * Base Repository Tests
 */

const { BaseRepository } = require('../../src/repositories/base.repository');
const { pgPool } = require('../../src/config/database');

// Mock the pgPool
jest.mock('../../src/config/database', () => ({
  pgPool: {
    query: jest.fn(),
    connect: jest.fn()
  },
  getPgClient: jest.fn()
}));

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('BaseRepository', () => {
  let repository;
  
  beforeEach(() => {
    // Create a new repository instance for each test
    repository = new BaseRepository('test_table');
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('executeQuery', () => {
    it('should execute a query using the pool', async () => {
      // Mock the query result
      const mockResult = { rows: [{ id: 1, name: 'Test' }] };
      pgPool.query.mockResolvedValue(mockResult);
      
      // Execute the query
      const result = await repository.executeQuery('SELECT * FROM test_table');
      
      // Verify the result
      expect(result).toBe(mockResult);
      
      // Verify that pgPool.query was called with the correct arguments
      expect(pgPool.query).toHaveBeenCalledWith('SELECT * FROM test_table', []);
    });
    
    it('should execute a query with parameters', async () => {
      // Mock the query result
      const mockResult = { rows: [{ id: 1, name: 'Test' }] };
      pgPool.query.mockResolvedValue(mockResult);
      
      // Execute the query
      const result = await repository.executeQuery('SELECT * FROM test_table WHERE id = $1', [1]);
      
      // Verify the result
      expect(result).toBe(mockResult);
      
      // Verify that pgPool.query was called with the correct arguments
      expect(pgPool.query).toHaveBeenCalledWith('SELECT * FROM test_table WHERE id = $1', [1]);
    });
  });
  
  describe('findAll', () => {
    it('should find all records', async () => {
      // Mock the query result
      const mockResult = { rows: [{ id: 1, name: 'Test 1' }, { id: 2, name: 'Test 2' }] };
      pgPool.query.mockResolvedValue(mockResult);
      
      // Execute the query
      const result = await repository.findAll();
      
      // Verify the result
      expect(result).toEqual(mockResult.rows);
      
      // Verify that pgPool.query was called with the correct arguments
      expect(pgPool.query).toHaveBeenCalledWith('SELECT * FROM test_table', []);
    });
    
    it('should find all records with options', async () => {
      // Mock the query result
      const mockResult = { rows: [{ id: 1, name: 'Test 1' }] };
      pgPool.query.mockResolvedValue(mockResult);
      
      // Execute the query
      const result = await repository.findAll({
        fields: 'id, name',
        where: 'id = $1',
        params: [1],
        orderBy: 'name ASC',
        limit: 10,
        offset: 0
      });
      
      // Verify the result
      expect(result).toEqual(mockResult.rows);
      
      // Verify that pgPool.query was called with the correct arguments
      expect(pgPool.query).toHaveBeenCalledWith(
        'SELECT id, name FROM test_table WHERE id = $1 ORDER BY name ASC LIMIT 10 OFFSET 0',
        [1]
      );
    });
  });
  
  describe('findById', () => {
    it('should find a record by ID', async () => {
      // Mock the query result
      const mockResult = { rows: [{ id: 1, name: 'Test' }] };
      pgPool.query.mockResolvedValue(mockResult);
      
      // Execute the query
      const result = await repository.findById(1);
      
      // Verify the result
      expect(result).toEqual(mockResult.rows[0]);
      
      // Verify that pgPool.query was called with the correct arguments
      expect(pgPool.query).toHaveBeenCalledWith('SELECT * FROM test_table WHERE id = $1', [1]);
    });
    
    it('should return null if record not found', async () => {
      // Mock the query result
      const mockResult = { rows: [] };
      pgPool.query.mockResolvedValue(mockResult);
      
      // Execute the query
      const result = await repository.findById(1);
      
      // Verify the result
      expect(result).toBeNull();
      
      // Verify that pgPool.query was called with the correct arguments
      expect(pgPool.query).toHaveBeenCalledWith('SELECT * FROM test_table WHERE id = $1', [1]);
    });
  });
  
  describe('create', () => {
    it('should create a new record', async () => {
      // Mock the query result
      const mockResult = { rows: [{ id: 1, name: 'Test' }] };
      pgPool.query.mockResolvedValue(mockResult);
      
      // Execute the query
      const result = await repository.create({ name: 'Test' });
      
      // Verify the result
      expect(result).toEqual(mockResult.rows[0]);
      
      // Verify that pgPool.query was called with the correct arguments
      expect(pgPool.query).toHaveBeenCalledWith(
        'INSERT INTO test_table (name) VALUES ($1) RETURNING *',
        ['Test']
      );
    });
  });
  
  describe('update', () => {
    it('should update a record', async () => {
      // Mock the query result
      const mockResult = { rows: [{ id: 1, name: 'Updated Test' }] };
      pgPool.query.mockResolvedValue(mockResult);
      
      // Execute the query
      const result = await repository.update(1, { name: 'Updated Test' });
      
      // Verify the result
      expect(result).toEqual(mockResult.rows[0]);
      
      // Verify that pgPool.query was called with the correct arguments
      expect(pgPool.query).toHaveBeenCalledWith(
        'UPDATE test_table SET name = $1 WHERE id = $2 RETURNING *',
        ['Updated Test', 1]
      );
    });
  });
  
  describe('delete', () => {
    it('should delete a record', async () => {
      // Mock the query result
      const mockResult = { rowCount: 1 };
      pgPool.query.mockResolvedValue(mockResult);
      
      // Execute the query
      const result = await repository.delete(1);
      
      // Verify the result
      expect(result).toBe(true);
      
      // Verify that pgPool.query was called with the correct arguments
      expect(pgPool.query).toHaveBeenCalledWith('DELETE FROM test_table WHERE id = $1', [1]);
    });
    
    it('should return false if record not found', async () => {
      // Mock the query result
      const mockResult = { rowCount: 0 };
      pgPool.query.mockResolvedValue(mockResult);
      
      // Execute the query
      const result = await repository.delete(1);
      
      // Verify the result
      expect(result).toBe(false);
      
      // Verify that pgPool.query was called with the correct arguments
      expect(pgPool.query).toHaveBeenCalledWith('DELETE FROM test_table WHERE id = $1', [1]);
    });
  });
});
