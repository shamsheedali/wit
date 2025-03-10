import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import HttpStatus from "../constants/httpStatus";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      email: string;
      role: string;
    };
  }
}


export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(HttpStatus.UNAUTHORIZED).json({ message: "Access Denied: No Token Provided" });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: "Invalid Token" });
    }

    if (!decoded || typeof decoded !== "object" || !decoded.email || !decoded.role) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: "Invalid Token Payload" });
    }

    req.user = decoded as { email: string; role: string };
    next();
  });
};