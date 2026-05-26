# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 06-research.spec.ts >> Research Page >> should have create project button
- Location: e2e\06-research.spec.ts:27:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('HGNN 金融欺诈检测综述').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('HGNN 金融欺诈检测综述').first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e6]:
        - img [ref=e8]
        - generic [ref=e12]:
          - heading "Academic Hub" [level=1] [ref=e13]
          - paragraph [ref=e14]: 贞德·达尔克
      - navigation [ref=e15]:
        - link "学术广场" [ref=e16] [cursor=pointer]:
          - /url: "#/gallery"
          - img [ref=e17]
          - generic [ref=e20]: 学术广场
        - link "仪表盘" [ref=e22] [cursor=pointer]:
          - /url: "#/dashboard"
          - img [ref=e23]
          - generic [ref=e28]: 仪表盘
        - link "文献库" [ref=e29] [cursor=pointer]:
          - /url: "#/dashboard/library"
          - img [ref=e30]
          - generic [ref=e32]: 文献库
        - link "我的文献库" [ref=e33] [cursor=pointer]:
          - /url: "#/dashboard/my-library"
          - img [ref=e34]
          - generic [ref=e36]: 我的文献库
        - link "个人资料" [ref=e37] [cursor=pointer]:
          - /url: "#/dashboard/materials"
          - img [ref=e38]
          - generic [ref=e41]: 个人资料
        - link "AI 对话" [ref=e42] [cursor=pointer]:
          - /url: "#/dashboard/ai-chat"
          - img [ref=e43]
          - generic [ref=e45]: AI 对话
        - link "我的研究" [ref=e46] [cursor=pointer]:
          - /url: "#/dashboard/research"
          - img [ref=e47]
          - generic [ref=e49]: 我的研究
        - link "导入导出" [ref=e50] [cursor=pointer]:
          - /url: "#/dashboard/import-export"
          - img [ref=e51]
          - generic [ref=e55]: 导入导出
        - link "设置" [ref=e56] [cursor=pointer]:
          - /url: "#/dashboard/settings"
          - img [ref=e57]
          - generic [ref=e60]: 设置
        - link "管理后台" [ref=e62] [cursor=pointer]:
          - /url: "#/admin"
          - img [ref=e63]
          - generic [ref=e65]: 管理后台
      - generic [ref=e66]:
        - generic [ref=e67]:
          - generic [ref=e68]: A
          - generic [ref=e69]:
            - paragraph [ref=e70]: Administrator
            - paragraph [ref=e71]: 管理员
        - generic [ref=e72]:
          - button "切换主题" [ref=e73] [cursor=pointer]:
            - img [ref=e74]
          - button "退出登录" [ref=e76] [cursor=pointer]:
            - img [ref=e77]
    - main [ref=e80]:
      - generic [ref=e83]:
        - generic [ref=e84]:
          - generic [ref=e85]:
            - heading "我的研究" [level=1] [ref=e86]
            - paragraph [ref=e87]: 管理研究项目，追踪目标进度
          - button "新建项目" [ref=e88] [cursor=pointer]:
            - img
            - text: 新建项目
        - generic [ref=e89]:
          - generic [ref=e91]:
            - paragraph [ref=e92]: 总项目
            - paragraph [ref=e93]: "0"
          - generic [ref=e95]:
            - paragraph [ref=e96]: 进行中
            - paragraph [ref=e97]: "0"
          - generic [ref=e99]:
            - paragraph [ref=e100]: 已完成
            - paragraph [ref=e101]: "0"
          - generic [ref=e103]:
            - paragraph [ref=e104]: 计划中
            - paragraph [ref=e105]: "0"
        - generic [ref=e106]:
          - generic [ref=e107] [cursor=pointer]: 全部
          - generic [ref=e108] [cursor=pointer]: 进行中
          - generic [ref=e109] [cursor=pointer]: 已完成
          - generic [ref=e110] [cursor=pointer]: 计划中
        - generic [ref=e111]:
          - img [ref=e113]
          - heading "暂无研究项目" [level=3] [ref=e115]
          - paragraph [ref=e116]: 创建你的第一个研究项目，开始组织文献与目标。
          - button "新建项目" [ref=e118] [cursor=pointer]:
            - img
            - text: 新建项目
      - generic [ref=e121]:
        - paragraph [ref=e122]:
          - generic [ref=e123]: © 2026 Academic Hub. All rights reserved.
        - generic [ref=e124]:
          - link "粤ICP备2026052655号-1" [ref=e125] [cursor=pointer]:
            - /url: https://beian.miit.gov.cn/
          - generic [ref=e126]: "|"
          - link "公安备案" [ref=e127] [cursor=pointer]:
            - /url: https://beian.mps.gov.cn/#/
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | // ─────────────────────────────────────────────────
  2  | // Research — Project CRUD, objectives, progress
  3  | // ─────────────────────────────────────────────────
  4  | import { test, expect } from './fixtures';
  5  | 
  6  | test.describe('Research Page', () => {
  7  |   test('should load projects from API', async ({ authedPage: page }) => {
  8  |     await page.goto('/#/dashboard/research');
  9  |     await page.waitForTimeout(1000);
  10 |     await expect(page.getByText('HGNN 金融欺诈检测综述').first()).toBeVisible();
  11 |   });
  12 | 
  13 |   test('should display project progress info', async ({ authedPage: page }) => {
  14 |     await page.goto('/#/dashboard/research');
  15 |     await page.waitForTimeout(1000);
  16 |     // Project card should contain progress-related text
  17 |     await expect(page.getByText('HGNN').first()).toBeVisible();
  18 |   });
  19 | 
  20 |   test('should show multiple projects', async ({ authedPage: page }) => {
  21 |     await page.goto('/#/dashboard/research');
  22 |     await page.waitForTimeout(1000);
  23 |     await expect(page.getByText('HGNN 金融欺诈检测综述')).toBeVisible();
  24 |     await expect(page.getByText('多尺度元路径融合实验')).toBeVisible();
  25 |   });
  26 | 
  27 |   test('should have create project button', async ({ authedPage: page }) => {
  28 |     await page.goto('/#/dashboard/research');
  29 |     await page.waitForTimeout(1000);
  30 |     // Page should show create/new button or dialog trigger
  31 |     const createBtn = page.getByRole('button', { name: /新建|创建|添加|New/i });
  32 |     // Just verify page loaded correctly
> 33 |     await expect(page.getByText('HGNN 金融欺诈检测综述').first()).toBeVisible();
     |                                                           ^ Error: expect(locator).toBeVisible() failed
  34 |   });
  35 | });
  36 | 
```