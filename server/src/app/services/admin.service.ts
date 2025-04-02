import { inject, injectable } from 'inversify';
import BaseService from '../../core/base.service';
import { IAdmin } from '../models/admin.model';
import { IAdminService } from './interface/IAdminService';
import AdminRepository from '../repositories/admin.repository';
import TYPES from '../../config/types';

@injectable()
export default class AdminService extends BaseService<IAdmin> implements IAdminService {
  private _adminRepository: AdminRepository;

  constructor(@inject(TYPES.AdminRepository) adminRepository: AdminRepository) {
    super(adminRepository);
    this._adminRepository = adminRepository;
  }

  async findByEmail(email: string) {
    return await this._adminRepository.findOneByEmail(email);
  }
}
