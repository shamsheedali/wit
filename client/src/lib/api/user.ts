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
      localStorage.setItem('userToken', response.data.accessToken);
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

//CHECK_DUPLICATE_USERNAME
export const checkUsername = async(username: string) => {
  try {
    const response = await apiClient.get(`${API_URL}/username/verify`, {
      params: {username}
    });
    return response.status === HttpStatus.OK;
  } catch (error) {
    handleApiError(error);
    return false;
  }
}

//GOOGLE_USER_AUTH
export const googleUser = async (userData: { googleId: string; username: string; email: string; profileImage: string }) => {
  try {
    const response = await axios.post(`${API_URL}/google-auth`, userData);
    console.log("google response", response);
    if (response.status === HttpStatus.CREATED) {
      // Only set localStorage on client side
      if (typeof window !== 'undefined') {
        localStorage.setItem("userToken", response.data.accessToken);
      }
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

//VERIFY_PASSWORD
export const verifyPassword = async (userData: {email: string, password: string}) => {
  try {
    const response = await apiClient.post(`${API_URL}/verify-password`, userData);
    if(response.status === HttpStatus.OK) {
      return true;
    }
  } catch (error) {
    handleApiError(error);
    return false;
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
    return response.data || []
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

//GET_USER
export const getUser = async (username: string) => {
  try {
    const response = await apiClient.get(`${API_URL}/username/${username}`)
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

//UPDATE_USER
export const updateUserProfile = async ({userData, userId}: {userData: FormData, userId: string}) => {
  try {
    const response = await apiClient.put(`${API_URL}/profile/${userId}`, userData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === HttpStatus.OK) {
      return { success: true, data: response.data };
    }
  } catch (error) {
    handleApiError(error);
    return { success: false, error };
  }
};

//USER_LOGOUT
export const userLogout = () => {
  localStorage.removeItem('userToken');
}

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