import {Request, Response} from 'express'
import HttpStatus from '../utils/httpStatus';
import userService from '../services/user.service';
import adminRepository from '../repositories/admin.repository';

class AdminController {
  //ADMIN_LOGIN
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const {email, password} = req.body;

      if (!email || !password) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: "All fields are required" });
      }

      const admin = await adminRepository.findOneByEmail(email);

      if (!admin) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await userService.isPasswordValid(
        password,
        admin.password
      );

      if (!isPasswordValid) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Invalid password" });
      }

      const accessToken = userService.generateAccessToken(email, "admin");

      return res.status(HttpStatus.OK).json({ message: "Admin login successful", accessToken});
    } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error while admin login" });
    }
  }


  //GET_ALL_USERS
  async getUsers(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 7;
      const skip = (page - 1) * limit;

      const users = await adminRepository.findAll(skip, limit);

      const totalUsers = await adminRepository.countUsers();

      return res.status(HttpStatus.OK).json({
        users,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Error fetching users",
        error,
      });
    }
  }
}

export default new AdminController(); 
