# EdgeOne Pages 生产环境配置指南

## ✅ 部署完成

- **生产环境 URL**: https://academic-hub-v4-dcdlrsek.edgeone.cool?eo_token=c1b05da00d6ac8c09af80f21e8c8b82e&eo_time=1777448728
- **项目 ID**: `pages-sxrzjbiboekx`
- **部署 ID**: `lrfo1g1dnp`
- **控制台**: https://console.cloud.tencent.com/edgeone/pages/project/pages-sxrzjbiboekx/deployment/lrfo1g1dnp

---

## 🔧 必需配置 (在 EdgeOne 控制台完成)

### 1. KV Storage 命名空间配置

#### 步骤 1: 创建 KV 命名空间
1. 进入 [KV 存储控制台](https://console.cloud.tencent.com/edgeone/kv)
2. 点击 **立即申请** 开通账户
3. 点击 **创建命名空间**
4. 输入名称: `academic_hub_kv`
5. 点击 **创建**

#### 步骤 2: 绑定到 Edge Functions
1. 进入 [项目配置页面](https://console.cloud.tencent.com/edgeone/pages/project/pages-sxrzjbiboekx)
2. 点击左侧菜单 **KV 存储**
3. 点击 **绑定命名空间**
4. 选择 `academic_hub_kv`
5. 设置运行时变量名: `ACADEMIC_HUB_KV`
6. 点击 **确定**

#### 步骤 3: 添加初始数据 (可选)
如果你已有 KV 数据，可以手动添加以下 key-value 对：

```
Key: users:admin
Value: {"id":"admin","username":"admin","displayName":"Administrator","email":"admin@academic-hub.local","passwordHash":"8d969eef6ecad3c29a3a629280e686cf0c3f5d5a868afff50f6c7db4cd21c9","role":"admin","institution":"Joan Academic Hub","createdAt":"2026-04-29T00:00:00.000Z"}

Key: users:joan
Value: {"id":"user-joan","username":"joan","displayName":"Joan Chen (贞德)","email":"joan@academic-hub.local","passwordHash":"8d969eef6ecad3c29a3a629280e686cf0c3f5d5a868afff50f6c7db4cd21c9","role":"user","institution":"Fudan University","bio":"PhD candidate researching Graph Neural Networks and Financial AI.","createdAt":"2025-01-01T00:00:00.000Z"}

Key: users:index
Value: ["admin","user-joan"]

Key: spaces:index
Value: ["admin","joan"]

Key: spaces:admin
Value: {"username":"admin","displayName":"Administrator","bio":"","institution":"Joan Academic Hub","theme":"light","modules":["papers","projects","library","chat"],"social":{"twitter":"","github":"","linkedin":""},"stats":{"papers":0,"projects":0,"libraries":0},"createdAt":"2026-04-29T00:00:00.000Z"}

Key: spaces:joan
Value: {"username":"joan","displayName":"Joan Chen (贞德)","bio":"PhD candidate researching Graph Neural Networks and Financial AI.","institution":"Fudan University","theme":"light","modules":["papers","projects","library","chat"],"social":{"twitter":"","github":"","linkedin":""},"stats":{"papers":3,"projects":2,"libraries":2},"createdAt":"2025-01-01T00:00:00.000Z"}

Key: users:by-username:admin
Value: admin

Key: users:by-username:joan
Value: user-joan

Key: users:admin:papers
Value: []

Key: users:admin:projects
Value: []

Key: users:admin:libraries
Value: []

Key: users:user-joan:papers
Value: ["paper-joan-1","paper-joan-2","paper-joan-3"]

Key: users:user-joan:projects
Value: ["project-joan-1","project-joan-2"]

Key: users:user-joan:libraries
Value: ["lib-joan-1","lib-joan-2"]
```

### 2. 环境变量配置

在 EdgeOne 控制台设置以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `JWT_SECRET` | `academic-hub-v4-jwt-secret-key-2026-prod` | JWT 签名密钥 |

设置方法：
1. 进入 [项目配置页面](https://console.cloud.tencent.com/edgeone/pages/project/pages-sxrzjbiboekx)
2. 点击左侧菜单 **环境变量**
3. 点击 **新增变量**
4. 输入变量名 `JWT_SECRET` 和值
5. 点击 **确定**

---

## 🧪 测试账号

| 账号 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `123456` |
| 贞德 | `joan` | `11223344` |

---

## 🔄 重新部署

每次修改代码或配置后，重新部署：

```bash
cd D:\Users\Lenovo\Desktop\project01\academic-hub-v4
npm run build
edgeone pages deploy
```

---

## 📝 API 端点参考

部署到生产环境后，API 请求发送到：

```
https://academic-hub-v4-dcdlrsek.edgeone.cool/api/*
```

### 主要 API 端点：

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |
| GET | `/api/auth/me` | 获取当前用户信息 |
| GET | `/api/spaces` | 获取所有空间列表 |
| GET | `/api/spaces/:username` | 获取特定用户空间 |
| GET | `/api/users/:username/papers` | 获取用户论文列表 |
| GET | `/api/users/:username/projects` | 获取用户项目列表 |
| GET | `/api/users/:username/libraries` | 获取用户文献库列表 |
| GET | `/api/stats` | 获取系统统计 (管理员) |
| GET | `/api/hello` | 健康检查 |

---

## ⚠️ 注意事项

1. **KV 绑定**: 必须先将 `academic_hub_kv` 命名空间绑定到项目，否则 API 将无法正常工作
2. **CORS**: Edge Functions 已配置允许所有来源访问
3. **首次登录**: 首次登录时会自动创建管理员和贞德账号

---

*最后更新: 2026-04-29*
