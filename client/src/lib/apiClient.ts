import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    withCredentials: true,
})

apiClient.interceptors.request.use(
    (config) => {
        if(typeof window !== undefined) {
            const token = localStorage.getItem('adminToken');

            const excludedPaths = [
                "/api/user/register",
                "/api/user/login",
                "/api/admin/login",
                "/api/user/google-auth",
                "/api/user/otp",
                "/api/user/verify-otp",
                "/api/user/forgot-password",
                "/api/user/reset-password",
            ];

            const requestPath = new URL(config.url!, config.baseURL).pathname;

            const isExcluded = excludedPaths.some(path => requestPath.startsWith(path));

            if (token && !isExcluded) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);  

export default apiClient;