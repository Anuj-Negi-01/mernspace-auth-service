import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { Roles } from '../../src/constants';
import { User } from '../../src/entity/User';
import createJWKSMock from 'mock-jwks';

describe('POST /auth/self', () => {
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;
  beforeAll(async () => {
    jwks = createJWKSMock('http://localhost:8080');
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    jwks.start();
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterEach(() => jwks.stop());

  afterAll(async () => {
    await connection.destroy();
  });

  describe('Given all fields', () => {
    it('should return 200 status code', async () => {
      const accessToken = jwks.token({
        sub: '1',
        role: Roles.CUSTOMER
      });
      const respone = await request(app)
        .get('/auth/self')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send();
      expect(respone.statusCode).toBe(200);
    });

    it('should return the user data', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'Negi',
        email: 'anuj.negi@mern.space',
        password: 'password'
      };

      const userRepository = connection.getRepository(User);
      const data = await userRepository.save({
        ...userData,
        role: Roles.CUSTOMER
      });
      const accessToken = jwks.token({
        sub: String(data.id),
        role: data.role
      });
      const response = await request(app)
        .get('/auth/self')
        .set('Cookie', [`accessToken=${accessToken}`]);
      expect((response.body as Record<string, string>).id).toBe(data.id);
    });

    it('should not return the password field', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'Negi',
        email: 'anuj.negi@mern.space',
        password: 'password'
      };

      const userRepository = connection.getRepository(User);
      const data = await userRepository.save({
        ...userData,
        role: Roles.CUSTOMER
      });
      const accessToken = jwks.token({
        sub: String(data.id),
        role: data.role
      });
      const response = await request(app)
        .get('/auth/self')
        .set('Cookie', [`accessToken=${accessToken}`]);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 staus code if accessToken is not there', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'Negi',
        email: 'anuj.negi@mern.space',
        password: 'password'
      };

      const userRepository = connection.getRepository(User);
      await userRepository.save({
        ...userData,
        role: Roles.CUSTOMER
      });
      const response = await request(app).get('/auth/self');
      expect(response.statusCode).toBe(401);
    });
  });
});
