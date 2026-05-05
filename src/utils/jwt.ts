import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import type { JwtPayload } from '../middleware/auth';

export const generateToken = (payload: JwtPayload): string =>
  jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwt.secret) as JwtPayload;
