import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Create axios instance with default config
const axiosClient: AxiosInstance = axios.create({
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token to requests
axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Get token from localStorage or wherever you store it
        const token = localStorage.getItem('accessToken');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
axiosClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Return successful responses as-is
        return response;
    },
    (error: AxiosError) => {
        const status = error.response?.status;
        const message = (error.response?.data as any)?.message || error.message;

        switch (status) {
            case 401:
                // Unauthorized - Clear auth data and redirect to login
                console.error('401 Unauthorized - Redirecting to login');
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    // Use setTimeout to prevent redirect during render
                    setTimeout(() => {
                        window.location.href = '/signin';
                    }, 100);
                }
                break;

            case 403:
                // Forbidden - Go back to previous page or home
                console.error('403 Forbidden - Access denied');
                if (typeof window !== 'undefined') {
                    // Use setTimeout to prevent redirect during render
                    setTimeout(() => {
                        if (window.history.length > 1) {
                            window.history.back();
                        } else {
                            window.location.href = '/home';
                        }
                    }, 100);
                }
                break;

            case 404:
                // Not Found - Let the calling code handle it
                console.error('404 Not Found:', message);
                break;

            case 500:
            case 502:
            case 503:
            case 504:
                // Server errors - Show error modal
                console.error('Server Error:', status, message);
                if (typeof window !== 'undefined') {
                    // Dispatch event to show error modal
                    window.dispatchEvent(new CustomEvent('server-error', {
                        detail: {
                            status,
                            message: 'We are sorry, the server is down. Please try again later.',
                        }
                    }));
                }
                break;

            default:
                // Handle other errors
                console.error('API Error:', status, message);
                break;
        }

        // Always reject the promise so calling code can handle errors in catch blocks
        return Promise.reject(error);
    }
);

// Wrapper functions for different HTTP methods
export const apiClient = {
    get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        return axiosClient.get<T>(url, config);
    },

    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        return axiosClient.post<T>(url, data, config);
    },

    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        return axiosClient.put<T>(url, data, config);
    },

    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        return axiosClient.patch<T>(url, data, config);
    },

    delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        return axiosClient.delete<T>(url, config);
    },
};

export default axiosClient;
