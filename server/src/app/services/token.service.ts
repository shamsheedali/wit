import jwt from "jsonwebtoken";
import { injectable } from "inversify";
import { Response } from "express";
import { ITokenService } from "./interface/ITokenService";

@injectable()
export default class TokenService implements ITokenService {
    generateAccessToken(email: string, role: string): string {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }
        return jwt.sign({ email, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    }

    generateRefreshToken(email: string, role: string): string {
        if (!process.env.REFRESH_JWT_SECRET) {
            throw new Error("REFRESH_JWT_SECRET is not defined in environment variables");
        }
        return jwt.sign({ email, role }, process.env.REFRESH_JWT_SECRET, { expiresIn: "7d" });
    }

    setRefreshTokenCookie(res: Response, refreshToken: string) {
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }

    verifyToken(token: string, secretKey: string) {
        return jwt.verify(token, secretKey);
    }
}