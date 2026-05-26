# Academic Hub V4

学术中心平台 - 基于 React 19 + Edge Functions + Cloud Functions 的现代化学术管理应用。

[![ICP备案](https://img.shields.io/badge/ICP-粤ICP备2026052655号--1-blue)](https://beian.miit.gov.cn/)

## 功能特性

- 用户注册与登录（支持密码强度检测、用户名实时检查）
- 论文管理（arXiv 搜索、导入、阅读追踪）
- 项目管理（创建、编辑、协作）
- 个人文献库管理
- 实时聊天功能
- 管理后台（用户管理、数据统计）

## 快速部署到 EdgeOne Pages

### 方式一：使用 EdgeOne CLI（推荐）

```bash
# 克隆仓库
git clone https://github.com/zixilee666-svg/project_v6.git
cd project_v6

# 安装依赖
npm install

# 安装 EdgeOne CLI
npm install -g @edgeone/cli

# 登录腾讯云账号
edgeone login

# 部署
edgeone pages deploy
```

### 方式二：在 EdgeOne 控制台部署

1. 访问 [EdgeOne Pages 控制台](https://cloud.tencent.com/document/product/1183)
2. 点击「新建站点」
3. 选择「从 GitHub 导入」
4. 授权 GitHub 并选择 `zixilee666-svg/project_v6` 仓库
5. 框架预设选择「Vite」
6. 构建命令设置为 `npm run build`
7. 输出目录设置为 `./dist`

## 部署后配置

部署完成后需要在 EdgeOne 控制台配置以下资源：

### 1. KV 存储绑定

Edge Functions 使用 KV 存储保存数据，需要：

1. 在 EdgeOne 控制台创建 KV 存储实例
2. 将 KV 存储绑定到 Edge Functions
3. 在环境变量中设置 `KV_STORAGE_ID`

### 2. 环境变量配置

在 EdgeOne 控制台设置以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `JWT_SECRET` | JWT 签名密钥 | `your-secret-key-at-least-32-chars` |
| `KV_STORAGE_ID` | KV 存储实例 ID | `kv-xxxxxxxx` |
| `CLOUD_FUNCTION_TOKEN` | 云函数访问令牌 | `your-token` |

### 3. 边缘函数配置

在控制台创建边缘函数：
- 入口文件：`edge-functions/index.js`
- 路由：`/api/*`

### 4. 云函数部署

```bash
cd cloud-functions
npm install
# 使用 tcb 或 cf-cli 部署
```

## 项目结构

```
project_v6/
├── src/                      # React 前端源码
│   ├── pages/               # 页面组件
│   │   ├── AuthPage.tsx     # 登录/注册页
│   │   ├── AdminPage.tsx    # 管理后台
│   │   ├── HomePage.tsx     # 首页
│   │   └── ...
│   ├── components/          # UI 组件
│   ├── services/           # API 服务
│   └── lib/                # 工具库
├── edge-functions/          # 边缘函数（API）
│   ├── index.js            # 主入口
│   └── package.json
├── cloud-functions/         # 云函数
│   └── api/
├── dist/                    # 构建输出
├── pages.config.json       # EdgeOne Pages 配置
├── package.json
└── vite.config.ts
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

## 技术栈

- **前端**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- **后端**: Edge Functions (Cloudflare Workers 兼容)
- **存储**: KV Storage
- **部署**: EdgeOne Pages

## 默认账号

部署后使用以下默认账号登录：

| 用户名 | 密码 |
|--------|------|
| admin | 123456 |

## 备案信息

本项目已按照中国法规要求添加 ICP 备案号：

- **ICP备案号**: 粤ICP备2026052655号-1
- **备案链接**: [工信部备案查询](https://beian.miit.gov.cn/)

### 修改备案号

如需使用自己的备案号，请修改以下文件：

1. **`src/components/layout/SiteFooter.tsx`** - 修改备案号文本和链接
2. **`pages.config.json`** - 更新 `site.icp.number` 字段

## License

MIT
