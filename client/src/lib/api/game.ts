import apiClient from "../apiClient";
import { handleApiError } from "../constants/errorHandler";

const GAME_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/game`;

interface IMove {
  from: string;
  to: string;
  piece: string;
  san: string;
  timestamp: string; // ISO string
}

export const saveGame = async (
  playerOne: string,
  playerTwo: string,
  playerAt: "w" | "b",
  fen: string,
  gameType: "blitz" | "bullet" | "rapid",
  timeControl: string
) => {
  try {
    const response = await apiClient.post(`${GAME_API_URL}/save`, {
      playerOne,
      playerTwo,
      playerAt,
      fen,
      gameType,
      timeControl,
      moves: [], // Start with empty moves
    });
    return response.data.game;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateGame = async (
  gameId: string,
  updateData: Partial<{
    result: "whiteWin" | "blackWin" | "draw";
    fen: string;
    moves: IMove[];
    lossType: "checkmate" | "resignation" | "timeout";
    gameDuration: number;
    gameStatus: "ongoing" | "completed" | "terminated";
  }>
) => {
  try {
    const response = await apiClient.put(`${GAME_API_URL}/update/${gameId}`, updateData);
    return response.data.game;
  } catch (error) {
    handleApiError(error);
  }
};

export const getUserGames = async (userId: string) => {
  try {
    const response = await apiClient.get(`${GAME_API_URL}/user/${userId}`);
    return response.data.games;
  } catch (error) {
    handleApiError(error);
  }
};