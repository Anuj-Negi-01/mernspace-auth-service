import { NextFunction, Response } from 'express';
import { AuthRequest, RegisterUserRequest, UserData } from '../types/index';
import { UserService } from '../services/UserService';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';
import { JwtPayload } from 'jsonwebtoken';
import { TokenService } from '../services/TokenService';
import createHttpError from 'http-errors';
import { CredentialService } from '../services/CredentialService';
import { Roles } from '../constants';

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
        password,
        role: Roles.CUSTOMER
      });
      this.logger.info('User has been registered', { id: user.id });
      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role
      };
      const accessToken = this.tokenService.generateAccessToken(payload);
      const newRefreshToken = await this.tokenService.persistRefreshToken(
        user as UserData
      );
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
    this.logger.debug('New request to register a user', {
      email,
      password: '****'
    });
    try {
      const user = await this.userService.findByEmailAndPassword(email);
      if (!user) {
        const error = createHttpError(400, 'Email or password does not match.');
        next(error);
        return;
      }
      const passwordMatch = await this.credentailService.comparePassword(
        password,
        user.password
      );
      if (!passwordMatch) {
        const error = createHttpError(400, 'Email or password does not match.');
        next(error);
        return;
      }
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

  async self(req: AuthRequest, res: Response) {
    const user = await this.userService.findById(Number(req.auth.sub));
    res.status(200).json({ ...user, password: undefined });
  }

  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payload: JwtPayload = {
        sub: String(req.auth.sub),
        role: req.auth.role
      };
      const accessToken = this.tokenService.generateAccessToken(payload);
      this.logger.info('New access Token has been crated', {
        user: req.auth.sub
      });
      const user = await this.userService.findById(Number(req.auth.sub));
      if (!user) {
        const error = createHttpError(
          400,
          'User with the token could not found'
        );
        next(error);
        return;
      }
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);
      this.logger.info('new refresh token has been crated', {
        id: newRefreshToken,
        userId: req.auth.sub
      });
      await this.tokenService.deleteRefreshToken(Number(req.auth.id));
      this.logger.info('Token has been revoked', {
        id: req.auth.id
      });
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
      res.status(200).json({
        id: user.id
      });
    } catch (error) {
      next(error);
      return;
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await this.tokenService.deleteRefreshToken(Number(req.auth.id));
      this.logger.info('Refresh token has been deleted', {
        id: req.auth.id
      });
      this.logger.info('User has been logged out', {
        id: req.auth.sub
      });
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.status(200).json({});
    } catch (error) {
      next(error);
      return;
    }
  }
}
