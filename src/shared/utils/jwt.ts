import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';

interface TokenPayload {
  userId: string;
  email: string;
  roleName: string;
  permissions: string[];
}

export class JwtUtils {
  static generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: config.jwt.expiresIn as any,
    };
    return jwt.sign(payload, config.jwt.secret, options);
  }

  static generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: config.jwt.refreshExpiresIn as any,
    };
    return jwt.sign(payload, config.jwt.refreshSecret, options);
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  }

  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
  }
}

