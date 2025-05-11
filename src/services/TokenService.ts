import { JwtPayload, sign } from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import createHttpError from 'http-errors';
import { Config } from '../config';
import { Repository } from 'typeorm';
import { UserData } from '../types';
import { RefreshToken } from '../entity/RefreshToken';

export class TokenService {
  constructor(private refreshTokenRepository: Repository<RefreshToken>) {}
  generateAccessToken(payload: JwtPayload) {
    let privateKey: Buffer;
    try {
      privateKey = fs.readFileSync(
        path.join(__dirname, '../../certs/private.pem')
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      const error = createHttpError(500, 'Error while reading privateKey');
      throw error;
    }
    const accessToken = sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn: '1h',
      issuer: 'auth-service'
    });
    return accessToken;
  }

  generateRefreshToken(payload: JwtPayload) {
    const refreshToken = sign(payload, Config.REFERSH_TOKEN_SECRET!, {
      algorithm: 'HS256',
      expiresIn: '1y',
      issuer: 'auth-service',
      jwtid: String(payload.id)
    });
    return refreshToken;
  }

  async persistRefreshToken(user: UserData) {
    const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365;
    const newRefreshToken = await this.refreshTokenRepository.save({
      user,
      expiresAt: new Date(Date.now() + MS_IN_YEAR)
    });
    return newRefreshToken;
  }

  async deleteRefreshToken(tokenId: number) {
    await this.refreshTokenRepository.delete({
      id: tokenId
    });
  }
}
