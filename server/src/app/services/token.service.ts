import jwt from "jsonwebtoken";
import { injectable } from "inversify";

@injectable()
export default class TokenService {
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

    verifyToken(token: string, secretKey: string) {
        return jwt.verify(token, secretKey);
    }
}