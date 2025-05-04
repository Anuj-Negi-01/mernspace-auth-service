import { NextFunction, Response } from 'express';
import { RegisterUserRequest } from '../types/index';
import { UserService } from '../services/UserService';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';
import { JwtPayload } from 'jsonwebtoken';
import { TokenService } from '../services/TokenService';
import createHttpError from 'http-errors';
import { CredentialService } from '../services/CredentialService';

export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger,
    private tokenService: TokenService,
    private credentailService: CredentialService
  ) {}

  async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
    const { firstname, lastname, email, password } = req.body;
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    this.logger.debug('New request to register a user', {
      firstname,
      lastname,
      email,
      password: '****'
    });
    try {
      const user = await this.userService.create({
        firstname,
        lastname,
        email,
        password
      });
      this.logger.info('User has been registered', { id: user.id });
      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role
      };
      const accessToken = this.tokenService.generateAccessToken(payload);
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);
      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: newRefreshToken.id
      });
      res.cookie('accessToken', accessToken, {
        domain: 'localhost',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60,
        httpOnly: true
      });
      res.cookie('refreshToken', refreshToken, {
        domain: 'localhost',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true
      });

      res.status(201).json({ id: user.id });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    const { email, password } = req.body;
    console.log('request body', req.body);
    this.logger.debug('New request to register a user', {
      email,
      password: '****'
    });
    try {
      const user = await this.userService.findByEmail(email);
      console.log(user);
      if (!user) {
        const error = createHttpError(400, 'Email or password does not match.');
        next(error);
        return;
      }
      console.log('User ka password', user.password);
      console.log('User ka password', password);
      const passwordMatch = await this.credentailService.comparePassword(
        password,
        user.password
      );
      if (!passwordMatch) {
        const error = createHttpError(400, 'Email or password does not match.');
        next(error);
        return;
      }
      console.log('Yahan tk aa rha h user', user);
      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role
      };

      const accessToken = this.tokenService.generateAccessToken(payload);

      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: newRefreshToken.id
      });

      res.cookie('accessToken', accessToken, {
        domain: 'localhost',
        sameSite: 'strict',
        httpOnly: true,
        maxAge: 1000 * 60 * 60
      });

      res.cookie('refreshToken', refreshToken, {
        domain: 'localhost',
        sameSite: 'strict',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 365
      });

      this.logger.info('User has been loggedIn', {
        id: user.id
      });

      res.status(200).json({ id: user.id });
    } catch (error) {
      next(error);
      return;
    }
  }
}
