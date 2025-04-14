import jwt from 'jsonwebtoken';
import { injectable } from 'inversify';
import { Response } from 'express';
import { ITokenService } from './interface/ITokenService';

@injectable()
export default class TokenService implements ITokenService {
  generateAccessToken(userId: string, email: string, role: string): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jwt.sign({ userId, email, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  }

  generateRefreshToken(userId: string, email: string, role: string): string {
    if (!process.env.REFRESH_JWT_SECRET) {
      throw new Error('REFRESH_JWT_SECRET is not defined in environment variables');
    }
    return jwt.sign({ userId, email, role }, process.env.REFRESH_JWT_SECRET, { expiresIn: '7d' });
  }

  setRefreshTokenCookie(res: Response, refreshToken: string, isAdmin: boolean = false) {
    const maxAgeStr = process.env.REFRESH_JWT_MAX_AGE;
    const maxAge = maxAgeStr ? parseInt(maxAgeStr, 10) : 7 * 24 * 60 * 60 * 1000; // Default to 7 days

    if (isNaN(maxAge)) {
      throw new Error('REFRESH_JWT_MAX_AGE must be a valid number');
    }

    const cookieName = isAdmin ? 'adminRefreshToken' : 'refreshToken';
    res.cookie(cookieName, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const, // TypeScript-friendly way to specify 'strict'
      maxAge,
    });
  }

  verifyToken(token: string, secretKey: string) {
    return jwt.verify(token, secretKey);
  }
}
