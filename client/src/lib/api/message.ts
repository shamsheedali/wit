import HttpStatus from "../constants/httpStatus";
import { handleApiError } from "../constants/errorHandler";
import apiClient from "../apiClient";

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/message`;

export const sendMessage = async (messageData: {
  receiverId: string;
  content: string;
}) => {
  try {
    const response = await apiClient.post(API_URL, messageData);
    if (response.status === HttpStatus.CREATED) {
      return { success: true, data: response.data.data };
    }
  } catch (error) {
    handleApiError(error);
    return { success: false };
  }
};

export const getMessages = async (userId: string) => {
  try {
    const response = await apiClient.get(`${API_URL}/${userId}`);
    if (response.status === HttpStatus.OK) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    handleApiError(error);
    return [];
  }
};
