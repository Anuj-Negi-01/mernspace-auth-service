import 'reflect-metadata';
import express, { NextFunction, Request, Response } from 'express';
import { HttpError } from 'http-errors';
import logger from './config/logger';
import authRouter from './routes/auth';
import cookieParser from 'cookie-parser';
import tenantRouter from './routes/tenant';

const app = express();

app.use(express.static('public', { dotfiles: 'allow' }));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to auth service'
  });
});

app.use('/auth', authRouter);
app.use('/tenants', tenantRouter);

// Gloabal Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    errors: [
      {
        type: err.name,
        msg: err.message,
        path: '',
        location: ''
      }
    ]
  });
});

export default app;
