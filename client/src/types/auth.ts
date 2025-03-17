export interface User {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isBanned: boolean;
    bio?: string;
    googleId?: string;
    profileImageUrl?: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    setUser: (userData: User) => void;
    updateUser: (updatedData: Partial<User>) => void;
    logout: () => void;
}