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

function parseStoredToken(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.state?.token || null;
  } catch {
    return raw;
  }
}

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = parseStoredToken(localStorage.getItem('joan_auth_token'));
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
