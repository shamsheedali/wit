import { IUser } from "../models/user.model";
import userRepository from "../repositories/user.repository";
import bcrypt from 'bcrypt';

class UserService {
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
}

export default new UserService();
