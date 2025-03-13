import HttpStatus from '../constants/httpStatus';
import { toast } from 'sonner';
import { handleApiError } from '../constants/errorHandler';
import apiClient from '../apiClient';
import axios from 'axios';

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/user`;

//USER_SIGN_UP
export const registerUser = async (userData: { username: string; email: string; password: string }) => {
  try {
    const response = await apiClient.post(`${API_URL}/register`, userData);
    if (response.status === HttpStatus.CREATED) {
      // toast.success(response.data.message); 
      return {success: true, data: response.data};
    }
  } catch (error) {
    handleApiError(error);
  }
};

//USER_LOG_IN
export const login = async(userData: {email: string, password: string}) => {
  try{
    const response = await apiClient.post(`${API_URL}/login`, userData);
    if (response.status === HttpStatus.CREATED) {
      localStorage.setItem('userToken', response.data.accessToken);
      toast.success(response.data.message); 
      return {success: true, data: response.data};
    }
  } catch (error) {
    handleApiError(error);
  }
}

//GOOGLE_USER_AUTH
export const googleUser = async (userData: { googleId: string; username: string; email: string; profileImage: string }) => {
  try {
    const response = await axios.post(`${API_URL}/google-auth`, userData);
    if (response.status === HttpStatus.CREATED || response.status === HttpStatus.OK) {
      return { success: true, data: response.data };
    } else {
      console.error("Unexpected API response:", response);
      return { success: false, error: "Unexpected response" };
    }
  } catch (error) {
    // handleApiError(error);
    return { success: false, error };
  }
}

//FORGOT_PASSWORD
export const forgotPassword = async (email: string) => {
  try {
    const response = await apiClient.post(`${API_URL}/forgot-password`, {email});
    if(response.status === HttpStatus.OK) {
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
  }
}

//RESET_PASSWORD
export const resetPassword = async (email: string, newPassword: string) => {
  try {
    const response = await apiClient.post(`${API_URL}/reset-password`, {email, newPassword});
    if(response.status === HttpStatus.OK) {
      return true;
    }
  } catch (error) {
    console.error(error);
  }
}

//SHARE_OTP
export const getOtp = async (email: string) => {
  try {
    const response = await apiClient.post(`${API_URL}/otp`, {email});
    if(response.status === HttpStatus.OK) {
      toast.success(response.data.message); 
      return true;
    }
    return false;
  } catch (error) {
    handleApiError(error);
  }
}

//VERIFY_OTP
export const verifyOtp = async (otpValue: string, email: string) => {
  try {
    const response = await apiClient.post(`${API_URL}/verify-otp`, {otpValue, email});
    if(response.status === HttpStatus.OK) {
      localStorage.setItem('userToken', response.data.accessToken);
      toast.success(response.data.message);
      return true;
    }
    return false;
  } catch (error) {
    handleApiError(error)
  }
}

//SEARCH_FRIENDS
export const searchFriend = async (query: string) => {
  try {
    if (!query) return [];
    const response = await apiClient.get(`${API_URL}/search?query=${query}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}