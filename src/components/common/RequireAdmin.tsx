import { Navigate } from 'react-router-dom';
import type { User } from '@/types';

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

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  try {
    // 从 joan_auth_token (Zustand persist) 中读取用户信息
    const authStr = localStorage.getItem('joan_auth_token');
    if (!authStr) return <Navigate to="/login" replace />;
    const user = parseStoredUser(authStr);
    if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
    return <>{children}</>;
  } catch {
    return <Navigate to="/login" replace />;
  }
}
