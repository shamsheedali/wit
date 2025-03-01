import { Request, Response, NextFunction } from 'express';

declare module 'express' {
  interface Request {
    user?: {
      email: string;
      role: string;
    };
  }
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};
