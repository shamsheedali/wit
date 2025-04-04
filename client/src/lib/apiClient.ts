import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import HttpStatus from './constants/httpStatus';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

// Extend AxiosRequestConfig to include custom tokenType property
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  tokenType?: 'adminToken' | 'userToken' | null;
}

const getTokenInfo = (config: InternalAxiosRequestConfig): { token: string | null; tokenType: 'adminToken' | 'userToken' | null } => {
  if (typeof window === 'undefined') return { token: null, tokenType: null };

  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('userToken');

  const adminPaths = ['/api/admin'];
  const requestPath = new URL(config.url || '', config.baseURL).pathname;

  if (adminPaths.some(path => requestPath.startsWith(path))) {
    return { token: adminToken, tokenType: adminToken ? 'adminToken' : null };
  }
  return { token: userToken, tokenType: userToken ? 'userToken' : null };
};

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const { token } = getTokenInfo(config);
    console.log("This is sending token", getTokenInfo(config).tokenType)

    const excludedPaths = [
      '/api/user/register',
      '/api/user/login',
      '/api/admin/login',
      '/api/user/google-auth',
      '/api/user/otp',
      '/api/user/verify-otp',
      '/api/user/forgot-password',
      '/api/user/reset-password',
      '/api/user/refresh',
      '/api/admin/refresh',
    ];

    const requestPath = new URL(config.url || '', config.baseURL).pathname;
    const isExcluded = excludedPaths.some(path => requestPath.startsWith(path));

    if (token && !isExcluded) {
      // Ensure headers is defined
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      (config as CustomAxiosRequestConfig).tokenType = getTokenInfo(config).tokenType;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh Token Logic
interface QueueItem {
  resolve: (token: string) => void;
  reject: (reason?: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === HttpStatus.UNAUTHORIZED && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const tokenType = originalRequest.tokenType;
      const currentToken = tokenType ? localStorage.getItem(tokenType) : null;

      if (!currentToken || !tokenType) {
        if (typeof window !== 'undefined') {
          window.location.href = tokenType === 'adminToken' ? '/admin-login' : '/login';
        }
        return Promise.reject(error);
      }

      try {
        const refreshPath = tokenType === 'adminToken' ? '/api/admin/refresh' : '/api/user/refresh';
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}${refreshPath}`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = response.data as { accessToken: string };

        localStorage.setItem(tokenType, accessToken);
        apiClient.defaults.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem(tokenType);
        if (typeof window !== 'undefined') {
          window.location.href = tokenType === 'adminToken' ? '/admin-login' : '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;