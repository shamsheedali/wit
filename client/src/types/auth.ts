export interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isBanned?: boolean;
  bio?: string;
  googleId?: string;
  profileImageUrl?: string;
  eloRating: number;
  gamesPlayed: number;
  friends: string[];
  createdAt: string;
}

export interface Admin {
  _id: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  setUser: (userData: User) => void;
  updateUser: (updatedData: Partial<User>) => void;
  logout: () => void;
  setAdmin: (adminData: Admin) => void;
}
