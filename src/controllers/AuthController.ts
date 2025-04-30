import { Response } from 'express';
import { RegisterUserRequest } from '../types/index';
import { UserService } from '../services/UserService';

export class AuthController {
  constructor(private userService: UserService) {}

  async register(req: RegisterUserRequest, res: Response) {
    const { firstname, lastname, email, password } = req.body;
    await this.userService.create({ firstname, lastname, email, password });
    res.status(201).json();
  }
}
