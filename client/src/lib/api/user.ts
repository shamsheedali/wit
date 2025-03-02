import axios from 'axios';
import HttpStatus from '../constants/httpStatus';
import { toast } from 'sonner';

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/user`;

export const registerUser = async (userData: { username: string; email: string; password: string }) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    if (response.status === HttpStatus.CREATED) {
      localStorage.setItem('userToken', response.data.accessToken);
      toast.success(response.data.message); 
      return {success: true, data: response.data};
    }
  } catch (error) {
    console.log('Error registration', error);
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
