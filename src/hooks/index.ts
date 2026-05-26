// Zustand stores (new)
export { useAuthStore, useUserStore } from '@/store/authStore';
export { useThemeStore } from '@/store/themeStore';
export { useSettingsStore } from '@/store/userStore';

// Legacy hooks (kept for backward compatibility during transition)
// These will be removed once all pages migrate to stores
export { useLocalStorage } from './useLocalStorage';
