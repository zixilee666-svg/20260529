# Academic Hub v4 Memory

## Project Overview
- React 19 + TypeScript + Vite 8 + Tailwind CSS 3 + shadcn/ui + Framer Motion
- EdgeOne Edge Functions (V8) + Cloud Functions (Node.js) + KV Storage
- Zustand state management (authStore, themeStore, userStore)
- HashRouter for SPA routing (EdgeOne Pages compatible)
- Two API layers: `src/lib/api.ts` (mock mode, default) + `src/services/api.ts` (real backend)
- Admin login: admin/123456

## Key Decisions (2026-04-29)
- **API Migration**: All pages migrated from `seedPapers`/`seedProjects` to `api` from `src/lib/api.ts`
- **Mock Mode**: `IS_MOCK = true` by default, switchable via `VITE_MOCK_MODE=false` env var
- **Password Hashing**: SHA-256 with salt `:joan_academic_salt_2026` (register.js, login.js)
- **AI Auth**: cloud-functions/api/ai.js now requires JWT Bearer token
- **CORS**: Configurable via `CORS_ORIGINS` env var, defaults to `*`
- **Zustand Persist**: authStore persists token+user; all consumers use `parseStoredUser()`/`parseStoredToken()` helpers
- **AuthContext**: Rewritten to use Zustand store (no direct localStorage)
- **E2E**: 42 tests, `workers: 1` (multi-worker localStorage race condition)
- **EdgeOne Deploy**: Deploy `./dist` only, NOT project root (avoids Edge Functions build failure)
- **GitHub**: https://github.com/zixilee666-svg/project02.git (branch: main)

## Migration Status (2026-04-29)
- ✅ DashboardPage → api.getPapers/getProjects/getReadingStats
- ✅ LibraryPage → api.getPapers (client-side filter/sort)
- ✅ PaperDetailPage → api.getPaper/toggleFavorite/getNotes/addNote/getHighlights
- ✅ ResearchPage → api.getProjects/createProject/updateProject/deleteProject
- ✅ SettingsPage → useAuthStore/useThemeStore/useSettingsStore + api.updateSettings
- ✅ AIChatPage → api.aiChat (SSE streaming + mock fallback)
- ✅ ImportExportPage → api.searchArxiv/searchSemanticScholar/importFromSearch/batchImport/exportPapers
- ✅ MyLibraryPage → api.getLibraries/getPapers
- ✅ AdminPage → api.getPapers/getProjects + Zustand useAuthStore
- ✅ MaterialsPage → already used api (from lib/api.ts)
- ✅ AuthPage → authService (services layer)
- ✅ GalleryPage → spaceService (services layer)
- ✅ PublicProfilePage → spaceService (services layer)

## Build Status
- ✅ TypeScript: zero errors
- ✅ Vite build: ~1.4s, zero warnings
- ✅ E2E: 42/42 tests passing
- ✅ Deployed to EdgeOne Pages (pages-sxrzjbiboekx)
- ✅ GitHub: main branch pushed (3 commits)
- ✅ Deploy URL: https://academic-hub-v4-dcdlrsek.edgeone.cool

## TypeScript Fixes (2026-05-05)
- **api.ts**: Added `ApiResponse<T>` union type for proper success/error handling
- **AdminPage.tsx**: Added generic type to `api.updateUser()` to fix `unknown` type error
- **LoginPage.tsx**: Used `'error' in res` check for proper type narrowing on ApiResponse union type
