import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { User } from '../../src/entity/User';
import { AppDataSource } from '../../src/config/data-source';
import { Roles } from '../../src/constants';
import { isJwt } from '../utils';
import { RefreshToken } from '../../src/entity/RefreshToken';

describe('POST /auth/register', () => {
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
    it('should return 201 status code', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'negi',
        email: 'anuj.negi@gmail.com',
        password: 'password'
      };
      const response = await request(app).post('/auth/register').send(userData);
      expect(response.statusCode).toBe(201);
    });
    it('should return vaild json response', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'negi',
        email: 'anuj.negi@gmail.com',
        password: 'password'
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
        password: 'password'
      };
      await request(app).post('/auth/register').send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(1);
      expect(users[0].firstname).toBe(userData.firstname);
      expect(users[0].lastname).toBe(userData.lastname);
      expect(users[0].email).toBe(userData.email);
    });

    it('should return and id of the created user', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'negi',
        email: 'anuj.negi@gmail.com',
        password: 'password'
      };
      const response = await request(app).post('/auth/register').send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect((response.body as Record<string, string>).id).toBe(users[0].id);
    });

    it('should assign a customer role', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'negi',
        email: 'anuj.negi@gmail.com',
        password: 'password'
      };
      await request(app).post('/auth/register').send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users[0]).toHaveProperty('role');
      expect(users[0].role).toBe(Roles.CUSTOMER);
    });

    it('should store the hashed password in the database', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'negi',
        email: 'anuj.negi@gmail.com',
        password: 'password'
      };
      await request(app).post('/auth/register').send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users[0].password).not.toBe(userData.password);
      expect(users[0].password).toHaveLength(60);
      expect(users[0].password).toMatch(/^\$2b\$\d+\$/);
    });

    it('should return 400 status code if email is already exists', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'negi',
        email: 'anuj.negi@gmail.com',
        password: 'password'
      };
      const userRepository = connection.getRepository(User);
      await userRepository.save({ ...userData, role: Roles.CUSTOMER });
      const response = await request(app).post('/auth/register').send(userData);
      const users = await userRepository.find();
      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });

    it('should return the access token and refresh token inside a cookie', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'negi',
        email: 'anuj.negi@gmail.com',
        password: 'password'
      };

      const response = await request(app).post('/auth/register').send(userData);

      interface Headers {
        ['set-cookie']: string[];
      }
      let accessToken: null | string = null;
      let refreshToken: null | string = null;
      const cookies =
        (response.headers as unknown as Headers)['set-cookie'] || [];

      cookies.forEach((cookie) => {
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

    it('should store the refresh token into database', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'negi',
        email: 'anuj.negi@gmail.com',
        password: 'password'
      };

      const respone = await request(app).post('/auth/register').send(userData);

      const refreshTokenRepo = connection.getRepository(RefreshToken);

      const tokens = await refreshTokenRepo
        .createQueryBuilder('refreshToken')
        .where('refreshToken.userId = :userId', {
          userId: (respone.body as Record<string, string>).id
        })
        .getMany();
      expect(tokens).toHaveLength(1);
    });
  });

  describe('Fields are missing', () => {
    it('should return 400 status code if email field is missing', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'Negi',
        email: '',
        password: 'password'
      };
      const respone = await request(app).post('/auth/register').send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(respone.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });

    it('should return 400 status code if firstname field is missing', async () => {
      const userData = {
        firstname: '',
        lastname: 'Negi',
        email: 'anuj.negi@gmail.com',
        password: 'password'
      };
      const respone = await request(app).post('/auth/register').send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(respone.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });

    it('should return 400 status code if lastname field is missing', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: '',
        email: 'anuj.negi@gmail.com',
        password: 'password'
      };
      const respone = await request(app).post('/auth/register').send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(respone.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });

    it('should return 400 status code if password field is missing', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'Negi',
        email: 'anuj.negi@gmail.com',
        password: ''
      };
      const respone = await request(app).post('/auth/register').send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(respone.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });
  });

  describe('Fields are not in proper format', () => {
    it('should trim the email fields', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'Negi',
        email: ' anuj.negi@gmail.com',
        password: 'password'
      };
      await request(app).post('/auth/register').send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      const user = users[0];
      expect(user.email).toBe('anuj.negi@gmail.com');
    });

    it('should return 400 status code if email is not valid email', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'Negi',
        email: 'anuj-negi',
        password: 'password'
      };
      const respone = await request(app).post('/auth/register').send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(respone.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });

    it('should return 400 status code if password is less than 8 chars', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'Negi',
        email: 'anuj.negi@gmail.com',
        password: 'pass'
      };
      const respone = await request(app).post('/auth/register').send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(respone.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });

    it('should return an array of error messages if email is missing', async () => {
      const userData = {
        firstname: 'Anuj',
        lastname: 'Negi',
        email: '',
        password: 'password'
      };
      const respone = await request(app).post('/auth/register').send(userData);
      expect(respone.body).toHaveProperty('errors');
      expect(
        (respone.body as Record<string, string>).errors.length
      ).toBeGreaterThan(0);
    });
  });
});
