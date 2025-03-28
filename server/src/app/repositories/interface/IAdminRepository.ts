import { IAdmin } from "../../models/admin.model";

export interface IAdminRepository {
  // Find operation
  findOneByEmail(email: string): Promise<IAdmin | null>;
}