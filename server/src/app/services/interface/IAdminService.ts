import { IAdmin } from "../../models/admin.model";

export interface IAdminService {
  // Find operations
  findByEmail(email: string): Promise<IAdmin | null>;
}