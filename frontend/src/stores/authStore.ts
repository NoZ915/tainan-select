import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types/userType";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => {
        set({ isAuthenticated: false, user: null });
        localStorage.removeItem("auth-storage");
      }
    }),
    {
      name: "auth-storage", // key for localStorage/sessionStorage
    }
  )
);
