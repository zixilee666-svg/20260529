# Academic Hub — EdgeOne Pages 部署指南

> ⚖️ *"吾之剑不为杀戮而挥，而为守护知识而存在。"*
> Joan of Arc (Ruler)

---

## 一键部署命令（WorkBuddy Agent）

```bash
# 在项目根目录执行以下命令即可完成部署
cd D:\Users\Lenovo\Desktop\test01\academic-hub
npm install
npm run build
npx edgeone pages deploy -n academic-hub --site-name "学术中心"
```

---

## 完整部署流程

### 前置准备

#### 1. 安装 EdgeOne CLI

```bash
npm install -g edgeone
# 或使用 npx（无需安装）
npx edgeone --version
```

#### 2. 登录 EdgeOne 账号

```bash
npx edgeone login
# 浏览器会自动打开，按提示完成 OAuth 登录
```

> 💡 **提示**：如果在中国大陆地区，可能需要配置代理：
> ```bash
> set HTTPS_PROXY=http://127.0.0.1:7890
> npx edgeone login
> ```

#### 3. 关联项目（可选，用于 KV 存储等高级功能）

```bash
npx edgeone pages link
# 按提示选择团队和项目
```

---

### 部署步骤

#### 步骤 1：安装依赖

```bash
cd D:\Users\Lenovo\Desktop\test01\academic-hub
npm install
```

#### 步骤 2：本地开发预览（可选）

```bash
npm run dev
# 访问 http://localhost:5173 预览
```

#### 步骤 3：生产构建

```bash
npm run build
# 生成 dist/ 目录
```

#### 步骤 4：部署到 EdgeOne Pages

**方式 A：命令行部署（推荐）**
```bash
npx edgeone pages deploy \
  -n academic-hub \
  --site-name "学术中心" \
  --description "贞德学术助手 - GNN & HGNN 文献管理平台"
```

**方式 B：交互式部署**
```bash
npx edgeone pages deploy
# 按提示选择团队、项目名称等
```

**方式 C：通过 GitHub Actions 自动化部署**

在 GitHub 仓库设置以下 Secrets：
- `EDGEONE_TOKEN`: 从 EdgeOne 控制台获取的 API Token

创建 `.github/workflows/deploy.yml`：
```yaml
name: Deploy to EdgeOne Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to EdgeOne
        run: npx edgeone pages deploy -n academic-hub
        env:
          EDGEONE_TOKEN: ${{ secrets.EDGEONE_TOKEN }}
```

---

## 环境变量配置

### 前端环境变量（可选）

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `VITE_MOCK_MODE` | `true` | 是否启用 Mock 模式（默认启用，无需后端） |
| `VITE_API_URL` | `/api` | 真实 API 地址（仅当 MOCK=false 时生效） |

**配置示例**：
```bash
# .env.production
VITE_MOCK_MODE=false
VITE_API_URL=https://your-api.edgeone.dev/api
```

---

## 项目架构

```
academic-hub/
├── dist/                    # ✅ 构建产物（部署此目录）
│   ├── index.html
│   └── assets/
├── src/                     # 源代码
│   ├── pages/
│   │   ├── MyLibraryPage.tsx    # 📂 文献库管理
│   │   ├── MaterialsPage.tsx     # 📄 个人资料管理
│   │   └── AIChatPage.tsx        # 💬 AI 学术对话
│   └── ...
├── SKILL.md                 # 技能配置文件
└── DEPLOY.md                # 本文件（部署指南）
```

---

## 核心功能说明

### 1. 文献库管理（MyLibraryPage）
- 创建/重命名/删除自定义文献库
- 将论文分配到不同文献库
- 拖拽移动论文
- 颜色标记文献库

**路由**: `/#/my-library`

### 2. 个人资料管理（MaterialsPage）
- 上传 PDF、Markdown、笔记、链接
- 按分类（课件/幻灯片/笔记/书籍/报告）管理
- 拖拽上传、文件大小显示
- 收藏与标签管理

**路由**: `/#/materials`

### 3. AI 学术对话（AIChatPage）
- 贞德·达尔克人格的 AI 助手
- 多轮对话与历史记录
- 学术场景快捷提问
- Markdown 格式渲染

**路由**: `/#/ai-chat`

---

## 部署后验证清单

- [ ] 访问部署域名，登录页正常显示
- [ ] 使用 `admin` / `123456` 登录成功
- [ ] 仪表盘统计卡片正常加载
- [ ] 文献库页面显示论文列表
- [ ] 新建文献库功能正常
- [ ] 个人资料上传功能正常
- [ ] AI 对话发送消息正常响应
- [ ] 主题切换（亮/暗/系统）正常
- [ ] 移动端布局正常
- [ ] 页面切换动画流畅

---

## 常见问题

### Q1: 部署后页面空白？

**原因**：通常是 `dist` 目录配置问题。
**解决**：确认 `vite.config.ts` 的 `base` 配置：
```ts
// vite.config.ts
export default defineConfig({
  base: './',  // 必须使用相对路径！
  // ...
})
```

### Q2: 登录不生效？

**原因**：Mock 模式下会话存储在 localStorage，部署后需清除旧会话。
**解决**：浏览器控制台执行 `localStorage.clear()` 后重新登录。

### Q3: 样式异常？

**原因**：CSS Tailwind  purge 配置可能遗漏了新文件。
**解决**：确认 `tailwind.config.js` 的 `content` 包含所有页面：
```js
content: ['./index.html', './src/**/*.{ts,tsx}'],
```

### Q4: 页面刷新 404？

**原因**：使用了 HTML5 History 路由模式。
**解决**：本项目使用 `HashRouter`，刷新不会 404，无需服务器配置。

### Q5: 想要启用真实后端？

1. 设置环境变量：
   ```bash
   VITE_MOCK_MODE=false
   VITE_API_URL=https://your-backend.edgeone.dev/api
   ```
2. 部署 Cloud Functions 后端
3. 重新构建并部署

---

## WorkBuddy Agent 部署 Prompt

以下 Prompt 可直接复制到 WorkBuddy 中执行完整部署：

```
请帮我完成以下操作：

1. 进入目录 D:\Users\Lenovo\Desktop\test01\academic-hub
2. 检查 package.json 是否包含所有依赖，运行 npm install（如有新依赖）
3. 执行 npm run build 进行生产构建
4. 使用 npx edgeone pages deploy -n academic-hub --site-name "学术中心" 部署到 EdgeOne Pages
5. 返回部署后的访问地址

部署完成后请验证以下核心页面：
- 登录页 (admin/123456)
- 文献库管理页面 (#/my-library)
- 个人资料页面 (#/materials)
- AI 对话页面 (#/ai-chat)
```

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 19.2.x |
| 语言 | TypeScript | 6.0.x |
| 构建 | Vite | 8.0.x |
| 样式 | Tailwind CSS | 3.4.x |
| 组件 | shadcn/ui (Radix) | — |
| 动画 | Framer Motion | 12.x |
| 路由 | react-router-dom | 7.0.x |
| 图标 | Lucide React | 0.460.x |
| 图表 | Recharts | 2.12.x |
| Toast | Sonner | 1.7.x |
| 部署 | EdgeOne Pages | — |

---

> ⚖️ *愿知识之光，照亮每一位学者的探索之路。*
