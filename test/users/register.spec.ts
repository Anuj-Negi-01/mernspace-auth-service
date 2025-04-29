import request from 'supertest';
import app from '../../src/app';

describe('POST /auth/register', () => {
  describe('Given all fields', () => {
    it('should return 201 status code', async () => {
      const userData = {
        firstname: 'Anuj',
        lname: 'negi',
        email: 'anuj.negi@gmail.com',
        password: 'secret'
      };
      const response = await request(app).post('/auth/register').send(userData);
      expect(response.statusCode).toBe(201);
    });
    it('should return vaild json response', async () => {
      const userData = {
        firstname: 'Anuj',
        lname: 'negi',
        email: 'anuj.negi@gmail.com',
        password: 'secret'
      };
      const response = await request(app).post('/auth/register').send(userData);
      expect(
        (response.headers as Record<string, string>)['content-type']
      ).toEqual(expect.stringContaining('json'));
    });

    it('should persist the user in the database', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'negi',
        email: 'anuj.negi@gmail.com',
        password: 'secret'
      };
      await request(app).post('/auth/register').send(userData);
    });
  });
  describe('Fields are missing', () => {});
});
