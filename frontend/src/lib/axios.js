import axios from 'axios';

// The base URL points to your Django backend
const API_URL = 'http://localhost:8000/api';

// Create a custom Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// 1. REQUEST INTERCEPTOR
// ==========================================
// This runs BEFORE every request is sent to the backend.
// It grabs the access token from storage and attaches it.
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// 2. RESPONSE INTERCEPTOR
// ==========================================
// This runs AFTER the backend replies.
// It watches for 401 (Unauthorized) errors, which usually mean the token expired.
api.interceptors.response.use(
  (response) => {
    // If the request succeeds, just return the response
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401, and we haven't already tried to refresh the token...
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried to prevent infinite loops

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        // If there's no refresh token, the user must log in again
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Ask Django for a new access token
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        // Save the new access token
        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);

        // Update the failed request with the new token and try again!
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // If the refresh token is also expired/invalid, log the user out entirely
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        
        // Force redirect to login page
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Return any other errors (like 400 Bad Request, 404 Not Found)
    return Promise.reject(error);
  }
);

export default api;