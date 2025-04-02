import { Request, Response, NextFunction } from 'express';
import HttpStatus from '../constants/httpStatus';
import Role from '../constants/role';

const isAdmin = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== Role.ADMIN) {
      res.status(HttpStatus.FORBIDDEN).json({ message: `Access denied. admin role required.` });
      return;
    }
    next();
  };
};

export default isAdmin;
