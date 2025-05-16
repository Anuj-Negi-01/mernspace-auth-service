import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { CreateUserRequest } from '../types';
import { Roles } from '../constants';
import { Logger } from 'winston';

export class UserController {
  constructor(
    private userService: UserService,
    private logger: Logger
  ) {}

  async create(req: CreateUserRequest, res: Response, next: NextFunction) {
    const { firstname, lastname, email, password } = req.body;
    try {
      const user = await this.userService.create({
        firstname,
        lastname,
        email,
        password,
        role: Roles.MANAGER
      });
      this.logger.info('New user has been created', { id: user.id });
      res.status(201).json({
        id: user.id
      });
    } catch (error) {
      next(error);
      return;
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await this.userService.getAll();
      this.logger.info('All users fetched successfully');
      res.status(200).json(users);
    } catch (error) {
      next(error);
      return;
    }
  }
}
