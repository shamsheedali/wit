import { inject, injectable } from "inversify";
import { Model } from "mongoose";
import BaseRepository from "../../core/base.repository";
import { IAdmin } from "../models/admin.model";
import TYPES from "../../config/types";

@injectable()
export default class AdminRepository extends BaseRepository<IAdmin> {
    constructor(@inject(TYPES.AdminModel) adminModel: Model<IAdmin>) {
        super(adminModel);
    }

    async findOneByEmail(email: string) {
        return await this.model.findOne({ email });
    }
}