export interface IUserInput {
    username: string;
    email: string;
    password?: string;
    bio?: string;
    googleId?: string;
    profileImageUrl?: string;
    profileImageId?: string;
}

export interface IGoogleUserInput {
    googleId: string;
    username: string;
    email: string;
    bio?: string;
    profileImageUrl?: string;
}