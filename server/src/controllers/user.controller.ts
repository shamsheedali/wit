import { Request, Response } from "express";
import HttpStatus from "../utils/httpStatus";
import userService from "../services/user.service";
import { IUser } from "../models/user.model";

class UserController {

    async registerUser(req: Request, res: Response): Promise<Response> {
        try {
           const {username, email, password}: IUser = req.body;
            
            if(!username || !email || !password) {
                return res.status(HttpStatus.BAD_REQUEST).json({message: 'All fields are required'});
            }
            
            const user = await userService.registerUser({username, email, password});

            if(user.isNewUser) {
                return res.status(HttpStatus.CREATED).json({message: "Signup Successfull", newUser: user?.user});
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
}

export default new UserController();
