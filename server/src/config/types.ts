const TYPES = {
  UserModel: Symbol.for("UserModel"),
  AdminModel: Symbol.for("AdminModel"),
  FriendRequestModel: Symbol.for("FriendRequestModel"),
  ClubModel: Symbol.for("ClubModel"),
  UserRepository: Symbol.for("UserRepository"),
  AdminRepository: Symbol.for("AdminRepository"),
  FriendRepository: Symbol.for("FriendRepository"),
  ClubRepository: Symbol.for("ClubRepository"),
  UserService: Symbol.for("UserService"),
  AdminService: Symbol.for("AdminService"),
  FriendService: Symbol.for("FriendService"),
  ClubService: Symbol.for("ClubService"),
  TokenService: Symbol.for("TokenService"),
  MailService: Symbol.for("MailService"),
  UserController: Symbol.for("UserController"),
  AdminController: Symbol.for("AdminController"),
  FriendController: Symbol.for("FriendController"),
  ClubController: Symbol.for("ClubController"),
};

export default TYPES;