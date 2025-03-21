import apiClient from "../apiClient";
import { handleApiError } from "../constants/errorHandler";

const GAME_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/game`;

export const saveGame = async (
  playerOne: string,
  playerTwo: string,
  result: "whiteWin" | "blackWin" | "draw",
  playerAt: string,
  fen: string
) => {
  try {
    const response = await apiClient.post(`${GAME_API_URL}/save`, {
      playerOne,
      playerTwo,
      result,
      playerAt,
      fen,
    });
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
