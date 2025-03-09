const TYPES = {
    UserModel: Symbol.for("UserModel"),
    AdminModel: Symbol.for("AdminModel"),
    UserRepository: Symbol.for("UserRepository"),
    AdminRepository: Symbol.for("AdminRepository"),
    UserService: Symbol.for("UserService"),
    AdminService: Symbol.for("AdminService"),
    TokenService: Symbol.for("TokenService"),
    MailService: Symbol.for("MailService"),
    UserController: Symbol.for("UserController"),
    AdminController: Symbol.for("AdminController"),
};

export default TYPES;  