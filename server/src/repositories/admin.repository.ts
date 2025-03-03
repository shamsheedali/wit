import Admins from '../models/admin.modal';

class AdminRepository {
    async findOneByEmail(email: string) {
        return await Admins.findOne({email});
    }
}

export default new AdminRepository();
