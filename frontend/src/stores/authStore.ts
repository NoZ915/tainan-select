import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../types/userType'

interface AuthState {
  isAuthenticated: boolean;
  isLogoutInProgress: boolean; // 設置一個標誌，避免重複登出
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  setIsLogoutInProgress: (status: boolean) => void;
}

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      isAuthenticated: false,
      isLogoutInProgress: false,
      user: null,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => {
        set({ isAuthenticated: false, user: null })
        localStorage.removeItem('auth-storage')
      },
      setIsLogoutInProgress: (status) => set({ isLogoutInProgress: status }),
    }),
    {
      name: 'auth-storage', // key for localStorage/sessionStorage
    }
  )
)
