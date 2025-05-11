import { expressjwt } from 'express-jwt';
import { Config } from '../config';
import { Request } from 'express';
import { AuthCookie } from '../types';

export default expressjwt({
  secret: Config.REFERSH_TOKEN_SECRET!,
  algorithms: ['HS256'],
  getToken(req: Request) {
    console.log(req.cookies);
    const { refreshToken } = req.cookies as AuthCookie;
    return refreshToken;
  }
});
