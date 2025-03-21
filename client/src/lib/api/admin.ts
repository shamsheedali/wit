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
    console.log(response);
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

//BAN_UNBAN_USERS
export const toggleBan = async(userId: string) => {
  try {
    const response = await apiClient.patch(`${API_URL}/toggle-ban/${userId}`);
    if(response.status === HttpStatus.OK) {
      toast.success(response.data.message);
      return true;
    }
    return false;
  } catch (error) {
    handleApiError(error);
  }
}