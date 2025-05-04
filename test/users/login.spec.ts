import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';
import bcrypt from 'bcrypt';
import { isJwt } from '../utils';

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
      const users = await userRepository.find();
      expect(response.statusCode).toBe(200);
      expect(users).toHaveLength(1);
    });

    it('should return a valid json respone', async () => {
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
      expect(
        (response.headers as Record<string, string>)['content-type']
      ).toEqual(expect.stringContaining('json'));
    });

    it('should return an id of loggedIn User', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'Negi',
        email: 'anuj.negi@mern.space',
        password: 'password'
      };

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userRepository = connection.getRepository(User);
      const user = await userRepository.save({
        ...userData,
        password: hashedPassword,
        role: Roles.CUSTOMER
      });
      const response = await request(app)
        .post('/auth/login')
        .send({ email: userData.email, password: userData.password });
      expect((response.body as Record<string, string>).id).toBe(user.id);
    });

    it('should return access and refresh token inside a cookie', async () => {
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
      let accessToken: null | string = null;
      let refreshToken: null | string = null;
      interface Headers {
        ['set-cookie']: string[];
      }
      const cookies =
        (response.headers as unknown as Headers)['set-cookie'] || [];
      cookies.forEach((cookie: string) => {
        if (cookie.startsWith('accessToken=')) {
          accessToken = cookie.split(';')[0].split('=')[1];
        }
        if (cookie.startsWith('refreshToken=')) {
          refreshToken = cookie.split(';')[0].split('=')[1];
        }
      });
      expect(accessToken).not.toBeNull();
      expect(refreshToken).not.toBeNull();

      expect(isJwt(accessToken)).toBeTruthy();
      expect(isJwt(refreshToken)).toBeTruthy();
    });

    it('should return the 400 if email or password is wrong', async () => {
      // Arrange
      const userData = {
        firstname: 'Anuj',
        lastname: ' n egi',
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

      // Act
      const response = await request(app)
        .post('/auth/login')
        .send({ email: userData.email, password: 'wrongPassword' });

      // Assert
      expect(response.statusCode).toBe(400);
    });
  });

  describe('Fields are missing', () => {
    it('should return 400 status code if email field is missing', async () => {
      const userData = {
        email: '',
        password: 'password'
      };
      const respone = await request(app).post('/auth/login').send(userData);
      expect(respone.statusCode).toBe(400);
    });

    it('should return 400 status code if password field is missing', async () => {
      const userData = {
        email: 'anuj.negi@merspace.com',
        password: ''
      };
      const respone = await request(app).post('/auth/login').send(userData);
      expect(respone.statusCode).toBe(400);
    });
  });
});
