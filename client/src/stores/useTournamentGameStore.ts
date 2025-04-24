import { create } from "zustand";
import { Move } from "chess.js";

interface GameState {
  gameId: string | null;
  dbGameId: string | null;
  tournamentId: string | null;
  matchId: string | null;
  opponentId: string | null;
  opponentName: string | null;
  opponentProfilePicture: string | null;
  playerColor: "w" | "b" | null;
  whiteTime: number;
  blackTime: number;
  increment: number;
  gameStarted: boolean;
  activePlayer: "w" | "b" | null;
  gameStartTime: number | null;
  moves: Move[];
  currentMoveIndex: number;
  takebackRequested: boolean;
  setGameState: (state: Partial<GameState>) => void;
  addMove: (move: Move) => void;
  resetGame: () => void;
  setCurrentMoveIndex: (index: number) => void;
  requestTakeback: () => void;
  acceptTakeback: () => void;
  declineTakeback: () => void;
}

export const useTournamentGameStore = create<GameState>((set) => ({
  gameId: null,
  dbGameId: null,
  tournamentId: null,
  matchId: null,
  opponentId: null,
  opponentName: null,
  opponentProfilePicture: null,
  playerColor: null,
  whiteTime: 0,
  blackTime: 0,
  increment: 0,
  gameStarted: false,
  activePlayer: null,
  gameStartTime: null,
  moves: [],
  currentMoveIndex: -1,
  takebackRequested: false,

  setGameState: (state) =>
    set((prev) => ({
      ...prev,
      ...state,
      currentMoveIndex: state.moves
        ? state.moves.length - 1
        : prev.currentMoveIndex,
    })),

  addMove: (move) =>
    set((state) => ({
      ...state,
      moves: [...state.moves, move],
      currentMoveIndex: state.moves.length,
    })),

  resetGame: () =>
    set({
      gameId: null,
      dbGameId: null,
      tournamentId: null,
      matchId: null,
      opponentId: null,
      opponentName: null,
      opponentProfilePicture: null,
      playerColor: null,
      whiteTime: 0,
      blackTime: 0,
      increment: 0,
      gameStarted: false,
      activePlayer: null,
      gameStartTime: null,
      moves: [],
      currentMoveIndex: -1,
      takebackRequested: false,
    }),

  setCurrentMoveIndex: (index) => set({ currentMoveIndex: index }),

  requestTakeback: () => set({ takebackRequested: true }),

  acceptTakeback: () =>
    set((state) => ({
      ...state,
      takebackRequested: false,
      moves: state.moves.slice(0, -1),
      currentMoveIndex: state.moves.length - 2,
    })),

  declineTakeback: () => set({ takebackRequested: false }),
}));
