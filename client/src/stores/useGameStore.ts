import { create } from "zustand";
import { ChessMove } from "@/types/game";

interface GameState {
  gameId: string | null;
  dbGameId: string | null;
  opponentId: string | null;
  opponentName: string | null;
  opponentProfilePicture: string | null;
  playerColor: "w" | "b" | null;
  whiteTime: number;
  blackTime: number;
  gameStarted: boolean;
  activePlayer: "w" | "b" | null;
  gameStartTime: number | null;
  moves: ChessMove[];
  setGameDetails: (details: Partial<GameState>) => void;
  addMove: (move: ChessMove) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameId: null,
  dbGameId: null,
  opponentId: null,
  opponentName: null,
  opponentProfilePicture: null,
  playerColor: null,
  whiteTime: 600,
  blackTime: 600,
  gameStarted: false,
  activePlayer: null,
  gameStartTime: null,
  moves: [],
  setGameDetails: (details) => set((state) => ({ ...state, ...details })),
  addMove: (move) => set((state) => ({ moves: [...state.moves, move] })),
  resetGame: () =>
    set({
      gameId: null,
      dbGameId: null,
      opponentId: null,
      opponentName: null,
      opponentProfilePicture: null,
      playerColor: null,
      whiteTime: 600,
      blackTime: 600,
      gameStarted: false,
      activePlayer: null,
      gameStartTime: null,
      moves: [],
    }),
}));
