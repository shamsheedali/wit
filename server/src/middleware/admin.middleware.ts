import { Request, Response, NextFunction } from "express";
import HttpStatus from "../constants/httpStatus";

const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(HttpStatus.FORBIDDEN).json({ message: `Access denied. ${role} role required.` });
      return;
    }
    next();
  };
};

export default requireRole;