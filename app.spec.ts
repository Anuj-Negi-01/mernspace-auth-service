import sum from './src/utlis';
import request from 'supertest';
import app from './src/app';

describe.skip('App', () => {
  it('should return a sum', () => {
    const result = sum(1, 2);
    expect(result).toBe(3);
  });

  it('should return 200 code', async () => {
    const respone = await request(app).get('/').send();
    expect(respone.statusCode).toBe(200);
  });
});
