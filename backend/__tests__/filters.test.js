import request from 'supertest';
import { app } from '../index.js';
import { pool } from '../pool.js';

describe('Filters API', () => {
  test('GET /api/filters should return categories', async () => {
    // Mock the database query
    jest.spyOn(pool, 'query').mockResolvedValueOnce({
      rows: [
        { name: 'Category 1' },
        { name: 'Category 2' },
        { name: 'Category 3' },
      ]
    });

    const response = await request(app).get('/api/filters');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('categories');
    expect(response.body.categories).toEqual(['Category 1', 'Category 2', 'Category 3']);

    // Restore the original implementation
    pool.query.mockRestore();
  });

  test('GET /api/filters should handle database errors', async () => {
    // Mock a database error
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get('/api/filters');

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty('error', 'Database error');

    // Restore the original implementation
    pool.query.mockRestore();
  });
});