import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

// Helper: parse stored user from various localStorage formats
function parseStoredUser(raw: string): User | null {
  try {
    const parsed = JSON.parse(raw);
    const user = parsed?.state?.user || parsed?.user || parsed;
    if (user && typeof user === 'object' && user.username) return user as User;
    return null;
  } catch {
    return null;
  }
}

// Helper: parse stored token from various localStorage formats
function parseStoredToken(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.state?.token || null;
  } catch {
    return raw;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setToken: (token) =>
        set((state) => ({
          token,
          isAuthenticated: !!(state.user || token),
          isLoading: false,
        })),

      setUser: (user) =>
        set((state) => ({
          user,
          isAuthenticated: !!(user || state.token),
          isLoading: false,
        })),

      logout: () => {
        localStorage.removeItem('joan_auth_token');
        localStorage.removeItem('joan_academic_user');
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      setLoading: (loading) =>
        set({ isLoading: loading }),
    }),
    {
      name: 'joan_auth_token',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, sync derived fields
        if (state) {
          state.isLoading = false;
          state.isAuthenticated = !!(state.token);
          // Also try to get user from joan_academic_user if not in our own storage
          if (!state.user) {
            try {
              const raw = localStorage.getItem('joan_academic_user');
              if (raw) {
                state.user = parseStoredUser(raw);
                if (state.user) state.isAuthenticated = true;
              }
            } catch { /* ignore */ }
          }
        }
      },
    }
  )
);

// Separate persist for user data
export const useUserStore = create<{ user: User | null; setUser: (user: User | null) => void }>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'joan_academic_user',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
