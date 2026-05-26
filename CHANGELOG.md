# Academic Hub v4 → v5.0 优化日志

## 构建状态: ✅ 编译通过 | 零TypeScript错误 | 1.27s构建时间

---

## 一、架构变更

### 1. 状态管理: React Context → Zustand
- **新增** `src/store/authStore.ts` — 认证状态(token/user/isAuthenticated)
- **新增** `src/store/themeStore.ts` — 主题状态(mode/resolvedMode) + useThemeSync DOM同步hook
- **新增** `src/store/userStore.ts` — 用户偏好(citationFormat/notifications)
- **新增** `src/store/index.ts` — 统一导出
- **移除** Context依赖: AuthContext/ThemeContext/SettingsContext仍保留但不再作为主要状态源

### 2. API服务层重构
- **新增** `src/services/api.ts` — 基础fetch封装(JWT、401自动跳转、统一错误处理)
- **新增** 11个专用service文件:
  - `authService.ts` — 登录/注册/用户信息/登出
  - `paperService.ts` — 论文CRUD/收藏/笔记/高亮
  - `libraryService.ts` — 文献库CRUD/论文管理
  - `projectService.ts` — 项目CRUD
  - `materialService.ts` — 资料CRUD/收藏
  - `chatService.ts` — AI对话SSE流式 + 对话管理
  - `settingsService.ts` — 设置读写
  - `statsService.ts` — 阅读统计
  - `searchService.ts` — arXiv/CrossRef搜索/导入
  - `adminService.ts` — 管理后台API
  - `spaceService.ts` — 多租户空间/Gallery

### 3. 路由重构
- **公开路由**: `/` (Gallery), `/login` (登录+注册), `/u/:username` (公开空间)
- **用户路由**: `/dashboard/*` (所有功能页面)
- **管理员路由**: `/admin` (管理后台)
- **兼容路由**: `/legacy/*` (旧路由重定向)

---

## 二、后端API补全

### 新增Edge Functions (14个)
| 端点 | 文件 | 功能 |
|------|------|------|
| GET/PUT/DELETE `/api/libraries/:id` | `libraries/[id].js` | 文献库详情管理 |
| POST/DELETE `/api/libraries/:id/papers` | `libraries/[id]/papers.js` | 文献库论文关联 |
| GET/POST `/api/materials` | `materials/index.js` | 资料列表/创建 |
| GET/PUT/DELETE `/api/materials/:id` | `materials/[id].js` | 资料详情/收藏 |
| GET/POST `/api/chats` | `chats/index.js` | AI对话列表/创建 |
| GET/PUT/DELETE `/api/chats/:id` | `chats/[id].js` | AI对话详情管理 |
| GET `/api/spaces` | `spaces/index.js` | Gallery公开空间列表 |
| GET/POST `/api/spaces/:username` | `spaces/[username]/index.js` | 公开空间详情/记录浏览 |
| GET `/api/admin/stats` | `admin/stats.js` | 系统统计概览 |
| GET `/api/admin/users` | `admin/users.js` | 用户管理列表 |
| GET/PUT `/api/admin/users/:id` | `admin/users/[id].js` | 用户详情/状态管理 |
| GET `/api/admin/logs` | `admin/logs.js` | 操作日志 |
| GET `/api/search/crossref` | `search/crossref.js` | CrossRef搜索 |
| POST `/api/search/import` | `search/import.js` | 搜索结果导入 |

### 配置更新
- **pages.config.json**: 新增 `/api/materials/*`, `/api/chats/*`, `/api/spaces/*`, `/api/admin/*` 路由

---

## 三、新前端页面

| 页面 | 文件 | 功能 |
|------|------|------|
| 认证页 | `src/pages/AuthPage.tsx` | 登录+注册双Tab切换 |
| 学术广场 | `src/pages/GalleryPage.tsx` | 公开空间卡片墙(搜索/筛选/排序/分页) |
| 公开空间 | `src/pages/PublicProfilePage.tsx` | /u/:username 学术主页(论文/项目/关于) |

### 新通用组件
| 组件 | 文件 | 功能 |
|------|------|------|
| 路由守卫 | `components/common/RequireAuth.tsx` | JWT认证检查 |
| 管理员守卫 | `components/common/RequireAdmin.tsx` | Admin角色检查 |
| 加载组件 | `components/common/Loading.tsx` | 通用加载状态 |
| 分页组件 | `components/common/Pagination.tsx` | 通用分页器 |

---

## 四、类型系统扩展

在 `src/types/index.ts` 新增:
- `SpaceConfig` — 多租户空间配置
- `SpaceTheme` — 自定义主题
- `AdminStats` — 管理统计(含系统健康状态)

---

## 五、文件统计

| 类别 | 新增 | 修改 | 总计 |
|------|------|------|------|
| 前端页面 | 3 | 0 | 14 |
| 组件 | 4 | 1 | 20+ |
| Store | 4 | 0 | 4 |
| Services | 13 | 0 | 13 |
| Edge Functions | 14 | 0 | 27 |
| 配置文件 | 0 | 3 | 5 |
| **总计** | **38** | **4** | **42+** |

---

## 六、后续优化建议

以下功能已搭建架构但未完全实现(现有页面仍部分使用seed data):

1. **现有页面API对接**: DashboardPage/LibraryPage/PaperDetailPage/ResearchPage/SettingsPage/AIChatPage/ImportExportPage/MyLibraryPage/MaterialsPage/AdminPage 需逐步迁移到使用services层API
2. **管理后台子页面**: AdminUsers/AdminSpaces等独立页面
3. **AI Chat SSE流式**: 集成react-markdown + KaTeX + 代码高亮
4. **notes/highlights持久化**: 后端端点已就位, 前端PaperDetailPage需对接
5. **密码哈希**: 当前后端仍为明文密码存储
6. **AI端点认证**: cloud-functions/api/ai.js需添加JWT校验
7. **CORS配置**: 从通配符改为可配置域名
