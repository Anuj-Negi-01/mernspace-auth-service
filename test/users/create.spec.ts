import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { Roles } from '../../src/constants';
import { User } from '../../src/entity/User';
import createJWKSMock from 'mock-jwks';

describe('POST /users', () => {
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;
  let adminToken: string;

  beforeAll(async () => {
    jwks = createJWKSMock('http://localhost:8080');
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    jwks.start();
    await connection.dropDatabase();
    await connection.synchronize();

    adminToken = jwks.token({
      sub: '1',
      role: Roles.ADMIN
    });
  });

  afterEach(() => jwks.stop());

  afterAll(async () => {
    await connection.destroy();
  });

  describe('Given all fields', () => {
    it('should persist the user in the database', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'Negi',
        email: 'anuj.negi@mern.space',
        password: 'password',
        tenantId: 1
      };
      await request(app)
        .post('/users')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe(userData.email);
    });

    it('should create a manager user', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'Negi',
        email: 'anuj.negi@mern.space',
        password: 'password',
        tenantId: 1
      };
      await request(app)
        .post('/users')
        .set('Cookie', [`accessToken=${adminToken}`])
        .send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(1);
      expect(users[0].role).toBe(Roles.MANAGER);
    });
  });
});
