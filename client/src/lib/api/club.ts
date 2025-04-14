import HttpStatus from "../constants/httpStatus";
import { toast } from "sonner";
import { handleApiError } from "../constants/errorHandler";
import apiClient from "../apiClient";

const CLUB_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/club`;
const ADMIN_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin`;

// Fetch public clubs
export const getPublicClubs = async (search: string = '') => {
  try {
    const response = await apiClient.get(`${CLUB_API_URL}/public`, { params: { search } });
    return response.data.clubs;
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

// Create a club
export const createClub = async (clubData: {
  name: string;
  description?: string;
  clubType: "public" | "private";
  adminIds?: string[];
  memberIds?: string[];
  userId: string
}) => {
  try {
    const response = await apiClient.post(`${CLUB_API_URL}/create`, clubData);
    if (response.status === HttpStatus.CREATED) {
      toast.success(response.data.message);
      return { success: true, data: response.data.club };
    }
  } catch (error) {
    handleApiError(error);
    return { success: false, error };
  }
};

// Join a club
export const joinClub = async (clubId: string, userId: string) => {
  try {
    const response = await apiClient.post(`${CLUB_API_URL}/join`, { clubId, userId });
    console.log(response)
    if (response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return { success: true, data: response.data.club };
    }
  } catch (error) {
    handleApiError(error);
    return { success: false, error };
  }
};


export const getUserClubs = async (userId: string) => {
  try {
    const response = await apiClient.get(`${CLUB_API_URL}/user-clubs`, {
      params: { userId },
    });
    return response.data.clubs;
  } catch (error) {
    handleApiError(error);
  }
};

export const getClubs = async (page: number, limit: number) => {
  try {
    const response = await apiClient.get(`${ADMIN_API_URL}/clubs`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    return { clubs: [], totalClubs: 0, totalPages: 1, currentPage: 1 };
  }
};