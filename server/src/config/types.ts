const TYPES = {
    UserModel: Symbol.for("UserModel"),
    AdminModel: Symbol.for("AdminModel"),
    FriendRequestModel: Symbol.for("FriendRequestModel"),
    UserRepository: Symbol.for("UserRepository"),
    AdminRepository: Symbol.for("AdminRepository"),
    FriendRepository: Symbol.for("FriendRepository"),
    UserService: Symbol.for("UserService"),
    AdminService: Symbol.for("AdminService"),
    FriendService: Symbol.for("FriendService"),
    TokenService: Symbol.for("TokenService"),
    MailService: Symbol.for("MailService"),
    UserController: Symbol.for("UserController"),
    AdminController: Symbol.for("AdminController"),
    FriendController: Symbol.for("FriendController")
};

export default TYPES;  