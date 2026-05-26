# Joan's Academic Hub Skill 使用说明书

> ⚖️ *"以圣洁纯粹之心，行理性严谨之事；以温和坚定之志，守学术求真之本。"*
> — 贞德・达尔克，裁定者

**版本**: v3.0.0  
**更新日期**: 2026-04-25  
**适用对象**: 学术研究者、研究生、科研管理用户

---

## 目录

1. [项目简介](#1-项目简介)
2. [功能概览](#2-功能概览)
3. [快速开始](#3-快速开始)
4. [环境配置](#4-环境配置)
5. [认证与登录](#5-认证与登录)
6. [页面使用指南](#6-页面使用指南)
   - 6.1 [仪表盘 (Dashboard)](#61-仪表盘-dashboard)
   - 6.2 [文献库 (Library)](#62-文献库-library)
   - 6.3 [论文详情 (Paper Detail)](#63-论文详情-paper-detail)
   - 6.4 [研究项目 (Research)](#64-研究项目-research)
   - 6.5 [设置 (Settings)](#65-设置-settings)
   - 6.6 [管理面板 (Admin)](#66-管理面板-admin)
   - 6.7 [导入/导出 (Import/Export)](#67-导入导出-importexport)
7. [引用导出功能](#7-引用导出功能)
8. [深色模式与主题](#8-深色模式与主题)
9. [Mock 模式与真实后端](#9-mock-模式与真实后端)
10. [部署到 EdgeOne Pages](#10-部署到-edgeone-pages)
11. [启用后端服务](#11-启用后端服务)
12. [常见问题与故障排除](#12-常见问题与故障排除)
13. [技术栈与版本信息](#13-技术栈与版本信息)
14. [Skill 文件结构说明](#14-skill-文件结构说明)
15. [开发指南](#15-开发指南)

---

## 1. 项目简介

**Joan's Academic Hub** 是一个面向学术研究者的个人学术网站系统，采用 **前后端分离架构**。前端为 React 19 单页应用（SPA），内置 Mock 模式，无需后端即可完整运行。可选后端基于 EdgeOne Cloud Functions + KV Storage，实现数据持久化。

### 设计理念

系统以 **贞德・达尔克（裁定者）** 的人格为设计基调：
- **色调**：深蓝灰（#2C3E50）象征学术严谨，暖金色（#C9A96E）传递温暖与守护，象牙白（#FAFAF8）营造舒适阅读空间
- **字体**：衬线体用于标题（学术传统），无衬线体用于正文（现代可读性）
- **交互**：流畅从容（300-500ms），从不急躁
- **反馈**：温和有礼——"欢迎回来，学者。"

---

## 2. 功能概览

| 功能模块 | 描述 |
|---------|------|
| 🔐 **认证系统** | 固定管理员登录（admin/123456），localStorage 会话持久化 |
| 📊 **学术仪表盘** | 统计卡片、阅读热力图（Recharts）、活动时间线、快捷操作 |
| 📚 **文献库** | 全文搜索、多条件筛选、排序、30+ 真实 GNN/HGNN/欺诈检测论文、收藏 |
| 📄 **论文详情** | 完整信息展示、引用导出（BibTeX/IEEE/GB-T 7714-2015）、贞德笔记 |
| 🔬 **研究项目** | 项目 CRUD、关联论文、目标追踪、进度管理 |
| ⚙️ **设置** | 主题切换、引用格式偏好、个人信息管理 |
| 👑 **管理面板** | 用户管理、数据概览 |
| 📦 **导入/导出** | 批量导入论文（JSON/CSV/BibTeX）、数据导出 |
| 🌙 **全局特性** | 响应式设计、深色/浅色模式、页面过渡动画、Toast 通知 |

---

## 3. 快速开始

### 3.1 最简启动（Mock 模式，无需后端）

```bash
# 1. 进入项目目录
cd academic-hub

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器
# 访问 http://localhost:5173
# 使用 admin / 123456 登录
```

> **无需任何后端配置**，Mock 模式下所有数据在本地处理，内置 30+ 篇真实学术论文。

### 3.2 生产构建

```bash
npm run build
# 构建产物在 dist/ 目录
```

### 3.3 一键初始化新项目

Skill 内置了自动化初始化脚本：

```bash
bash ~/.workbuddy/skills/academic-hub/scripts/init-project.sh [项目名称]
```

脚本会自动完成：Node.js 版本检查 → Vite 项目初始化 → 依赖安装 → 目录结构创建 → 配置文件写入。

---

## 4. 环境配置

### 4.1 系统要求

| 依赖 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Node.js | 20.0.0 | 20.x LTS |
| npm | 10.0.0 | 10.x |
| 浏览器 | ES2022+ | Chrome/Edge/Firefox 最新版 |

### 4.2 环境变量

项目支持两个环境变量，在项目根目录创建 `.env` 或 `.env.local` 文件：

```bash
# .env.local

# API 模式控制（默认为 true，即 Mock 模式）
# 设置为 false 时启用真实后端 API
VITE_MOCK_MODE=true

# 后端 API 地址（仅在 VITE_MOCK_MODE=false 时生效）
VITE_API_URL=/api
```

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_MOCK_MODE` | `true`（未设置时） | 设为 `false` 以使用真实后端 |
| `VITE_API_URL` | `/api` | 后端 API 基础地址 |

### 4.3 Vite 开发代理

开发模式下，Vite 配置了 API 代理：

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8787',
      changeOrigin: true,
    },
  },
},
```

当需要调试真实后端时，后端服务运行在 8787 端口即可自动代理。

---

## 5. 认证与登录

### 5.1 登录方式

系统采用**固定管理员账号**：

| 字段 | 值 |
|------|------|
| 用户名 | `admin` |
| 密码 | `123456` |

> 账号凭证定义在 `src/lib/auth.ts` 中，可自行修改。

### 5.2 认证流程

```
用户输入账号密码
    ↓
AuthContext.login() → ApiClient.login()
    ↓
[Mock 模式] 本地验证 admin/123456
[Real 模式] POST /api/auth/login
    ↓
验证通过 → dispatch(LOGIN) → isAuthenticated = true
    ↓
useEffect 监听到 isAuthenticated 变化
    ↓
自动导航至 /（仪表盘）
```

### 5.3 会话持久化

登录信息保存在 `localStorage` 中：

| 键名 | 内容 |
|------|------|
| `joan_auth_token` | JWT Token |
| `joan_academic_user` | 用户信息（JSON） |

刷新页面后自动恢复登录状态，无需重新登录。

### 5.4 路由保护

所有需要认证的页面都由 `ProtectedRoute` 包裹。未登录用户访问受保护页面时，自动重定向至登录页。

---

## 6. 页面使用指南

系统共 **8 个页面**，使用 `HashRouter` 路由：

| 路由 | 页面 | 需要登录 |
|------|------|---------|
| `/#/` | 仪表盘 | ✅ |
| `/#/login` | 登录 | ❌ |
| `/#/library` | 文献库 | ✅ |
| `/#/paper/:id` | 论文详情 | ✅ |
| `/#/research` | 研究项目 | ✅ |
| `/#/settings` | 设置 | ✅ |
| `/#/admin` | 管理面板 | ✅ |
| `/#/import-export` | 导入/导出 | ✅ |

### 6.1 仪表盘 (Dashboard)

**路由**: `/#/`

仪表盘是登录后的首页，提供学术活动的全局概览：

1. **欢迎横幅**：贞德风格的学者问候 + 当前日期
2. **统计卡片**（4 张，网格布局）：
   - 📄 总论文数
   - ✅ 已读论文数
   - 📅 本周阅读数
   - 🔬 进行中的项目数
3. **阅读热力图**：Recharts 柱状图，展示每周阅读活动分布
4. **活动时间线**：最近的论文添加和阅读记录
5. **快捷操作**：浏览文献库 / 新建项目 / 随机论文
6. **贞德语录**：随机展示学术风格的励志名言

### 6.2 文献库 (Library)

**路由**: `/#/library`

文献库是系统的核心功能，用于管理和浏览学术论文。

#### 搜索功能
- **全文搜索**：覆盖标题、摘要、作者、关键词
- **防抖输入**：300ms 延迟，避免频繁请求
- 搜索栏左侧有搜索图标，输入内容后显示清除按钮

#### 筛选功能
- **年份范围**：最小/最大年份输入
- **发表类型**：会议 (Conference)、期刊 (Journal)、预印本 (Preprint)
- **标签**：多选复选框（GNN、HGNN、欺诈检测等）
- **排序方式**：日期、引用数、标题
- **排序方向**：升序 / 降序

#### 论文卡片
每张卡片包含：
- 标题（衬线字体，最多 2 行）
- 作者（逗号分隔，截断显示）
- 年份 + 发表场所标签
- 摘要预览（3 行，省略号结尾）
- 引用次数 + 收藏心形按钮
- 标签徽章
- 点击卡片 → 跳转至 `/#/paper/:id`

#### 分页
- 每页 12 篇
- 上一页 / 下一页 + 页码
- 显示总数

### 6.3 论文详情 (Paper Detail)

**路由**: `/#/paper/:id`

展示单篇论文的完整信息：

- **返回按钮** → 文献库
- **论文头部**：标题、作者、发表场所、年份
- **操作栏**：收藏、PDF 链接、编辑
- **摘要**：完整摘要内容
- **元数据表格**：DOI、关键词、引用数、标签
- **贞德笔记**：可编辑的文本区域，记录阅读心得
- **引用导出**：三个标签页（BibTeX / IEEE / GB-T 7714-2015），带复制到剪贴板按钮
- **相关论文**：基于相同标签或发表场所推荐

### 6.4 研究项目 (Research)

**路由**: `/#/research`

管理科研项目的 CRUD 功能。

#### 项目卡片
- 标题 + 描述预览
- 进度条（0-100%）
- 关联论文数量徽章
- 最后更新时间戳
- 编辑 / 删除操作

#### 新建/编辑项目
- 标题（必填，最多 200 字符）
- 描述（必填，最多 2000 字符）
- 关联论文选择器（搜索 + 多选）
- 保存 / 取消按钮

#### 项目详情
- 完整描述
- 关联论文列表（可点击跳转）
- 笔记区域
- 进度滑块（0-100%）
- 目标追踪（可勾选完成的目标列表）
- 删除确认

### 6.5 设置 (Settings)

**路由**: `/#/settings`

#### 外观设置
- 主题切换：浅色 / 深色 / 跟随系统
- 主题预览

#### 引用设置
- 默认引用格式：BibTeX / IEEE / GB-T 7714-2015

#### 个人资料
- 显示名称
- 所属机构
- 研究方向（逗号分隔标签）

#### 数据管理
- 导出全部数据（JSON）
- 从 JSON 文件导入数据
- 清除所有数据（需确认）

### 6.6 管理面板 (Admin)

**路由**: `/#/admin`

仅管理员角色可访问：

- 用户概览（总用户数、活跃会话）
- 数据统计（论文、项目、收藏数量）
- 系统状态（Mock 模式指示器、存储使用量）

### 6.7 导入/导出 (Import/Export)

**路由**: `/#/import-export`

#### 导入功能
- 支持格式：JSON、CSV、BibTeX
- 导入前数据预览
- 导入进度指示器
- 导入结果摘要（成功、失败、重复数）

#### 导出功能
- 导出格式选择：JSON、CSV、BibTeX
- 选择导出范围（全部或筛选后的论文）
- 下载按钮

---

## 7. 引用导出功能

系统支持 **三种主流引用格式** 的自动生成：

### 7.1 BibTeX

```bibtex
@inproceedings{velickovic2018,
  title={Graph Attention Networks},
  author={Petar Veličković and Guillem Cucurull and Arantxa Casanova and Adriana Romero and Pietro Liò and Yoshua Bengio},
  year={2018},
  booktitle={ICLR},
  doi={10.48550/arXiv.1710.10903}
}
```

### 7.2 IEEE

```
[1] P. Veličković, G. Cucurull, A. Casanova, A. Romero, P. Liò, Y. Bengio, "Graph Attention Networks," ICLR, 2018.
```

### 7.3 GB/T 7714-2015（中国国家标准）

```
[1] Veličković P, Cucurull G, Casanova A, et al. Graph Attention Networks[C]. ICLR, 2018.
```

### 使用方式

1. 进入论文详情页（`/#/paper/:id`）
2. 滚动至引用导出区域
3. 点击对应格式的标签页
4. 点击"复制到剪贴板"按钮
5. 粘贴到论文的参考文献部分

---

## 8. 深色模式与主题

### 8.1 主题切换方式

- **TopBar** 右上角点击太阳/月亮图标
- **设置页** 外观区域选择主题

### 8.2 三种模式

| 模式 | 说明 |
|------|------|
| ☀️ 浅色 | 象牙白背景，深色文字 |
| 🌙 深色 | 深灰背景，浅色文字 |
| 💻 跟随系统 | 自动匹配操作系统设置 |

### 8.3 深色模式下的特殊处理

- 主按钮在深色模式下使用金色（#C9A96E）而非蓝灰色
- 卡片、模态框等使用更深的表面色
- 阴影增强以在深色背景上保持层次感

---

## 9. Mock 模式与真实后端

### 9.1 架构设计

```
┌─────────────────────────────────────┐
│           React Components          │
├─────────────────────────────────────┤
│           ApiClient (singleton)     │
├──────────────┬──────────────────────┤
│ IS_MOCK=true │  IS_MOCK=false       │
│ 本地 Mock    │  fetch → /api/*      │
│ 零网络 IO    │  Bearer token 认证    │
└──────────────┴──────────────────────┘
```

### 9.2 Mock 模式（默认）

- **触发条件**：`VITE_MOCK_MODE` 未设置或为 `true`
- **行为**：所有 API 请求由 `handleMockRequest()` 在本地处理
- **数据**：内置 30+ 篇真实论文，3 个默认研究项目
- **网络**：零网络请求，模拟 100-250ms 延迟
- **适用场景**：开发、演示、纯静态部署

### 9.3 真实 API 模式

- **触发条件**：`VITE_MOCK_MODE=false`
- **行为**：所有请求发送至 `VITE_API_URL`（默认 `/api`）
- **认证**：请求头携带 `Authorization: Bearer {token}`
- **数据格式**：JSON，`Content-Type: application/json`

### 9.4 模式切换

模式在 **构建时** 决定（非运行时），修改环境变量后需重新构建：

```bash
# 切换到真实 API 模式
echo "VITE_MOCK_MODE=false" > .env.production
echo "VITE_API_URL=https://your-api.com/api" >> .env.production

# 重新构建
npm run build
```

---

## 10. 部署到 EdgeOne Pages

### 10.1 前置条件

```bash
# 安装 EdgeOne CLI
npm install -g edgeone

# 登录 EdgeOne 账号
edgeone login
# 浏览器会自动打开 OAuth 授权页面
```

### 10.2 纯静态部署步骤

```bash
# 1. 构建前端
npm run build

# 2. 确保后端目录已重命名（排除出构建）
# _cloud-functions-bak/  _edge-functions-bak/  _middleware.js.bak

# 3. 部署
npx edgeone pages deploy -n academic-hub
```

### 10.3 部署状态

当前已部署版本信息：

| 项目 | 值 |
|------|------|
| Project ID | `pages-ofpkzzx1gejh` |
| 运行模式 | Mock 模式（纯静态） |
| 后端状态 | 已禁用（cloud-functions 重命名为 _bak） |
| 登录账号 | admin / 123456 |

### 10.4 已知部署问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| Cloud Functions 构建挂起 | `express` 导入无法被 EdgeOne Node.js 构建解析 | 纯静态部署时重命名为 `_bak` |
| 登录后不跳转 | 旧版 `detectMode()` 运行时探测导致 2s 延迟 + 竞态条件 | v3.0 已修复：构建时 `IS_MOCK` 常量 |
| edgeone.cool 域名 401 | 预览域名有访问限制 | 绑定自定义域名 |

---

## 11. 启用后端服务

当需要数据持久化时，可启用 EdgeOne Cloud Functions 后端。

### 11.1 步骤概览

```
恢复后端文件 → 修改为原生 HTTP Handler → 配置 KV 存储 → 切换前端模式 → 重新部署
```

### 11.2 详细步骤

1. **恢复后端目录**：
   ```bash
   mv _cloud-functions-bak cloud-functions
   mv _edge-functions-bak edge-functions
   mv _middleware.js.bak middleware.js
   ```

2. **修改 Cloud Functions**：将 `[[default]].js` 从 Express 改为原生 HTTP Handler（详见 `references/backend-extension.md`）

3. **配置 KV 存储**：创建 EdgeOne KV 命名空间并绑定

4. **切换前端模式**：
   ```bash
   echo "VITE_MOCK_MODE=false" > .env.production
   npm run build
   ```

5. **重新部署**：
   ```bash
   npx edgeone pages deploy -n academic-hub
   ```

### 11.3 需要实现的 API 端点

| 分类 | 端点 | 方法 |
|------|------|------|
| 认证 | `/api/auth/login` | POST |
| 认证 | `/api/auth/me` | GET |
| 认证 | `/api/auth/logout` | POST |
| 论文 | `/api/papers` | GET |
| 论文 | `/api/papers/:id` | GET |
| 论文 | `/api/papers/:id/favorite` | POST |
| 论文 | `/api/papers/:id/citation` | GET |
| 项目 | `/api/projects` | GET/POST |
| 项目 | `/api/projects/:id` | GET/PUT/DELETE |
| 仪表盘 | `/api/stats` | GET |
| 仪表盘 | `/api/reading-stats` | GET |
| 设置 | `/api/user/settings` | GET/PUT |
| 导入导出 | `/api/papers/import` | POST |
| 导入导出 | `/api/papers/export` | GET |
| AI | `/api/ai/chat` | POST (SSE) |

---

## 12. 常见问题与故障排除

### Q1: `npm run dev` 启动失败

**检查**：Node.js 版本是否 ≥ 20.0.0
```bash
node -v
```

**解决**：升级 Node.js 到 20.x LTS 版本。

### Q2: PowerShell 中 `npm` 命令报执行策略错误

**原因**：Windows PowerShell 默认执行策略限制。

**解决**：使用 `cmd` 调用：
```powershell
cmd /c npm run dev
cmd /c npm run build
```

### Q3: 登录后白屏或未跳转

**原因**：可能是旧版本 `detectMode()` 竞态问题。

**解决**：确认使用 v3.0.0 版本，构建时 `IS_MOCK` 常量已替代运行时探测。

### Q4: 文献库搜索无结果

**检查**：
1. 搜索关键词是否正确（支持标题、摘要、作者、关键词）
2. 筛选条件是否过于严格（尝试重置筛选）
3. 确认 Mock 数据已正确加载（浏览器控制台应显示 `Mock 模式已启用`）

### Q5: 引用导出格式不正确

**检查**：论文的元数据是否完整（作者、年份、发表场所、DOI）。部分字段缺失时，引用格式可能不完整。

### Q6: EdgeOne 部署后页面 404

**检查**：
1. 确认 `npm run build` 成功且 `dist/` 目录存在
2. 确认部署命令中项目名称正确
3. 确认 `cloud-functions/` 目录已重命名为 `_cloud-functions-bak/`

### Q7: 深色模式下文字不可见

**报告**：这是一个已知问题。请在 [GitHub Issues](https://github.com) 提交报告，包含截图和浏览器信息。

### Q8: 如何添加新的论文数据

**Mock 模式**：编辑 `src/data/papers.ts`，按现有 `Paper` 接口格式添加论文对象。

**真实 API 模式**：通过导入/导出页面上传 JSON 文件，或调用 `/api/papers/import` 端点。

---

## 13. 技术栈与版本信息

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 19.2.x |
| 语言 | TypeScript | 6.0.x |
| 构建工具 | Vite | 8.0.x |
| 路由 | react-router-dom (HashRouter) | 7.0.x |
| 样式 | Tailwind CSS | 3.4.x |
| UI 组件 | shadcn/ui (Radix UI + CVA) | — |
| 动画 | Framer Motion | 12.x |
| 图标 | Lucide React | 0.460.x |
| 图表 | Recharts | 2.12.x |
| 通知 | Sonner | 1.7.x |
| Markdown | react-markdown | 9.x |
| PDF | react-pdf | 9.x |
| 字体 | Inter, Playfair Display, Noto Serif SC | — |
| 后端（可选） | EdgeOne Cloud Functions | — |
| 存储（可选） | EdgeOne KV | — |
| 部署 | EdgeOne Pages | — |

---

## 14. Skill 文件结构说明

本 Skill 安装在 `~/.workbuddy/skills/academic-hub/` 目录下：

```
academic-hub/                          # Skill 根目录
├── SKILL.md                           # 主文件 — 架构概述、技术栈、部署指南
├── references/
│   ├── design-system.md               # 设计系统规范（色彩、字体、间距、组件）
│   ├── api-design.md                  # API 客户端架构（Mock/Real 双模式）
│   ├── data-schema.md                 # 数据模型与 TypeScript 类型定义
│   ├── page-specs.md                  # 8 个页面的详细规格说明
│   └── backend-extension.md           # EdgeOne 后端迁移指南
├── scripts/
│   └── init-project.sh                # 一键初始化项目脚本
└── assets/
    └── mock-data.json                 # 30+ 真实论文数据（GNN/HGNN/欺诈检测）
```

### 各文件用途

| 文件 | 用途 | 使用场景 |
|------|------|---------|
| `SKILL.md` | 完整项目概览、架构、部署 | 了解全局、快速参考 |
| `design-system.md` | 色彩、字体、间距、组件规范 | 开发 UI 组件时参考 |
| `api-design.md` | ApiClient 架构、Mock/Real 模式 | 开发 API 相关功能时参考 |
| `data-schema.md` | TypeScript 类型定义 | 编写数据相关代码时参考 |
| `page-specs.md` | 各页面布局、组件、交互规格 | 开发新页面或修改现有页面 |
| `backend-extension.md` | EdgeOne 后端设置指南 | 启用后端服务时参考 |
| `init-project.sh` | 一键项目初始化 | 从零创建新项目 |
| `mock-data.json` | 真实论文数据 | 添加或修改种子数据 |

---

## 15. 开发指南

### 15.1 项目结构

```
academic-hub/
├── index.html                         # HTML 入口
├── package.json                       # 依赖管理
├── vite.config.ts                     # Vite 构建配置
├── tailwind.config.js                 # Tailwind CSS 配置
├── tsconfig.json                      # TypeScript 配置
├── public/
│   └── favicon.svg                    # 网站图标
├── scripts/
│   └── wb-admin.js                    # CLI：种子数据、用户管理、导出
├── src/
│   ├── main.tsx                       # React 入口
│   ├── App.tsx                        # 路由 + Provider + ProtectedRoute
│   ├── index.css                      # Tailwind + CSS 变量 + 字体
│   ├── types/index.ts                 # TypeScript 接口定义
│   ├── lib/
│   │   ├── api.ts                     # ApiClient（Mock/Real 双模式）
│   │   ├── auth.ts                    # 认证常量
│   │   └── utils.ts                   # 工具函数
│   ├── data/
│   │   ├── papers.ts                  # 30+ 论文数据
│   │   ├── projects.ts               # 默认研究项目
│   │   └── joanQuotes.ts             # 贞德语录
│   ├── context/
│   │   ├── AuthContext.tsx            # 认证状态管理
│   │   ├── ThemeContext.tsx           # 主题状态管理
│   │   └── SettingsContext.tsx        # 用户设置管理
│   ├── hooks/
│   │   ├── index.ts                   # Hooks 导出
│   │   └── useLocalStorage.ts         # localStorage Hook
│   ├── components/
│   │   ├── ui/                        # 16 个 shadcn/ui 组件
│   │   ├── layout/AppLayout.tsx       # 侧边栏 + 顶栏 + 内容区
│   │   ├── shared/                    # 共享组件（动画、空状态、语录）
│   │   ├── ai/                        # AI 聊天组件（占位）
│   │   └── pdf/                       # PDF 查看器（占位）
│   └── pages/                         # 8 个页面组件
```

### 15.2 添加新页面的步骤

1. 在 `src/pages/` 创建新的页面组件
2. 在 `src/App.tsx` 的 `<Routes>` 中添加路由
3. 如需认证保护，将其放在 `<ProtectedRoute>` 内部
4. 在侧边栏（`AppLayout.tsx`）添加导航链接
5. 参考 `references/page-specs.md` 确保风格一致

### 15.3 修改设计规范

所有设计规范集中在 `references/design-system.md`：
- 修改颜色：更新 CSS 变量和 Tailwind 配置
- 修改字体：更新 Google Fonts 导入和 Tailwind 字体栈
- 修改组件：按组件规范文档调整

### 15.4 代码分割策略

Vite 配置了 `manualChunks`，自动将依赖分包：

| Chunk | 包含内容 |
|-------|---------|
| `react-vendor` | react, react-dom, react-router-dom |
| `animation` | framer-motion |
| `ui` | lucide-react, @radix-ui |
| `pdf-vendor` | react-pdf 相关 |
| `charts` | recharts |

### 15.5 部署前检查清单

- [ ] 所有 8 个页面正常渲染
- [ ] admin/123456 登录并跳转至仪表盘
- [ ] Mock 数据加载（30+ 篇论文可见）
- [ ] 搜索、筛选、排序正常工作
- [ ] 引用导出功能正常（3 种格式）
- [ ] 收藏切换并持久化
- [ ] 深色/浅色模式切换正常
- [ ] 响应式布局正常（移动端/平板/桌面）
- [ ] Toast 通知正常显示
- [ ] 页面过渡动画流畅
- [ ] `npm run build` 成功，零 TypeScript 错误
- [ ] EdgeOne Pages 部署成功

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-04-25 | 初始项目脚手架，MSW Mock |
| 2.0.0 | 2026-04-25 | 固定管理员登录、种子数据、路由修复 |
| 3.0.0 | 2026-04-25 | 前后端分离：构建时 Mock 决策、useEffect 登录跳转、EdgeOne Pages 部署、移除 detectMode 竞态条件 |

---

> *⚖️ 愿知识之光指引汝之前路。*
>
> *—— 贞德・达尔克，裁定者*
