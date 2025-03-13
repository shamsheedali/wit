import {Chess} from 'chess.js';
import type { Square, Move } from 'chess.js';

export type Fen = string;
export type GameWinner = 'b' | 'w' | null;
export type { Square, Move };
export type ShortMove = {
    from: Square;
    to: Square;
    promotion?: string;
  };

export const newGame = (): Fen => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const isNewGame = (fen: Fen): boolean => fen === newGame();

export const isBlackTurn = (fen: Fen): boolean => new Chess(fen).turn() === 'b';

export const isWhiteTurn = (fen: Fen): boolean => new Chess(fen).turn() === 'w';

export const isCheck = (fen: Fen): boolean => new Chess(fen).inCheck();

export const getGameWinner = (fen: Fen): GameWinner => {
  const game = new Chess(fen);
  return game.isCheckmate() ? (game.turn() === 'w' ? 'b' : 'w') : null;
};

export const isGameOver = (fen: Fen): boolean => new Chess(fen).isGameOver();

export const isMoveable = (fen: Fen, from: Square): boolean =>
  new Chess(fen).moves({ square: from }).length > 0;

export const move = (fen: Fen, from: Square, to: Square): [Fen, Move] | null => {
  const game = new Chess(fen);
  const action = game.move({ from, to, promotion: 'q' });
  return action ? [game.fen(), action] : null;
};