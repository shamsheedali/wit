export interface TournamentPlayerUser {
  _id: string;
  username?: string;
}

export interface TournamentPlayer {
  userId: string | TournamentPlayerUser;
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  _id: string;
}

export interface TournamentMatch {
  player1Id: string;
  player2Id: string;
  result?: string;
  _id: string;
}

export interface TournamentData {
  _id: string;
  name: string;
  type: string;
  gameType: string;
  timeControl: string;
  maxGames: number;
  maxPlayers: number;
  status: "pending" | "active" | "playoff" | "completed";
  createdBy: string;
  createdByAdmin: boolean;
  startDate?: number;
  players: TournamentPlayer[];
  matches: TournamentMatch[];
  playoffMatch?: {
    result?: string | null;
  };
  __v?: number;
}

export type TournamentResult = "1-0" | "0-1" | "0.5-0.5";