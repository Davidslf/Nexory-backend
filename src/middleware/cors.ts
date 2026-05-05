import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.header('Access-Control-Allow-Origin', config.frontendUrl);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};
