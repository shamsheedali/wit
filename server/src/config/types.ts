const TYPES = {
    UserModel: Symbol.for("UserModel"),
    AdminModel: Symbol.for("AdminModel"),
    UserRepository: Symbol.for("UserRepository"),
    AdminRepository: Symbol.for("AdminRepository"),
    UserService: Symbol.for("UserService"),
    TokenService: Symbol.for("TokenService"),
    AdminService: Symbol.for("AdminService"),
    UserController: Symbol.for("UserController"),
    AdminController: Symbol.for("AdminController"),
};

export default TYPES;  