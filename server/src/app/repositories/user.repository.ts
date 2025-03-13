import { inject, injectable } from "inversify";
import { Model, Types } from "mongoose";
import BaseRepository from "../../core/base.repository";
import { IUser } from "../models/user.model";
import { IGoogleUserInput, IUserInput } from "../dtos/user.dto";
import TYPES from "../../config/types";

@injectable()
export default class UserRepository extends BaseRepository<IUser> {
    constructor(@inject(TYPES.UserModel) userModel: Model<IUser>) {
        super(userModel);
    }

    async createUser(userData: IUserInput) {
        return await this.create(userData); 
    }

    async createGoogleUser(userData: IGoogleUserInput) {
        return await this.model.create(userData);
    }

    async findOneByEmail(email: string) {
        return await this.model.findOne({ email });
    }

    async findOneByUsername(username: string) {
        return await this.model.findOne({ username });
    }

    async findAllPaginated(skip: number, limit: number) {
        return await this.model.find().skip(skip).limit(limit);
    }
    
    async countUsers() {
        return await this.model.countDocuments();
    }

    async searchUserByUsername(query: string) {
        return await this.model.find({
            username: {$regex: `^${query}`, $options: "i"}
        });
    }
}