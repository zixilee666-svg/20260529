# Joan's Academic Hub — 部署指南 (EdgeOne)

## 环境配置

### 1. KV Storage 配置

在 EdgeOne 控制台创建 KV 命名空间：

- **命名空间名称**: `academic_hub_kv`
- **变量名称**: `academic_hub_kv`

### 2. 环境变量

在 EdgeOne Pages 设置以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `JWT_SECRET` | `your-secret-key-here` | JWT 签名密钥（建议使用随机字符串） |
| `AI_API_KEY` | `sk-xxx` | AI API 密钥（可选，不填则使用 Mock） |
| `AI_API_URL` | `https://api.openai.com/v1/chat/completions` | AI API 地址 |

### 3. 前端环境变量

| 变量名 | 开发环境 | 生产环境 |
|--------|---------|---------|
| `VITE_MOCK_MODE` | `true` | `false` |
| `VITE_API_BASE_URL` | `/api` | `/api` |

## 部署步骤

### 1. 构建前端

```bash
npm run build
```

### 2. 部署到 EdgeOne Pages

使用 EdgeOne CLI 或 GitHub Actions 自动部署。

### 3. 配置 Edge Functions

Edge Functions (`functions/index.js`) 会自动处理 `/api/*` 路由。

## 账号信息

### 管理员账号

| 字段 | 值 |
|------|-----|
| 用户名 | `admin` |
| 密码 | `123456` |

### 贞德演示账号

| 字段 | 值 |
|------|-----|
| 用户名 | `joan` |
| 密码 | `11223344` |

## API 端点

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |
| GET | `/api/auth/me` | 获取当前用户 |
| POST | `/api/auth/logout` | 登出 |

### 用户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users` | 获取所有用户（管理员） |
| GET | `/api/users/:id` | 获取用户详情 |
| PUT | `/api/users/:id` | 更新用户 |
| DELETE | `/api/users/:id` | 删除用户（管理员） |

### 空间管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/spaces` | 获取所有空间 |
| GET | `/api/spaces/:username` | 获取空间详情 |
| PUT | `/api/spaces/:username` | 更新空间（仅所有者） |

### 论文管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users/:username/papers` | 获取用户论文列表 |
| GET | `/api/papers/:id` | 获取论文详情 |
| POST | `/api/papers` | 创建论文（需认证） |
| PUT | `/api/papers/:id` | 更新论文（仅作者） |
| DELETE | `/api/papers/:id` | 删除论文（仅作者） |

### 项目管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users/:username/projects` | 获取用户项目列表 |
| GET | `/api/projects/:id` | 获取项目详情 |
| POST | `/api/projects` | 创建项目（需认证） |
| PUT | `/api/projects/:id` | 更新项目（仅所有者） |
| DELETE | `/api/projects/:id` | 删除项目（仅所有者） |

### 文献库管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users/:username/libraries` | 获取用户文献库列表 |
| GET | `/api/libraries/:id` | 获取文献库详情 |
| POST | `/api/libraries` | 创建文献库（需认证） |
| PUT | `/api/libraries/:id` | 更新文献库（仅所有者） |
| DELETE | `/api/libraries/:id` | 删除文献库（仅所有者） |

### 统计（管理员）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 获取系统统计 |

## 故障排除

### KV Storage 报错

确保已正确配置 KV 命名空间：
```json
{
  "kv": [
    {
      "binding": "academic_hub_kv",
      "namespace": "academic_hub_kv"
    }
  ]
}
```

### JWT 验证失败

确保 `JWT_SECRET` 环境变量与前后端一致。
