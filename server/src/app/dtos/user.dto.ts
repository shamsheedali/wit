export interface IUserInput {
    username: string;
    email: string;
    password?: string;
    googleId?: string;
    profileImage?: string;
}

export interface IGoogleUserInput {
    googleId: string;
    username: string;
    email: string;
    profileImage?: string;
}