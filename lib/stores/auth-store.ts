import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * User interface từ Backend
 */
export interface User {
  userID: string;
  username: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
}

/**
 * Auth State Interface
 */
interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: User) => void;
  clearAuth: () => void;
  setAccessToken: (token: string | null) => void;
}

/**
 * Zustand Store cho Authentication
 * - accessToken: Lưu trong memory (không persist)
 * - user: Lưu trong localStorage (persist)
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      
      setAuth: (accessToken: string, user: User) => {
        set({
          accessToken,
          user,
          isAuthenticated: true,
        });
      },
      
      clearAuth: () => {
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
        });
      },
      
      setAccessToken: (token: string | null) => {
        set((state) => ({
          accessToken: token,
          isAuthenticated: token !== null && state.user !== null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      // Chỉ persist user, không persist accessToken (bảo mật hơn)
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);

