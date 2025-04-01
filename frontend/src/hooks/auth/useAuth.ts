import { useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { getAuthStatus } from "../../apis/authAPI";

// 這個hook主要用在App.tsx中，當頁面載入時會檢查使用者的登入狀態
// i.e. 應用程式初始化時就會執行登入狀態檢查
export const useAuth = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (isAuthenticated) return;

    const checkAuth = async () => {
      try {
        const { authenticated, user } = await getAuthStatus();
        if (authenticated) {
          login(user);
        } else {
          logout();
        }
      } catch (error) {
        logout();
        console.error("認證狀態取得失敗", error);
      }
    };

    checkAuth();
  }, [isAuthenticated, login, logout]);
};