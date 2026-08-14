import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../types/userType'
import { createAuthenticatedUserCacheScope } from '../utils/userCacheScope'

type AuthenticatedUser = User & {
  cacheScope: string
}

interface AuthState {
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  isLogoutInProgress: boolean; // 設置一個標誌，避免重複登出
  user: AuthenticatedUser | null;
  login: (user: User, sessionScope: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  markAuthUnresolved: () => void;
  setIsLogoutInProgress: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isAuthResolved: false,
      isLogoutInProgress: false,
      user: null,
      login: (user, sessionScope) => {
        const cacheScope = createAuthenticatedUserCacheScope(sessionScope)
        set({
          isAuthenticated: true,
          isAuthResolved: true,
          isLogoutInProgress: false,
          user: {
            ...user,
            cacheScope,
          },
        })
      },
      updateUser: (user) => set((state) => ({
        user: state.user
          ? { ...user, cacheScope: state.user.cacheScope }
          : null,
      })),
      logout: () => {
        set({
          isAuthenticated: false,
          isAuthResolved: true,
          isLogoutInProgress: false,
          user: null,
        })
        localStorage.removeItem('auth-storage')
      },
      markAuthUnresolved: () => set((state) => {
        // 驗證服務暫時失敗時沿用已知模式，避免卸載使用者正在操作的畫面。
        return state.isAuthenticated && state.user
          ? { isAuthResolved: true }
          : {
            isAuthenticated: false,
            isAuthResolved: true,
            isLogoutInProgress: false,
            user: null,
          }
      }),
      setIsLogoutInProgress: (status) => set({ isLogoutInProgress: status }),
    }),
    {
      name: 'auth-storage', // key for localStorage/sessionStorage
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user
          ? {
            id: state.user.id,
            name: state.user.name,
            detail: state.user.detail,
            avatar: state.user.avatar,
            is_admin: state.user.is_admin,
            created_at: state.user.created_at,
            updated_at: state.user.updated_at,
            cacheScope: state.user.cacheScope,
          }
          : null,
      }),
    }
  )
)
