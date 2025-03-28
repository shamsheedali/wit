import HttpStatus from "../constants/httpStatus";
import { handleApiError } from "../constants/errorHandler";
import apiClient from "../apiClient";

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/friend`;

// FETCH FRIENDS
export const fetchFriends = async (userId: string) => {
    try {
      const response = await apiClient.get(`${API_URL}/friends?userId=${userId}`);
      if (response.status === HttpStatus.OK) {
        return { success: true, data: response.data };
      }
      return { success: false, message: 'Unexpected response' };
    } catch (error) {
      handleApiError(error);
      return { success: false, error };
    }
  };

// FETCH FRIEND REQUESTS
export const fetchFriendRequests = async (userId: string) => {
  try {
    const response = await apiClient.get(`${API_URL}/requests?userId=${userId}`);
    console.log("this response", response)
    if (response.status === HttpStatus.OK) {
      return { success: true, data: response.data };
    }
    return { success: false, message: "Unexpected response" };
  } catch (error) {
    handleApiError(error);
    return { success: false, error };
  }
};

// SEND FRIEND REQUEST
export const sendFriendRequest = async (
  senderId: string,
  receiverId: string
) => {
  try {
    const response = await apiClient.post(`${API_URL}/request`, {
      senderId,
      receiverId,
    });
    console.log("sendFriendRequest", response)
    if (response.status === HttpStatus.CREATED) {
      return { success: true, data: response.data.data }; // Match your backend response structure
    }
    return { success: false, message: "Unexpected response" };
  } catch (error) {
    handleApiError(error);
    return { success: false, error };
  }
};

// UPDATE FRIEND REQUEST
export const updateFriendRequest = async (
  requestId: string,
  userId: string,
  status: "accepted" | "ignored"
) => {
  try {
    const response = await apiClient.patch(`${API_URL}/request/${requestId}`, {
      userId,
      status,
    });
    if (response.status === HttpStatus.OK) {
      return { success: true, data: response.data.data }; // Match your backend response structure
    }
    return { success: false, message: "Unexpected response" };
  } catch (error) {
    handleApiError(error);
    return { success: false, error };
  }
};

export const removeFriend = async(userId: string, friendId: string) => {
  try {
    const response = await apiClient.delete(`${API_URL}/friend`, {data: { userId, friendId },});
    console.log(response);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}