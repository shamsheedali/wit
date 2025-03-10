import axios, { AxiosError } from 'axios';
import HttpStatus from '../constants/httpStatus';
import { toast } from 'sonner';

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin`;

//ADMIN_LOGIN
export const adminLogin = async(adminData: {email: string, password: string}) => {
  try{
    const response = await axios.post(`${API_URL}/login`, adminData);
    if (response.status === HttpStatus.OK) {
      localStorage.setItem('adminToken', response.data.accessToken);
      toast.success(response.data.message); 
      return {success: true, data: response.data};
    }
  } catch (error) {
    console.error("Error admin login", error);
    if(error instanceof AxiosError) {
      if (error.response?.status === HttpStatus.BAD_REQUEST || error.response?.status === HttpStatus.UNAUTHORIZED) {
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


//GET_ALL_USERS
export const getUsers = async(page: number, limit: number) => {
  try {
    const response = await axios.get(`${API_URL}/get-users`, {
      params : {page, limit},
    });
    console.log(response);
    return response.data;
  } catch (error) {
    console.log(error);
  }
}
