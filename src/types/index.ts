import { Request } from 'express';

export interface UserData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
  tenantId?: number;
}

export interface RegisterUserRequest extends Request {
  body: UserData;
}

export interface AuthRequest extends Request {
  auth: {
    id?: number;
    sub: number;
    role: string;
    iat: number;
  };
}

export type AuthCookie = {
  accessToken: string;
  refreshToken: string;
};

export interface IRefreshTokenPayload {
  id: string;
}

export interface ITenant {
  name: string;
  address: string;
}

export interface CreateTenantRequest extends Request {
  body: ITenant;
}

export interface CreateUserRequest extends Request {
  body: UserData;
}
