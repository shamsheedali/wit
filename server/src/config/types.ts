const TYPES = {
  //Models
  UserModel: Symbol.for('UserModel'),
  AdminModel: Symbol.for('AdminModel'),
  FriendRequestModel: Symbol.for('FriendRequestModel'),
  ClubModel: Symbol.for('ClubModel'),
  GameModel: Symbol.for('GameModel'),
  TournamentModel: Symbol.for('TournamentModel'),
  //Repositories
  UserRepository: Symbol.for('UserRepository'),
  AdminRepository: Symbol.for('AdminRepository'),
  FriendRepository: Symbol.for('FriendRepository'),
  ClubRepository: Symbol.for('ClubRepository'),
  GameRepository: Symbol.for('GameRepository'),
  TournamentRepository: Symbol.for('TournamentRepository'),
  //Services
  UserService: Symbol.for('UserService'),
  AdminService: Symbol.for('AdminService'),
  FriendService: Symbol.for('FriendService'),
  ClubService: Symbol.for('ClubService'),
  GameService: Symbol.for('GameService'),
  TokenService: Symbol.for('TokenService'),
  MailService: Symbol.for('MailService'),
  TournamentService: Symbol.for('TournamentService'),
  //Controllers
  UserController: Symbol.for('UserController'),
  AdminController: Symbol.for('AdminController'),
  FriendController: Symbol.for('FriendController'),
  ClubController: Symbol.for('ClubController'),
  GameController: Symbol.for('GameController'),
  TournamentController: Symbol.for('TournamentController'),
};

export default TYPES;
