import HttpStatus from "../constants/httpStatus";
import { toast } from "sonner";
import { handleApiError } from "../constants/errorHandler";
import apiClient from "../apiClient";

const TOURNAMENT_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tournament`;

export const createTournament = async (data: {
  name: string;
  gameType: string;
  timeControl: string;
  maxGames: number;
  createdBy: string;
}) => {
  try {
    const response = await apiClient.post(`${TOURNAMENT_API_URL}/create`, data);
    if (response.status === HttpStatus.CREATED) {
      toast.success(response.data.message);
      return response.data.tournament;
    }
  } catch (error) {
    handleApiError(error);
    return null;
  }
};

export const joinTournament = async (tournamentId: string, userId: string) => {
  try {
    const response = await apiClient.post(`${TOURNAMENT_API_URL}/join`, {
      tournamentId,
      userId,
    });
    if (response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return response.data.tournament;
    }
  } catch (error) {
    handleApiError(error);
    return null;
  }
};

export const startTournament = async (tournamentId: string, userId: string) => {
  try {
    const response = await apiClient.post(`${TOURNAMENT_API_URL}/start`, {
      tournamentId,
      userId,
    });
    if (response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return response.data.tournament;
    }
  } catch (error) {
    handleApiError(error);
    return null;
  }
};

export const deleteTournament = async (
  tournamentId: string,
  userId: string
) => {
  try {
    const response = await apiClient.post(`${TOURNAMENT_API_URL}/delete`, {
      tournamentId,
      userId,
    });
    if (response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return response.data.tournament;
    }
  } catch (error) {
    handleApiError(error);
    return null;
  }
};

export const getTournaments = async (page: number, limit: number) => {
  try {
    const response = await apiClient.get(`${TOURNAMENT_API_URL}`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    return { tournaments: [], total: 0, page: 1, totalPages: 1 };
  }
};

export const getUserTournaments = async (userId: string) => {
  try {
    const response = await apiClient.get(`${TOURNAMENT_API_URL}/user`, {
      params: { userId },
    });
    return response.data.tournaments;
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

export const getTournament = async (tournamentId: string) => {
  try {
    const response = await apiClient.get(
      `${TOURNAMENT_API_URL}/${tournamentId}`
    );
    return response.data.tournament;
  } catch (error) {
    handleApiError(error);
    return null;
  }
};

export const submitResult = async (
  tournamentId: string,
  matchId: string,
  result: "1-0" | "0-1" | "0.5-0.5",
  userId: string
) => {
  try {
    const response = await apiClient.post(`${TOURNAMENT_API_URL}/result`, {
      tournamentId,
      matchId,
      result,
      userId,
    });
    if (response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return response.data.tournament;
    }
  } catch (error) {
    handleApiError(error);
    return null;
  }
};

export const submitPlayoffResult = async (
  tournamentId: string,
  result: "1-0" | "0-1",
  userId: string
) => {
  try {
    const response = await apiClient.post(
      `${TOURNAMENT_API_URL}/playoff-result`,
      {
        tournamentId,
        result,
        userId,
      }
    );
    if (response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return response.data.tournament;
    }
  } catch (error) {
    handleApiError(error);
    return null;
  }
};

export const pairMatch = async (tournamentId: string) => {
  try {
    const response = await apiClient.post(`${TOURNAMENT_API_URL}/pair`, {
      tournamentId,
    });
    if (response.status === HttpStatus.OK) {
      return response.data.match;
    }
  } catch (error) {
    handleApiError(error);
    return null;
  }
};

export const leaveTournament = async (tournamentId: string, userId: string) => {
  try {
    const response = await apiClient.post(`${TOURNAMENT_API_URL}/leave`, {
      tournamentId,
      userId,
    });
    if (response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return response.data.tournament;
    }
  } catch (error) {
    handleApiError(error);
    return null;
  }
};
