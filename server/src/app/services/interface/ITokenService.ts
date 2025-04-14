import { Response } from 'express';

export interface ITokenService {
  // Token generation
  generateAccessToken(userId: string, email: string, role: string): string;
  generateRefreshToken(userId: string, email: string, role: string): string;

  // Cookie management
  setRefreshTokenCookie(res: Response, refreshToken: string): void;

  // Token verification
  verifyToken(token: string, secretKey: string): any;
}
