import { inject, injectable } from "inversify";
import bcrypt from "bcrypt";
import { IUser } from "../models/user.model";
import BaseService from "../../core/base.service";
import UserRepository from "../repositories/user.repository";
import TYPES from "../../config/types";
import { IUserInput } from "../dtos/user.dto";

@injectable()
export default class UserService extends BaseService<IUser> {
    private userRepository: UserRepository;

    constructor(@inject(TYPES.UserRepository) userRepository: UserRepository) {
        super(userRepository);
        this.userRepository = userRepository;
    }

    async registerUser(userData: IUserInput) {
        const { username, email, password } = userData;

        const existingUserEmail = await this.userRepository.findOneByEmail(email);
        if (existingUserEmail) {
            return { user: existingUserEmail, isNewUser: false, duplicate: "email" };
        }

        const existingUserUsername = await this.userRepository.findOneByUsername(username);
        if (existingUserUsername) {
            return { user: existingUserUsername, isNewUser: false, duplicate: "username" };
        }

        if (!password) {
            throw new Error("Password is required for user registration.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await this.userRepository.createUser({ username, email, password: hashedPassword });

        return { user: newUser, isNewUser: true };
    }

    async isPasswordValid(typedPassword: string, password?: string) {
        if (!password) return false;
        return await bcrypt.compare(typedPassword, password);
    }
}