import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_BASE_ROUTE,
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      error.response = error.response || {
        data: {
          message: "Request timed out. Please try again.",
        },
      };
    }

    return Promise.reject(error);
  }
);

export default api;
