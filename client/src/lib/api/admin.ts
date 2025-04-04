import HttpStatus from '../constants/httpStatus';
import { toast } from 'sonner';
import apiClient from '../apiClient';
import { handleApiError } from '../constants/errorHandler';

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin`;

//ADMIN_LOGIN
export const adminLogin = async(adminData: {email: string, password: string}) => {
  try{
    const response = await apiClient.post(`${API_URL}/login`, adminData);
    if (response.status === HttpStatus.OK) {
      localStorage.setItem('adminToken', response.data.accessToken);
      toast.success(response.data.message); 
      return {success: true, data: response.data};
    }
  } catch (error) {
    handleApiError(error)
  }
}

//GET_ALL_USERS
export const getUsers = async(page: number, limit: number) => {
  try {
    const response = await apiClient.get(`${API_URL}/users`, {
      params : {page, limit},
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return [];
  }
}

//BAN_UNBAN_USERS
export const toggleBan = async(userId: string) => {
  try {
    const response = await apiClient.patch(`${API_URL}/toggle-ban/${userId}`);
    if(response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return {success: true, user: response.data.user};
    }
    return false;
  } catch (error) {
    handleApiError(error);
  }
}

// GET_ALL_GAMES
export const getAllGames = async (page: number, limit: number) => {
  try {
    const response = await apiClient.get(`${API_URL}/games`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching games:", error);
    throw error;
  }
};

// DELETE_GAME
export const deleteGame = async (gameId: string) => {
  try {
    const response = await apiClient.delete(`${API_URL}/games/${gameId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting game:", error);
    throw error;
  }
};

// TERMINATE_GAME
export const terminateGame = async (gameId: string) => {
  try {
    const response = await apiClient.patch(`${API_URL}/games/${gameId}/terminate`);
    return response.data;
  } catch (error) {
    console.error("Error terminating game:", error);
    throw error;
  }
};

export const getUserGrowth = async (period: "daily" | "weekly" | "monthly" = "daily") => {
  try {
    const response = await apiClient.get(`${API_URL}/growth`, {
      params: { period },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

export const getTotalUsers = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/total`);
    return response.data.total;
  } catch (error) {
    handleApiError(error);
    return 0;
  }
};