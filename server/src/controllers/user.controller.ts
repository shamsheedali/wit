import { Request, Response } from "express";
import HttpStatus from "../utils/httpStatus";
import userService from "../services/user.service";
import { IUser } from "../models/user.model";
import userRepository from "../repositories/user.repository";

class UserController {

    async registerUser(req: Request, res: Response): Promise<Response> {
        try {
           const {username, email, password, role = 'user'}: IUser = req.body;
            
            if(!username || !email || !password) {
                return res.status(HttpStatus.BAD_REQUEST).json({message: 'All fields are required'});
            }
            
            const user = await userService.registerUser({username, email, password, role});

            if(user.isNewUser) {
                const accessToken = userService.generateAccessToken(user?.user?.email, user?.user?.role);
              const refreshToken = userService.generateRefreshToken(user?.user?.email, user?.user?.role);
                //setting refreshToken
                    res.cookie("refreshToken", refreshToken, {
                              httpOnly: true, 
                              secure: process.env.NODE_ENV === "production",
                              sameSite: "strict", 
                              maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                            });

                    return res.status(HttpStatus.CREATED).json({message: "Signup Successfull", newUser: user?.user, accessToken});
            } else if (user.duplicate === 'username'){
                 return res.status(HttpStatus.BAD_REQUEST).json({ message: "username already exist" });
            } else {
                return res.status(HttpStatus.BAD_REQUEST).json({message: "user already exist"});
            }

        } catch (error) {
           console.log('Error Creating User', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message: "Error Creating User", error});
        }
    }


    async login(req: Request, res: Response): Promise<Response> {
        try {
           const {email, password} = req.body;

            if(!email || !password) {
                return res.status(HttpStatus.BAD_REQUEST).json({message: 'All fields are required'});
            }

            const user = await userRepository.findOneByEmail(email);
            if(!user) {
                return res.status(HttpStatus.BAD_REQUEST).json({message: "User not available"});
            }

            const passwordValidation = await userService.isPasswordValid(password, user.password);
            if(!passwordValidation) {
                return res.status(HttpStatus.BAD_REQUEST).json({message: "Invalid password"});
            }

            const accessToken = userService.generateAccessToken(email, user.role);
            const refreshToken = userService.generateRefreshToken(email, user.role);
                //setting refreshToken
                    res.cookie("refreshToken", refreshToken, {
                              httpOnly: true, 
                              secure: process.env.NODE_ENV === "production",
                              sameSite: "strict", 
                              maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                            });

                    return res.status(HttpStatus.CREATED).json({message: "Login Successfull",user, accessToken});
        } catch (error) {
            console.log(error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message : "Error while user login"});
            
        }
    }
}

export default new UserController();
