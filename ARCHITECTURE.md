# Academic Hub 全栈架构设计文档 v4.0

## 一、系统概览

Academic Hub 是一个面向科研人员的学术文献管理与研究辅助平台，采用 React 19 + TypeScript 前端 + Edge Functions/Cloud Functions 后端的现代化架构，部署于 EdgeOne 边缘计算平台。

### 1.1 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| **前端** | React 19 + Vite 8 + TypeScript | HashRouter，支持 Mock/Real 双模式 |
| **API 网关** | EdgeOne Edge Functions | V8 Runtime，全球低延迟 |
| **AI 处理** | EdgeOne Cloud Functions | Node.js 18，支持 SSE 流式 |
| **数据存储** | EdgeOne KV Storage | 边缘 KV 数据库 |
| **部署** | EdgeOne Pages | CDN + 边缘计算 |
| **样式** | Tailwind CSS + shadcn/ui | 原子化 CSS |

### 1.2 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        EdgeOne CDN                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Edge Functions                         │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │   │
│  │  │  Auth   │ │ Papers  │ │Projects │ │ Libraries   │   │   │
│  │  │   API   │ │   API   │ │   API   │ │    API      │   │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └──────┬──────┘   │   │
│  └───────┼──────────┼──────────┼──────────────┼───────────┘   │
│          │          │          │              │               │
│  ┌───────┴──────────┴──────────┴──────────────┴───────────┐   │
│  │                    KV Storage                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │  Users   │ │  Papers  │ │ Projects │ │ Libraries │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └───────────────────────────────────────────────────────┘   │
│                              │                                │
│  ┌───────────────────────────┴───────────────────────────┐   │
│  │               Cloud Functions (Node.js)                 │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │              AI Chat (SSE Streaming)              │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────┘   │
│                              │                                │
│  ┌───────────────────────────┴───────────────────────────┐   │
│  │                    Frontend (SPA)                      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │   │
│  │  │ Dashboard│ │ Library │ │Research │ │   AI Chat   │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────┘   │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 二、数据模型

### 2.1 KV Storage 数据结构

```javascript
// 用户表
KV: "users:{userId}" → User
KV: "users:by-username:{username}" → userId

// 论文表
KV: "papers:{paperId}" → Paper
KV: "papers:by-user:{userId}" → [paperId, ...]
KV: "papers:index" → Set<paperId>

// 文献库表
KV: "libraries:{libId}" → Library
KV: "libraries:by-user:{userId}" → [libId, ...]

// 项目表
KV: "projects:{projId}" → Project
KV: "projects:by-user:{userId}" → [projId, ...]

// 个人资料表
KV: "materials:{matId}" → Material
KV: "materials:by-user:{userId}" → [matId, ...]

// 设置表
KV: "settings:{userId}" → UserSettings

// 统计表
KV: "stats:{userId}" → ReadingStats
```

### 2.2 类型定义（对应前端 types/index.ts）

```typescript
interface User {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string | null;
  email?: string;
  institution?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  venueType: 'journal' | 'conference' | 'preprint';
  abstract: string;
  keywords: string[];
  tags: string[];
  isFavorited: boolean;
  isRead?: boolean;
  readingStatus?: 'unread' | 'reading' | 'completed';
  addedAt: string;
  // ... 更多字段见前端 types
}

interface Library {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  paperIds: string[];
  createdAt: string;
  isDefault?: boolean;
}

interface Project {
  id: string;
  name?: string;
  title?: string;
  description: string;
  status: 'in-progress' | 'completed' | 'planned' | 'active';
  goalCount?: number;
  completedGoals?: number;
  paperIds?: string[];
  createdAt: string;
}

interface Material {
  id: string;
  title: string;
  type: MaterialType;
  category: MaterialCategory;
  description?: string;
  content?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
}
```

## 三、API 设计

### 3.1 API 路由总览

