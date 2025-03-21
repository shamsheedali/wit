import { Request, Response, NextFunction } from "express";
import HttpStatus from "../constants/httpStatus";

const isAdmin = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== 'admin') {
      res.status(HttpStatus.FORBIDDEN).json({ message: `Access denied. admin role required.` });
      return;
    }
    next();
  };
};

export default isAdmin;