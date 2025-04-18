import { Container } from 'inversify';
import TYPES from './types';
import UserRepository from '../app/repositories/user.repository';
import AdminRepository from '../app/repositories/admin.repository';
import FriendRepository from '../app/repositories/friend.repository';
import ClubRepository from '../app/repositories/club.repository';
import GameRepository from '../app/repositories/game.repository';
import UserService from '../app/services/user.service';
import FriendService from '../app/services/friend.service';
import ClubService from '../app/services/club.service';
import GameService from '../app/services/game.service';
import UserController from '../app/controllers/user.controller';
import AdminController from '../app/controllers/admin.controller';
import FriendController from '../app/controllers/friend.controller';
import ClubController from '../app/controllers/club.controller';
import GameController from '../app/controllers/game.controller';
import TokenService from '../app/services/token.service';
import MailService from '../app/services/mail.service';
import userModel, { IUser } from '../app/models/user.model';
import adminModel, { IAdmin } from '../app/models/admin.model';
import friendRequestModel, { IFriendRequest } from '../app/models/friendRequest.model';
import clubModel, { IClub } from '../app/models/club.model';
import gameModel, { IGame } from '../app/models/game.model';
import { Model } from 'mongoose';
import AdminService from '../app/services/admin.service';
import tournamentModel, { ITournament } from '../app/models/tournament.model';
import TournamentRepository from '../app/repositories/tournament.repository';
import TournamentService from '../app/services/tournament.service';
import TournamentController from '../app/controllers/tournament.controller';
import messageModel, { IMessage } from '../app/models/message.model';
import MessageRepository from '../app/repositories/message.repository';
import MessageService from '../app/services/message.service';
import MessageController from '../app/controllers/message.controller';
import gameReportModel, { IGameReport } from '../app/models/gameReport.model';
import GameReportRepository from '../app/repositories/gameReport.repository';
import GameReportService from '../app/services/gameReport.service';
import GameReportController from '../app/controllers/gameReport.controller';

const container = new Container();

// Bind Models
container.bind<Model<IUser>>(TYPES.UserModel).toConstantValue(userModel);
container.bind<Model<IAdmin>>(TYPES.AdminModel).toConstantValue(adminModel);
container.bind<Model<IFriendRequest>>(TYPES.FriendRequestModel).toConstantValue(friendRequestModel);
container.bind<Model<IClub>>(TYPES.ClubModel).toConstantValue(clubModel);
container.bind<Model<IGame>>(TYPES.GameModel).toConstantValue(gameModel);
container.bind<Model<ITournament>>(TYPES.TournamentModel).toConstantValue(tournamentModel);
container.bind<Model<IMessage>>(TYPES.MessageModel).toConstantValue(messageModel);
container.bind<Model<IGameReport>>(TYPES.GameReportModel).toConstantValue(gameReportModel);

// Bind Repositories
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<AdminRepository>(TYPES.AdminRepository).to(AdminRepository);
container.bind<FriendRepository>(TYPES.FriendRepository).to(FriendRepository);
container.bind<ClubRepository>(TYPES.ClubRepository).to(ClubRepository);
container.bind<GameRepository>(TYPES.GameRepository).to(GameRepository);
container
  .bind<TournamentRepository>(TYPES.TournamentRepository)
  .to(TournamentRepository)
  .inSingletonScope();
container.bind<MessageRepository>(TYPES.MessageRepository).to(MessageRepository);
container.bind<GameReportRepository>(TYPES.GameReportRepository).to(GameReportRepository);

// Bind Services
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<AdminService>(TYPES.AdminService).to(AdminService);
container.bind<FriendService>(TYPES.FriendService).to(FriendService);
container.bind<ClubService>(TYPES.ClubService).to(ClubService);
container.bind<GameService>(TYPES.GameService).to(GameService);
container.bind<TokenService>(TYPES.TokenService).to(TokenService);
container.bind<MailService>(TYPES.MailService).to(MailService);
container.bind<TournamentService>(TYPES.TournamentService).to(TournamentService).inSingletonScope();
container.bind<MessageService>(TYPES.MessageService).to(MessageService);
container.bind<GameReportService>(TYPES.GameReportService).to(GameReportService);

// Bind Controllers
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<AdminController>(TYPES.AdminController).to(AdminController);
container.bind<FriendController>(TYPES.FriendController).to(FriendController);
container.bind<ClubController>(TYPES.ClubController).to(ClubController);
container.bind<GameController>(TYPES.GameController).to(GameController);
container
  .bind<TournamentController>(TYPES.TournamentController)
  .to(TournamentController)
  .inSingletonScope();
container.bind<MessageController>(TYPES.MessageController).to(MessageController);
container.bind<GameReportController>(TYPES.GameReportController).to(GameReportController);

export default container;