| 方法 | 路径 | 说明 | 运行时 |
|------|------|------|--------|
| POST | /api/auth/login | 用户登录 | Edge |
| POST | /api/auth/register | 用户注册 | Edge |
| GET | /api/auth/me | 获取当前用户 | Edge |
| POST | /api/auth/logout | 用户登出 | Edge |
| GET | /api/papers | 获取论文列表 | Edge |
| POST | /api/papers | 创建论文 | Edge |
| GET | /api/papers/:id | 获取论文详情 | Edge |
| PUT | /api/papers/:id | 更新论文 | Edge |
| DELETE | /api/papers/:id | 删除论文 | Edge |
| POST | /api/papers/:id/favorite | 切换收藏 | Edge |
| GET | /api/libraries | 获取文献库列表 | Edge |
| POST | /api/libraries | 创建文献库 | Edge |
| GET | /api/libraries/:id | 获取文献库详情 | Edge |
| PUT | /api/libraries/:id | 更新文献库 | Edge |
| DELETE | /api/libraries/:id | 删除文献库 | Edge |
| POST | /api/libraries/:id/papers | 添加论文到库 | Edge |
| GET | /api/projects | 获取项目列表 | Edge |
| POST | /api/projects | 创建项目 | Edge |
| GET | /api/projects/:id | 获取项目详情 | Edge |
| PUT | /api/projects/:id | 更新项目 | Edge |
| DELETE | /api/projects/:id | 删除项目 | Edge |
| GET | /api/materials | 获取资料列表 | Edge |
| POST | /api/materials | 创建资料 | Edge |
| GET | /api/materials/:id | 获取资料详情 | Edge |
| PUT | /api/materials/:id | 更新资料 | Edge |
| DELETE | /api/materials/:id | 删除资料 | Edge |
| GET | /api/settings | 获取用户设置 | Edge |
| PUT | /api/settings | 更新用户设置 | Edge |
| GET | /api/stats/reading | 获取阅读统计 | Edge |
| GET | /api/search/arxiv | 搜索 arXiv | Edge |
| POST | /api/ai/chat | AI 对话 (SSE) | Cloud |

### 3.2 认证流程

```
┌──────────┐    POST /api/auth/login     ┌──────────┐
│  Client  │ ──────────────────────────▶ │   Edge   │
│          │                              │ Function │
└──────────┘                              └────┬─────┘
       │                                        │
       │  { token, user }                       │
       │ ◀─────────────────────────────────────┤
       │                                        │
       │  Authorization: Bearer {token}         │
       ▼                                        ▼
┌──────────┐                            ┌──────────┐
│  Client  │ ──────────────────────────▶ │   Edge   │
│  Storage │  JWT 验证 + 数据访问        │ Function │
└──────────┘                              └──────────┘
```

### 3.3 错误响应格式

```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

## 四、部署架构

### 4.1 部署配置 (pages.config.json)

```json
{
  "version": 2,
  "routes": [
    {
      "path": "/api/*",
      "runtime": "edge",
      "target": "./edge-functions"
    },
    {
      "path": "/ai/*",
      "runtime": "node",
      "target": "./cloud-functions"
    },
    {
      "path": "/*",
      "target": "./dist"
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "./dist"
}
```

### 4.2 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| JWT_SECRET | JWT 签名密钥 (≥32字符) | academic-hub-secret-2026 |
| JWT_EXPIRES_IN | Token 过期时间 | 7d |
| ADMIN_USERNAME | 默认管理员用户名 | admin |
| ADMIN_PASSWORD | 默认管理员密码 | 123456 |
| AI_API_KEY | AI 服务 API Key | sk-xxx |

## 五、安全设计

### 5.1 认证安全

- JWT Token 使用 HS256 算法签名
- Token 有效期 7 天（可配置）
- 密码使用 bcrypt 哈希存储

### 5.2 数据安全

- 所有 API 需要认证（除 /auth/login, /auth/register）
- 用户只能访问自己的数据
- CORS 跨域配置

### 5.3 输入验证

- 所有输入进行合法性校验
- SQL 注入防护（KV 存储天然免疫）
- XSS 防护（JSON 响应）

## 六、性能优化

### 6.1 边缘计算

- Edge Functions 运行在全球边缘节点
- 亚太区域延迟 < 50ms
- 自动弹性扩缩容

### 6.2 前端优化

- 构建时确定 Mock/Real 模式
- 静态资源 CDN 分发
- 按需加载路由组件

## 七、扩展性设计

### 7.1 微服务架构

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐  │
│  │  Auth   │ │ Papers  │ │Projects │ │   AI Chat   │  │
│  │ Service │ │ Service │ │ Service │ │   Service   │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └──────┬──────┘  │
│       └───────────┴──────────┴──────────────┘         │
│                          │                             │
│              ┌───────────┴───────────┐                   │
│              │    KV Storage        │                   │
│              │  (Users, Papers, ...) │                  │
│              └───────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### 7.2 水平扩展

- Edge Functions 无状态，可水平扩展
- KV Storage 自动分片
- Cloud Functions 按需计费

---

*文档版本: v4.0*
*更新日期: 2026-04-26*
