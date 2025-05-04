import axios from "axios";
import { useAuthStore } from "../stores/authStore";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { logout, isLogoutInProgress, setIsLogoutInProgress } = useAuthStore.getState();

    const currentPath = window.location.pathname;
    const isOAuthCallback = currentPath.includes("/auth/google/callback");
    const isMailError = currentPath.includes("/mailError");

    if (error.response?.status === 401 && !isLogoutInProgress && !isOAuthCallback && !isMailError) {
      setIsLogoutInProgress(true); // 設置標誌，防止再次登出
      logout();
      window.location.href = "/";
    }

    const message = error.response?.data?.message || "發生錯誤，請稍後再試";
    return Promise.reject(new Error(message));
  }
);
