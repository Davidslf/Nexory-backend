import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5001',
};
