import { Container } from "inversify";
import TYPES from "./types";
import UserRepository from "../app/repositories/user.repository";
import AdminRepository from "../app/repositories/admin.repository";
import UserService from "../app/services/user.service";
import UserController from "../app/controllers/user.controller";
import AdminController from "../app/controllers/admin.controller";
import TokenService from "../app/services/token.service";
import userModel, { IUser } from "../app/models/user.model";
import { Model } from "mongoose";
import adminModel, { IAdmin } from "../app/models/admin.model";

const container = new Container();

// Bind Models
container.bind<Model<IUser>>(TYPES.UserModel).toConstantValue(userModel);
container.bind<Model<IAdmin>>(TYPES.AdminModel).toConstantValue(adminModel);

// Bind Repositories
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<AdminRepository>(TYPES.AdminRepository).to(AdminRepository);

// Bind Services
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<TokenService>(TYPES.TokenService).to(TokenService);

// Bind Controllers
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<AdminController>(TYPES.AdminController).to(AdminController);

export default container;