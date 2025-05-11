import { DataSource } from 'typeorm';
import createJWKSMock from 'mock-jwks';
import request from 'supertest';
import app from '../../src/app';
import { Roles } from '../../src/constants';
import { RefreshToken } from '../../src/entity/RefreshToken';
import { User } from '../../src/entity/User';
import { AppDataSource } from '../../src/config/data-source';
import { sign } from 'jsonwebtoken';
import { Config } from '../../src/config';

describe('POST /auth/logout', () => {
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
    it('should clears both tokens', async () => {
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
      const payload = {
        sub: String(data.id),
        role: data.role
      };
      const accessToken = jwks.token(payload);
      const refreshTokenRepository = connection.getRepository(RefreshToken);
      const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365;
      const newRefreshToken = await refreshTokenRepository.save({
        data,
        expiresAt: new Date(Date.now() + MS_IN_YEAR)
      });
      const refreshToken = sign(
        { ...payload, id: newRefreshToken.id },
        Config.REFERSH_TOKEN_SECRET!,
        {
          algorithm: 'HS256',
          expiresIn: '1y',
          issuer: 'auth-service',
          jwtid: String(newRefreshToken.id)
        }
      );
      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', [
          `accessToken=${accessToken}`,
          `refreshToken=${refreshToken}`
        ]);
      const clearedCookies = response.header['set-cookie'];
      expect(response.status).toBe(200);
      expect(clearedCookies).toContainEqual(
        expect.stringContaining('accessToken=;')
      );
      expect(clearedCookies).toContainEqual(
        expect.stringContaining('refreshToken=;')
      );
    });

    it('should clears Refresh tokens in the database', async () => {
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
      const payload = {
        sub: String(data.id),
        role: data.role
      };
      const accessToken = jwks.token(payload);
      const refreshTokenRepository = connection.getRepository(RefreshToken);
      const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365;
      const newRefreshToken = await refreshTokenRepository.save({
        data,
        expiresAt: new Date(Date.now() + MS_IN_YEAR)
      });
      const refreshToken = sign(
        { ...payload, id: newRefreshToken.id },
        Config.REFERSH_TOKEN_SECRET!,
        {
          algorithm: 'HS256',
          expiresIn: '1y',
          issuer: 'auth-service',
          jwtid: String(newRefreshToken.id)
        }
      );
      await request(app)
        .post('/auth/logout')
        .set('Cookie', [
          `accessToken=${accessToken}`,
          `refreshToken=${refreshToken}`
        ]);
      const refreshTokens = await refreshTokenRepository.find();
      expect(refreshTokens).toHaveLength(0);
    });
  });
});
