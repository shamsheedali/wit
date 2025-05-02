import { GameData } from "./game";
import { TournamentData } from "./tournament";

export interface registerUserResponse {
  accessToken: string;
  message: string;
  user: {
    createdAt: string;
    eloRating: number;
    email: string;
    friends: [];
    gamesPlayed: number;
    updatedAt: string;
    username: string;
    _id: string;
  };
}

export interface GamesResponse {
  games: GameData[];
  totalPages: number;
  currentPage: number;
}

export interface UsersResponse {
  users: {
    _id: string;
    username: string;
  }[];
  totalPages: number;
  currentPage: number;
}

export interface TournamentsResponse {
  tournaments: TournamentData[];
  totalTournaments: number;
  totalPages: number;
  currentPage: number;
}

export type TournamentCreationResponse =
  | { success: true; tournament: TournamentData }
  | false;
