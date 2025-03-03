import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import HttpStatus from '../utils/httpStatus';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Access Denied: No Token Provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Invalid Token' });
    }

    if (typeof decoded === 'string' || !decoded) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Invalid Token Payload' });
    }

    // Ensuring the decoded object has the expected structure
    if (!('email' in decoded) || !('role' in decoded)) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Invalid Token Payload' });
    }

    // Assign the decoded payload to req.user
    req.user = decoded as { email: string; role: string }; 
    next();
  });
};
