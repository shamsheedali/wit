import { IUser } from "../models/user.model";
import userRepository from "../repositories/user.repository";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

class UserService {
    
    //User signUp
    async registerUser(userData: IUser) {
        const {username, email, password} = userData;

        const existingUserEmail = await userRepository.findOneByEmail(email);
        if(existingUserEmail) {
            return {user: existingUserEmail, isNewUser: false, duplicate: 'email'}; 
        }

        const existingUserUsername = await userRepository.findOneByUsername(username);
        if(existingUserUsername) {
            return {user: existingUserUsername, isNewUser: false, duplicate: 'username'}
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await userRepository.createUser({username, email, password: hashedPassword});

        return {user: newUser, isNewUser: true};
    }

    //Get Access token
    generateAccessToken(username: string) {
        if(!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }
        return jwt.sign({username}, process.env.JWT_SECRET, {expiresIn : "1d"});
    }

    //Get Refrest token
    generateRefreshToken(username: string) {
        if(!process.env.REFRESH_JWT_SECRET) {
          throw new Error('REFRESH_JWT_SECRET is not defined in environment variables');
        }
        return jwt.sign({username}, process.env.REFRESH_JWT_SECRET, {expiresIn : "7d"});
    }

    //Verify token
    verifyToken(token: string , secretKey: string) {
        return jwt.verify(token, secretKey);
    }
}

export default new UserService();
