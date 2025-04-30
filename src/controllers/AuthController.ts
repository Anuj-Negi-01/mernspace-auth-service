import { Response } from 'express';
import { RegisterUserRequest } from '../types/index';
import { UserService } from '../services/UserService';

export class AuthController {
  constructor(private userService: UserService) {}

  async register(req: RegisterUserRequest, res: Response) {
    const { firstname, lastname, email, password } = req.body;
    const user = await this.userService.create({
      firstname,
      lastname,
      email,
      password
    });
    console.log('User: ', user);
    res.status(201).json({ id: user.id });
  }
}
