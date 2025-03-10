import axios, { AxiosError } from 'axios';
import HttpStatus from '../constants/httpStatus';
import { toast } from 'sonner';

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/user`;

//USER_SIGN_UP
export const registerUser = async (userData: { username: string; email: string; password: string }) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    if (response.status === HttpStatus.CREATED) {
      localStorage.setItem('userToken', response.data.accessToken);
      // toast.success(response.data.message); 
      return {success: true, data: response.data};
    }
  } catch (error) {
    console.error('Error registration', error);
    if(error instanceof AxiosError) {
      if (error.response?.status === HttpStatus.BAD_REQUEST) {
        toast.error(error.response.data.message, {
          classNames: {
            toast: 'bg-red-500 text-white',
          },
        });
      } else {
        toast.error('An unexpected error occurred. Please try again.', {
          classNames: {
            toast: 'bg-red-500 text-white',
          },
        });
      }
    }
  }
};

//USER_LOG_IN
export const login = async(userData: {email: string, password: string}) => {
  try{
    const response = await axios.post(`${API_URL}/login`, userData);
    if (response.status === HttpStatus.CREATED) {
      localStorage.setItem('userToken', response.data.accessToken);
      toast.success(response.data.message); 
      return {success: true, data: response.data};
    }
  } catch (error) {
    console.error("Error login", error);
    if(error instanceof AxiosError) {
      if (error.response?.status === HttpStatus.BAD_REQUEST) {
        toast.error(error.response.data.message, {
          classNames: {
            toast: 'bg-red-500 text-white',
          },
        });
      } else {
        toast.error('An unexpected error occurred. Please try again.', {
          classNames: {
            toast: 'bg-red-500 text-white',
          },
        });
      }
    }
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
    console.error("Error storing google-user", error);
    if(error instanceof AxiosError) {
      if (error.response?.status === HttpStatus.BAD_REQUEST) {
        toast.error(error.response.data.message);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
    return { success: false, error };
  }
}

//FORGOT_PASSWORD
export const forgotPassword = async (email: string) => {
  try {
    const response = await axios.post(`${API_URL}/forgot-password`, {email});
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
    const response = await axios.post(`${API_URL}/reset-password`, {email, newPassword});
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
    const response = await axios.post(`${API_URL}/otp`, {email});
    if(response.status === HttpStatus.OK) {
      toast.success(response.data.message); 
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    if(error instanceof AxiosError) {
      if (error.response?.status === HttpStatus.BAD_REQUEST) {
        toast.error(error.response.data.message, {
          classNames: {
            toast: 'bg-red-500 text-white',
          },
        });
      } else {
        toast.error('An unexpected error occurred. Please try again.', {
          classNames: {
            toast: 'bg-red-500 text-white',
          },
        });
      }
    }
  }
}

//VERIFY_OTP
export const verifyOtp = async (otpValue: string, email: string) => {
  try {
    const response = await axios.post(`${API_URL}/verify-otp`, {otpValue, email});
    if(response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    if(error instanceof AxiosError) {
      if (error.response?.status === HttpStatus.BAD_REQUEST) {
        toast.error(error.response.data.message, {
          classNames: {
            toast: 'bg-red-500 text-white',
          },
        });
      } else {
        toast.error('An unexpected error occurred. Please try again.', {
          classNames: {
            toast: 'bg-red-500 text-white',
          },
        });
      }
    }
  }
}