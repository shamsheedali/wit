import Admins from '../models/admin.modal';
import Users from '../models/user.model';

class AdminRepository {
    async findOneByEmail(email: string) {
        return await Admins.findOne({ email });
    }

    async findAll(skip: number, limit: number) {
        return await Users.find().skip(skip).limit(limit);
    }

    async countUsers() {
        return await Users.countDocuments();
    }
}

export default new AdminRepository();
