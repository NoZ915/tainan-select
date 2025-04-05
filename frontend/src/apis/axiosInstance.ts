import axios from "axios";
import { useAuthStore } from "../stores/authStore";
import { useNavigate } from "react-router-dom";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { logout, isLogoutInProgress, setIsLogoutInProgress } = useAuthStore.getState();
    const navigate = useNavigate();

    if (error.response.status === 401 && !isLogoutInProgress) {
      setIsLogoutInProgress(true);  // 設置標誌，防止再次登出
      logout();
      navigate("/");
    }
    return Promise.reject(error);
  }
);
