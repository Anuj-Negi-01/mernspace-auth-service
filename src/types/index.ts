import { Request } from 'express';

export interface UserData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface RegisterUserRequest extends Request {
  body: UserData;
}

export interface AuthRequest extends Request {
  auth: {
    sub: number;
    role: string;
    iat: number;
  };
}
