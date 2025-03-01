import axios from 'axios';

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/user`;

//USER_SIGN_UP
export const registerUser = async(userData: {username: string, email: string, password: string}) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      console.log(response)
    } catch (error) {
      console.log("Error registration", error);
    }
}

//USER_LOG_IN
export const login = async(userData: {email: string, password: string}) => {
  try{
    const response = await axios.post(`${API_URL}/login`, userData);
    console.log(response);
  } catch (error) {
    console.error("Error login", error);
  }
}
