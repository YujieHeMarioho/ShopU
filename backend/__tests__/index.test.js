import request from 'supertest';
import { app } from '../index.js'; 

describe('Express App', () => {
  test('GET / responds with hello message', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Hello from backend! V1');
  });

});