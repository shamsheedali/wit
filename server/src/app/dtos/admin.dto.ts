import { IAdmin } from '../models/admin.model';

export interface AdminResponseDTO {
  _id: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const toAdminDTO = (admin: IAdmin): AdminResponseDTO => ({
  _id: admin._id.toString(),
  email: admin.email,
});
