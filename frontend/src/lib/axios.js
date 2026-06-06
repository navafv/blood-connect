import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, 
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// --- Concurrency / Race Condition Variables ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the request that failed WAS the login or refresh request, immediately reject it.
    if (
      originalRequest.url.includes("/auth/refresh/") ||
      originalRequest.url.includes("/auth/login/")
    ) {
      return Promise.reject(error);
    }

    // If the error is 401 (Unauthorized) and we haven't tried to retry this specific request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If a refresh is already in progress, put this failed request into a queue.
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Once the queue resolves, retry the request
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Lock the refresh process
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Ping the refresh endpoint. It reads the HttpOnly refresh_token cookie
        // and issues a new HttpOnly access_token cookie.
        await api.post("/auth/refresh/");

        // Success! Release the queue so all pending requests retry automatically
        processQueue(null);

        // Retry the original request that triggered this whole process
        return api(originalRequest);
      } catch (refreshError) {
        // If the refresh fails (e.g., refresh token is expired or manipulated)
        processQueue(refreshError, null);

        // Clean up UI state
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("userRole");
        // This freezes the screen with a modal, allowing the user to copy unsaved text!
        window.dispatchEvent(new CustomEvent("session-expired"));

        return Promise.reject(refreshError);
      } finally {
        // Always unlock the refresh process when done
        isRefreshing = false;
      }
    }

    // Catch random 401s outside of the retry flow as a fallback
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("session-expired"));
    }

    // For all other errors (400, 403, 404, 500), just reject the promise normally
    return Promise.reject(error);
  },
);

export default api;
