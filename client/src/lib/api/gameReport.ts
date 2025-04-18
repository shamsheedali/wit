import HttpStatus from "../constants/httpStatus";
import { handleApiError } from "../constants/errorHandler";
import apiClient from "../apiClient";

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/game-report`;

export const reportGame = async (reportData: {
  gameId: string;
  reportedUserId: string;
  reason: string;
  details?: string;
}) => {
  try {
    const response = await apiClient.post(API_URL, reportData);
    if (response.status === HttpStatus.CREATED) {
      return { success: true, data: response.data.data };
    }
  } catch (error) {
    handleApiError(error);
    return { success: false };
  }
};

export const getGameReports = async () => {
  try {
    const response = await apiClient.get(API_URL);
    if (response.status === HttpStatus.OK) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    handleApiError(error);
    return [];
  }
};
