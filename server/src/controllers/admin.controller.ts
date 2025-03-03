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
}

export default new AdminController(); 
