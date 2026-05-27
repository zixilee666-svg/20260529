// ======================================
// Project V6 Code Knowledge Graph — 静态数据 v1.0
// 说明：Project V6 项目本身的代码/文档/架构知识的图谱
// 存储位置：前端静态文件，构建时打包
// ======================================

import type { KnowledgeGraph, KnowledgeEntity, KnowledgeRelation } from '../types';

// ----- 实体定义 -----

const entities: KnowledgeEntity[] = [
  // ===== 前端模块 Frontend Modules =====
  {
    id: 'code:api-layer',
    type: 'code',
    name: 'API Layer (src/lib/api.ts)',
    description: '前端API调用层，封装所有与后端的数据交互，支持Mock模式和真实API模式。',
    content: 'API Layer (src/lib/api.ts) 是前端与后端通信的核心层。主要功能：1）封装所有API调用（papers、projects、libraries、AI聊天等）；2）支持双模式：Mock模式（本地数据，默认）和真实API模式（EdgeOne后端）；3）统一错误处理和超时控制；4）支持context参数传入（用于AI对话的知识图谱集成）。关键函数：api.aiChat(convId, message, context, modelConfig)。',
    source: 'joan:project-knowledge',
    tags: ['api', 'layer', 'mock', 'real-api', 'src/lib/api.ts'],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'code:ai-chat-page',
    type: 'code',
    name: 'AI Chat Page (src/pages/AIChatPage.tsx)',
    description: 'AI对话页面，支持SSE流式响应、自动续写、截断检测。',
    content: 'AI Chat Page (src/pages/AIChatPage.tsx) 是用户与AI助手对话的界面。核心功能：1）SSE流式响应解析（支持OpenAI格式和自定义格式）；2）自动续写机制（检测到截断时自动发送"请继续"，最多2次）；3）截断检测（未收到[DONE]标记时判定为截断）；4）知识图谱集成（调用searchKnowledge获取相关背景知识作为context）。关键状态：streamEnded、streamError、autoContinueCount、abortControllerRef。',
    source: 'joan:project-knowledge',
    tags: ['ai', 'chat', 'sse', 'streaming', 'auto-continue', 'src/pages/AIChatPage.tsx'],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'code:auth-store',
    type: 'code',
    name: 'Auth Store (src/store/authStore.ts)',
    description: 'Zustand状态管理，处理用户认证、Token持久化。',
    content: 'Auth Store (src/store/authStore.ts) 使用Zustand进行用户认证状态管理。核心功能：1）登录/登出；2）Token持久化（localStorage）；3）parseStoredUser/parseStoredToken辅助函数；4）与AuthContext协同工作。关键字段：token、user、isAuthenticated。',
    source: 'joan:project-knowledge',
    tags: ['auth', 'store', 'zustand', 'token', 'src/store/authStore.ts'],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'code:types',
    type: 'code',
    name: 'Type Definitions (src/types/index.ts)',
    description: '项目所有TypeScript类型定义，包括Paper、Project、KnowledgeEntity等。',
    content: 'Type Definitions (src/types/index.ts) 定义了项目的所有TypeScript接口和类型。核心类型：Paper（论文）、Project（项目）、Library（文献库）、Note（笔记）、KnowledgeEntity（知识实体）、KnowledgeGraph（知识图谱）、KnowledgeSnippet（知识片段）等。知识图谱相关类型在文件末尾定义（v1.0）。',
    source: 'joan:project-knowledge',
    tags: ['types', 'typescript', 'interfaces', 'src/types/index.ts'],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },

  // ===== 后端模块 Backend Modules =====
  {
    id: 'code:edge-functions',
    type: 'code',
    name: 'Edge Functions (edge-functions/api/[[default]].js)',
    description: 'EdgeOne Edge Functions (V8隔离环境)，处理大部分API路由，但无法访问外部网络。',
    content: 'Edge Functions (edge-functions/api/[[default]].js) 运行在EdgeOne Pages的V8隔离环境中。特点：1）低延迟（边缘节点执行）；2）无法访问外部网络（fetch会报net_exception_timeout）；3）处理大部分API路由（/api/papers/*、/api/projects/*、/api/import/zotero等）。不包含：/api/ai/chat和/api/ai/parse-paper（由Cloud Function处理）。',
    source: 'joan:project-knowledge',
    tags: ['edge-functions', 'v8', 'no-external-network', 'edge-functions/api/[[default]].js'],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'code:cloud-functions-ai',
    type: 'code',
    name: 'Cloud Functions AI (cloud-functions/api/ai/[[default]].js)',
    description: 'EdgeOne Cloud Functions (Node.js)，处理AI相关请求，可访问外部AI API。',
    content: 'Cloud Functions AI (cloud-functions/api/ai/[[default]].js) 运行在Node.js环境中，可以访问外部网络。处理：1）/api/ai/chat（AI对话，SSE流式响应）；2）/api/ai/parse-paper（解析PDF论文）。核心函数：callOpenAICompatibleApi(baseUrl, apiKey, model, messages, {stream, temperature, maxTokens, timeout})。关键配置：maxTokens=4096，timeout=28000（平台30s限制）。',
    source: 'joan:project-knowledge',
    tags: ['cloud-functions', 'nodejs', 'ai', 'sse', 'cloud-functions/api/ai/[[default]].js'],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'code:kv-storage',
    type: 'code',
    name: 'KV Storage (EdgeOne KV)',
    description: 'EdgeOne Pages KV存储，用于持久化论文、项目、用户等数据。',
    content: 'KV Storage是EdgeOne Pages提供的键值存储服务。命名空间：ACADEMIC_HUB_KV。Key前缀：papers:、projects:、users:、libraries:、materials:、spaces:、system:。重要限制：Edge Function可以访问KV，但Cloud Function无法访问KV（这是为什么AI聊天的conversation CRUD改用localStorage的原因）。',
    source: 'joan:project-knowledge',
    tags: ['kv', 'storage', 'edgeone', 'namespace:ACADEMIC_HUB_KV'],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },

  // ===== 文档 Documents =====
  {
    id: 'note:readme',
    type: 'note',
    name: 'README.md',
    description: '项目主文档，包含项目介绍、技术栈、部署指南。',
    content: 'README.md是项目的主文档。内容包括：项目介绍（Joan Academic Hub v4，AI驱动的学术论文管理平台）、技术栈（React 19 + TypeScript + Vite 8 + Tailwind CSS 3 + shadcn/ui + Framer Motion + EdgeOne Pages）、核心功能（文献管理、AI分析、研究项目、知识库）、部署指南（EdgeOne Pages自动部署）。',
    source: 'joan:project-knowledge',
    tags: ['readme', 'documentation', 'overview', 'README.md'],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'note:architecture',
    type: 'note',
    name: 'ARCHITECTURE.md',
    description: '项目架构文档，详细描述前后端架构、数据流、部署配置。',
    content: 'ARCHITECTURE.md详细描述Project V6的架构设计。主要内容：1）前端架构（React + TypeScript + Vite，SPA with HashRouter）；2）后端架构（Edge Functions V8 + Cloud Functions Node.js + KV Storage）；3）数据流（API Layer双模式、Zustand状态管理）；4）部署配置（EdgeOne Pages、GitHub自动部署）；5）关键决策记录（API迁移、密码哈希、Mock模式等）。',
    source: 'joan:project-knowledge',
    tags: ['architecture', 'design', 'backend', 'frontend', 'ARCHITECTURE.md'],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'note:changelog',
    type: 'note',
    name: 'CHANGELOG.md',
    description: '项目变更日志，记录所有重要提交和功能变更。',
    content: 'CHANGELOG.md记录Project V6的所有重要变更。最近更新：2026-05-27 - fix: 自动续写条件判断反转修复（commit c0c573f）；2026-05-27 - feat: 自动续写+分点回答（commit f384610）；2026-05-27 - fix: AI聊天响应截断修复（多次commit）。',
    source: 'joan:project-knowledge',
    tags: ['changelog', 'commits', 'history', 'CHANGELOG.md'],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },

  // ===== 配置 Configurations =====
  {
    id: 'code:pages-config',
    type: 'code',
    name: 'Pages Config (pages.config.json)',
    description: 'EdgeOne Pages部署配置，定义路由、Edge Functions路由规则。',
    content: 'Pages Config (pages.config.json) 配置EdgeOne Pages的部署行为。关键配置：1）edgeFunctions.routes：定义哪些路由由Edge Function处理，哪些由Cloud Function处理；2）当前配置：/api/ai/chat和/api/ai/parse-paper由Cloud Function处理（排除规则/api/(?!ai/(chat|parse-paper))）；3）catch-all路由目标：[[default]].js。',
    source: 'joan:project-knowledge',
    tags: ['config', 'edgeone', 'routing', 'pages.config.json'],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
  {
    id: 'code:vite-config',
    type: 'code',
    name: 'Vite Config (vite.config.ts)',
    description: 'Vite构建配置，定义开发服务器、构建选项、路径别名。',
    content: 'Vite Config (vite.config.ts) 配置Vite构建工具。关键配置：1）plugins：@vitejs/plugin-react；2）resolve.alias：@ → src/；3）build.outDir：dist/；4）server.proxy：代理API请求到本地（开发时）。',
    source: 'joan:project-knowledge',
    tags: ['vite', 'build', 'config', 'vite.config.ts'],
    createdAt: '2026-05-27T00:00:00Z',
    updatedAt: '2026-05-27T00:00:00Z',
  },
];

// ----- 关系定义 -----

const relations: KnowledgeRelation[] = [
  // 前端模块关系
  { source: 'code:ai-chat-page', target: 'code:api-layer', type: 'uses', description: 'AIChatPage调用api.aiChat' },
  { source: 'code:ai-chat-page', target: 'code:auth-store', type: 'uses', description: 'AIChatPage使用authStore获取token' },
  { source: 'code:types', target: 'code:api-layer', type: 'used_in', description: 'api.ts使用types/index.ts中的类型' },
  { source: 'code:types', target: 'code:ai-chat-page', type: 'used_in', description: 'AIChatPage.tsx使用types/index.ts中的类型' },

  // 后端模块关系
  { source: 'code:cloud-functions-ai', target: 'code:edge-functions', type: 'related_to', description: 'Cloud Functions与Edge Functions协同工作' },
  { source: 'code:cloud-functions-ai', target: 'code:kv-storage', type: 'related_to', description: 'Cloud Functions无法直接访问KV' },
  { source: 'code:edge-functions', target: 'code:kv-storage', type: 'uses', description: 'Edge Functions可以访问KV' },

  // 文档关系
  { source: 'note:readme', target: 'note:architecture', type: 'related_to', description: 'README和ARCHITECTURE都是项目文档' },
  { source: 'note:changelog', target: 'note:architecture', type: 'related_to', description: 'CHANGELOG记录架构演进' },

  // 配置关系
  { source: 'code:pages-config', target: 'code:edge-functions', type: 'configures', description: 'pages.config.json配置Edge Functions路由' },
  { source: 'code:pages-config', target: 'code:cloud-functions-ai', type: 'configures', description: 'pages.config.json配置Cloud Functions路由' },
  { source: 'code:vite-config', target: 'code:api-layer', type: 'related_to', description: 'vite.config.ts配置前端构建' },
];

// ----- 导出项目知识图谱 -----

export const projectKnowledgeGraph: KnowledgeGraph = {
  version: '1.0.0',
  updatedAt: '2026-05-27T00:00:00Z',
  entities,
  relations,
};

export default projectKnowledgeGraph;
