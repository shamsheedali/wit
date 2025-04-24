import HttpStatus from "../constants/httpStatus";
import { toast } from "sonner";
import { handleApiError } from "../constants/errorHandler";
import apiClient from "../apiClient";
import { AxiosError } from "axios";

const CLUB_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/club`;
const ADMIN_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin`;

// Fetch public clubs
export const getPublicClubs = async (search: string = "") => {
  try {
    const response = await apiClient.get(`${CLUB_API_URL}/public`, {
      params: { search },
    });
    return response.data.clubs;
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

// Create a club (for users)
export const createClub = async (clubData: {
  name: string;
  description?: string;
  clubType: "public" | "private";
  maxMembers?: number;
  adminIds?: string[];
  memberIds?: string[];
  userId: string;
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

// Create a public club (for admins)
export const createAdminClub = async (clubData: {
  name: string;
  description?: string;
  userId: string;
}) => {
  try {
    const response = await apiClient.post(`${ADMIN_API_URL}/clubs`, clubData);
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
    const response = await apiClient.post(`${CLUB_API_URL}/join`, {
      clubId,
      userId,
    });
    if (response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return { success: true, data: response.data.club };
    }
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      if (error.response?.data?.message === "Club is full") {
        toast.error("This club is full and cannot accept more members.");
        return { success: false, error: "Club is full" };
      }
      toast.error(error.response?.data?.message || "Failed to join club");
      return { success: false, error };
    }
  }
};

// Fetch user's clubs
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

// Fetch all clubs (admin)
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

// Leave a club
export const leaveClub = async (clubId: string, userId: string) => {
  try {
    const response = await apiClient.post(`${CLUB_API_URL}/leave`, {
      clubId,
      userId,
    });
    if (response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return { success: true, data: response.data.club };
    }
  } catch (error) {
    handleApiError(error);
    return { success: false, error };
  }
};

// Update a club
export const updateClub = async (clubData: {
  clubId: string;
  userId: string;
  name: string;
  description?: string;
  maxMembers?: number;
  memberIds?: string[];
}) => {
  try {
    const response = await apiClient.put(`${CLUB_API_URL}/update`, clubData);
    if (response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return { success: true, data: response.data.club };
    }
  } catch (error) {
    handleApiError(error);
    return { success: false, error };
  }
};

// Add a message to a club
export const addClubMessage = async (
  clubId: string,
  senderId: string,
  content: string
) => {
  try {
    const response = await apiClient.post(`${CLUB_API_URL}/message`, {
      clubId,
      senderId,
      content,
    });
    if (response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return { success: true, data: response.data.club };
    }
  } catch (error) {
    handleApiError(error);
    return { success: false, error };
  }
};

// Delete a club (for users)
export const deleteClub = async (clubId: string, userId: string) => {
  try {
    const response = await apiClient.post(`${CLUB_API_URL}/delete`, {
      clubId,
      userId,
    });
    if (response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return { success: true };
    }
  } catch (error) {
    handleApiError(error);
    return { success: false, error };
  }
};

// Delete a club (for admins)
export const deleteAdminClub = async (clubId: string) => {
  try {
    const response = await apiClient.delete(`${ADMIN_API_URL}/clubs/${clubId}`);
    if (response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return { success: true };
    }
  } catch (error) {
    handleApiError(error);
    return { success: false, error };
  }
};
