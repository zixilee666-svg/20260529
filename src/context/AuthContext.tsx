import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { User } from '@/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/userStore';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
}

type AuthAction =
  | { type: 'LOGIN'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SYNC'; payload: Partial<AuthState> };

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'LOGOUT':
      return { isAuthenticated: false, isLoading: false, user: null, token: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SYNC':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// Safe localStorage reader — handles both Zustand persist and direct format
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

function parseStoredToken(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Zustand persist format: { state: { token, user } }
    return parsed?.state?.token || null;
  } catch {
    // Direct token string
    return raw;
  }
}

/** 解码 JWT payload 并检查是否过期 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true; // 非法 JWT 格式
    // base64url → base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const payload = JSON.parse(atob(padded));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return true;
    return false;
  } catch {
    return true; // 解析失败视为过期
  }
}

/** 验证 token 是否为有效 JWT 且未过期 */
function isValidToken(token: string | null): boolean {
  if (!token) return false;
  if (!token.startsWith('eyJ')) return false; // JWT 必须以 eyJ 开头
  return !isTokenExpired(token);
}

// 初始化：从 localStorage 恢复会话
function getInitialState(): AuthState {
  const rawToken = localStorage.getItem('joan_auth_token');
  const rawUser = localStorage.getItem('joan_academic_user');
  const token = parseStoredToken(rawToken);
  const user = rawUser ? parseStoredUser(rawUser) : null;
  if (token && user && isValidToken(token)) {
    return { isAuthenticated: true, isLoading: false, user, token };
  }
  // Token 无效或过期：清理残留数据
  if (!isValidToken(token)) {
    localStorage.removeItem('joan_auth_token');
    localStorage.removeItem('joan_academic_user');
  }
  return { isAuthenticated: false, isLoading: false, user: null, token: null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, undefined, getInitialState);

  // 启动后立即检查：如果 token 无效但页面未跳转，主动跳转登录页
  const initialChecked = useRef(false);
  useEffect(() => {
    if (initialChecked.current) return;
    initialChecked.current = true;
    if (!state.isAuthenticated && window.location.hash !== '#/login') {
      console.warn('[Auth] 启动时检测到无效会话，跳转登录页');
      window.location.hash = '#/login';
    }
  }, [state.isAuthenticated]);

  // Sync with Zustand store changes (e.g. logout from other components)
  const zustandUser = useAuthStore(s => s.user);
  const zustandToken = useAuthStore(s => s.token);
  useEffect(() => {
    if (zustandUser && zustandToken) {
      dispatch({ type: 'SYNC', payload: { user: zustandUser, token: zustandToken, isAuthenticated: true } });
    } else if (!zustandToken && state.isAuthenticated) {
      dispatch({ type: 'SYNC', payload: { user: null, token: null, isAuthenticated: false } });
    }
  }, [zustandUser, zustandToken]);

  // On initial auth restore (e.g. page refresh with stored token), pull cloud-synced settings
  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      api.getSettings().then(res => {
        if (res.success && res.data) {
          useSettingsStore.getState().loadFromBackend(res.data as any);
        }
      }).catch(() => {
        // Non-critical: settings will fall back to localStorage defaults
      });
    }
  }, [state.isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await api.login(username, password);
      if (res.success && res.data) {
        // Sync to Zustand store (which handles localStorage)
        useAuthStore.getState().setUser(res.data.user);
        useAuthStore.getState().setToken(res.data.token);
        dispatch({ type: 'LOGIN', payload: res.data });

        // Pull cloud-synced settings (external tools, AI models, etc.) from backend KV
        try {
          const settingsRes = await api.getSettings();
          if (settingsRes.success && settingsRes.data) {
            useSettingsStore.getState().loadFromBackend(settingsRes.data as any);
          }
        } catch {
          // Non-critical: settings will fall back to localStorage defaults
        }

        return { success: true };
      }
      return { success: false, error: '登录失败' };
    } catch (err: any) {
      return { success: false, error: err.message || '登录失败，请重试' };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* ignore */ }
    // Mark that user just logged out (allows access to login page)
    sessionStorage.setItem('joan_just_logged_out', 'true');
    // Sync to Zustand store (which handles localStorage)
    useAuthStore.getState().logout();
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthContext');
  }
  return context;
}
