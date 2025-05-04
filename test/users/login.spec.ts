import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';
import bcrypt from 'bcrypt';

describe('POST /auth/login', () => {
  let connection: DataSource;

  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterAll(async () => {
    await connection.destroy();
  });

  describe('Given all fields', () => {
    it('should return 200 status code', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'Negi',
        email: 'anuj.negi@mern.space',
        password: 'password'
      };

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userRepository = connection.getRepository(User);
      await userRepository.save({
        ...userData,
        password: hashedPassword,
        role: Roles.CUSTOMER
      });
      const response = await request(app)
        .post('/auth/login')
        .send({ email: userData.email, password: userData.password });
      console.log('response', response);
      const users = await userRepository.find();
      expect(response.statusCode).toBe(200);
      expect(users).toHaveLength(1);
    });
  });
});
