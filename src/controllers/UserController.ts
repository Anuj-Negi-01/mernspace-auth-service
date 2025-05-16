import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { CreateUserRequest } from '../types';
import { Roles } from '../constants';
import { Logger } from 'winston';
import createHttpError from 'http-errors';

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

  async getOne(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.id;
    if (isNaN(Number(userId))) {
      const error = createHttpError(400, 'Invalid url params');
      next(error);
      return;
    }
    try {
      const user = await this.userService.findById(Number(userId));
      if (!user) {
        const error = createHttpError(404, 'User not found!');
        next(error);
        return;
      }
      this.logger.info('User fetched successfully', { id: user.id });
      res.status(200).json(user);
    } catch (error) {
      next(error);
      return;
    }
  }

  async update(req: CreateUserRequest, res: Response, next: NextFunction) {
    const { firstname, lastname, role } = req.body;
    const userId = req.params.id;
    if (isNaN(Number(userId))) {
      const error = createHttpError(400, 'Invalid url params');
      next(error);
      return;
    }
    this.logger.debug('Request for updating a user', req.body);
    try {
      const updateResult = await this.userService.update(Number(userId), {
        firstname,
        lastname,
        role
      });
      if (updateResult.affected === 0) {
        const error = createHttpError(404, 'Id does not exists');
        next(error);
      }
      res.status(200).json({
        id: Number(userId)
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}
