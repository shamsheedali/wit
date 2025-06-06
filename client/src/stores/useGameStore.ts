import { create } from "zustand";
import { ChessMove } from "@/types/game";

interface GameState {
  gameId: string | null;
  dbGameId: string | null;
  opponentId: string | null;
  opponentName: string | null;
  opponentProfilePicture: string | null;
  opponentEloRating: number | null;
  playerColor: "w" | "b" | null;
  whiteTime: number;
  blackTime: number;
  gameStarted: boolean;
  activePlayer: "w" | "b" | null;
  gameStartTime: number | null;
  moves: ChessMove[];
  isTournamentGame: boolean;
  tournamentId: string | null;
  matchId: string | null;
  addMove: (move: ChessMove) => void;
  resetGame: () => void;
  setGameState: (state: Partial<GameState>) => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameId: null,
  dbGameId: null,
  opponentId: null,
  opponentName: null,
  opponentProfilePicture: null,
  opponentEloRating: null,
  playerColor: null,
  whiteTime: 600,
  blackTime: 600,
  gameStarted: false,
  activePlayer: null,
  gameStartTime: null,
  moves: [],
  isTournamentGame: false,
  tournamentId: null,
  matchId: null,
  addMove: (move) =>
    set((state) => ({
      moves: [...state.moves, move],
    })),
  resetGame: () =>
    set({
      gameId: null,
      dbGameId: null,
      opponentId: null,
      opponentName: null,
      opponentProfilePicture: null,
      opponentEloRating: null,
      playerColor: null,
      whiteTime: 600,
      blackTime: 600,
      gameStarted: false,
      activePlayer: null,
      gameStartTime: null,
      moves: [],
      isTournamentGame: false,
      tournamentId: null,
      matchId: null,
    }),
  setGameState: (newState) => set((state) => ({ ...state, ...newState })),
}));
