import { Types } from 'mongoose';
import Users, { IUser } from '../models/user.model';

class UserRepository {
    async createUser(userData: IUser) {
        return await Users.create(userData);
    }

    async findOneByEmail(email: string) {
        return await Users.findOne({email});
    }

    async findOneByUsername(username: string) {
        return await Users.findOne({username});
    }
}

export default new UserRepository();
