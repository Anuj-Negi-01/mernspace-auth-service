import { NextFunction, Response } from 'express';
import { RegisterUserRequest } from '../types/index';
import { UserService } from '../services/UserService';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';

export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger
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
      res.status(201).json({ id: user.id });
    } catch (error) {
      next(error);
      return;
    }
  }
}
