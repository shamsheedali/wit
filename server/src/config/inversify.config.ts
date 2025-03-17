import { Container } from 'inversify';
import TYPES from './types';
import UserRepository from '../app/repositories/user.repository';
import AdminRepository from '../app/repositories/admin.repository';
import FriendRepository from '../app/repositories/friend.repository';
import UserService from '../app/services/user.service';
import UserController from '../app/controllers/user.controller';
import AdminController from '../app/controllers/admin.controller';
import FriendController from '../app/controllers/friend.controller';
import TokenService from '../app/services/token.service';
import MailService from '../app/services/mail.service';
import userModel, { IUser } from '../app/models/user.model';
import adminModel, { IAdmin } from '../app/models/admin.model';
import friendRequestModel, { IFriendRequest } from '../app/models/friendRequest.model';
import FriendService from '../app/services/friend.service';
import { Model } from 'mongoose';

const container = new Container();

// Bind Models
container.bind<Model<IUser>>(TYPES.UserModel).toConstantValue(userModel);
container.bind<Model<IAdmin>>(TYPES.AdminModel).toConstantValue(adminModel);
container.bind<Model<IFriendRequest>>(TYPES.FriendRequestModel).toConstantValue(friendRequestModel);

// Bind Repositories
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<AdminRepository>(TYPES.AdminRepository).to(AdminRepository);
container.bind<FriendRepository>(TYPES.FriendRepository).to(FriendRepository);

// Bind Services
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<FriendService>(TYPES.FriendService).to(FriendService);
container.bind<TokenService>(TYPES.TokenService).to(TokenService);
container.bind<MailService>(TYPES.MailService).to(MailService);

// Bind Controllers
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<AdminController>(TYPES.AdminController).to(AdminController);
container.bind<FriendController>(TYPES.FriendController).to(FriendController);

export default container;