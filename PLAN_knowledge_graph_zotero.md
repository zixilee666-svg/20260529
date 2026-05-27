# 实现方案：知识图谱嵌入 + Zotero完整集成

**日期**：2026-05-27  
**负责人**：Joan（贞德）  
**目标**：将Joan的学术知识图谱嵌入项目，并从Zotero导入论文+PDF+笔记，完善知识图谱

---

## 一、总体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    前端 (React)                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐   │
│  │ AIChatPage   │  │ LibraryPage  │  │ SettingsPage │   │
│  │ (AI对话)    │  │ (文献库)     │  │ (设置)      │   │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘   │
│         │                  │                  │          │
│         ▼                  ▼                  ▼          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │         src/lib/api.ts (API客户端)                  │ │
│  └────────────────────┬──────────────────────────────┘ │
└───────────────────────┼──────────────────────────────┘
                        │ HTTP API
┌───────────────────────┼──────────────────────────────┐
│ 后端 (EdgeOne Pages) │                              │
│  ┌────────────────────▼──────────────────────────────┐│
│  │ Edge Functions (V8)                              ││
│  │ - /api/import/zotero (Zotero导入)               ││
│  │ - /api/papers/* (论文CRUD)                      ││
│  │ - /api/knowledge/* (知识图谱查询)                ││
│  └────────────────────┬──────────────────────────────┘│
│  ┌────────────────────▼──────────────────────────────┐│
│  │ Cloud Functions (Node.js)                         ││
│  │ - /api/ai/chat (AI对话，支持context参数)        ││
│  └────────────────────┬──────────────────────────────┘│
│  ┌────────────────────▼──────────────────────────────┐│
│  │ KV Storage (EdgeOne KV)                         ││
│  │ - papers:{} (论文数据)                          ││
│  │ - knowledge_graph:{} (知识图谱)                  ││
│  │ - zotero_items:{} (Zotero导入的原始数据)         ││
│  └───────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────┘
```

---

## 二、阶段划分与实施顺序

### 阶段1：知识图谱数据结构设计（第1-2天）

#### 1.1 类型定义 (`src/types/index.ts`)

```typescript
// ===== 知识图谱核心类型 =====

/** 知识实体类型 */
export type KnowledgeEntityType = 
  | 'concept'     // 概念（如：图神经网络、异质图）
  | 'paper'       // 论文
  | 'method'      // 方法（如：GCN、注意力机制）
  | 'dataset'     // 数据集（如：YelpChi、Amazon）
  | 'task'        // 任务（如：欺诈检测、节点分类）
  | 'metric'      // 指标（如：AUC、F1）
  | 'code'        // 代码/模块
  | 'note';       // 笔记

/** 知识实体 */
export interface KnowledgeEntity {
  id: string;                      // 唯一ID，格式：type:name（如：concept:gcn）
  type: KnowledgeEntityType;
  name: string;                     // 显示名称
  description?: string;              // 简短描述
  content?: string;                 // 详细内容（Markdown）
  source?: string;                  // 来源（论文ID、URL等）
  tags: string[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;   // 扩展元数据
}

/** 知识关系类型 */
export type KnowledgeRelationType =
  | 'is_a'         // 是一个（GCN是一种GNN）
  | 'part_of'      // 部分 of（注意力机制是GAT的部分）
  | 'used_in'      // 用于（GCN用于节点分类）
  | 'proposed_in'  // 在论文中提出（MTPNet在论文XXX中提出）
  | 'outperforms'  // 性能优于
  | 'cites'        // 引用
  | 'related_to'    // 相关
  | 'has_code';     // 有代码实现

/** 知识关系 */
export interface KnowledgeRelation {
  id: string;
  source: string;    // 源实体ID
  target: string;    // 目标实体ID
  type: KnowledgeRelationType;
  description?: string;
  weight?: number;    // 关系强度（0-1）
  createdAt: string;
}

/** 知识图谱 */
export interface KnowledgeGraph {
  entities: KnowledgeEntity[];
  relations: KnowledgeRelation[];
  version: string;
  lastUpdated: string;
}

/** 知识片段（用于AI上下文） */
export interface KnowledgeSnippet {
  entityId: string;
  content: string;       // 相关知识内容（ truncated）
  relevance: number;     // 相关性得分（0-1）
  source: string;         // 来源说明
}
```

#### 1.2 静态知识数据 (`src/data/knowledgeGraph.ts`)

Joan的学术知识图谱（关于HGNN、金融欺诈检测、MTPNet等）将以静态JSON文件形式存储，构建时打包到前端。

```typescript
// src/data/knowledgeGraph.ts
// Joan的学术知识图谱（静态数据）

export const joanKnowledgeGraph: KnowledgeGraph = {
  version: '1.0.0',
  lastUpdated: '2026-05-27',
  entities: [
    // === 核心概念 ===
    {
      id: 'concept:graph_neural_network',
      type: 'concept',
      name: 'Graph Neural Network (GNN)',
      description: '图神经网络，一类用于处理图结构数据的深度学习模型',
      content: 'GNN通过消息传递机制在图节点之间传播和聚合信息...',
      tags: ['GNN', '深度学习', '图表示学习'],
      createdAt: '2026-05-27',
      updatedAt: '2026-05-27',
    },
    {
      id: 'concept:heterogeneous_graph',
      type: 'concept',
      name: 'Heterogeneous Graph (异质图)',
      description: '包含多种类型节点和边的图',
      content: '异质图中节点和边具有不同的类型和属性...',
      tags: ['异质图', 'HGNN'],
      createdAt: '2026-05-27',
      updatedAt: '2026-05-27',
    },
    // === 模型 ===
    {
      id: 'method:gcn',
      type: 'method',
      name: 'Graph Convolutional Network (GCN)',
      description: '图卷积网络，Kipf & Welling 2017',
      content: 'GCN通过谱图卷积的一阶近似实现高效节点表示学习...',
      tags: ['GCN', '卷积', '半监督'],
      source: 'paper:gcn-kipf2017',
      createdAt: '2026-05-27',
      updatedAt: '2026-05-27',
    },
    // ... 更多实体
  ],
  relations: [
    { id: 'rel:1', source: 'method:gcn', target: 'concept:graph_neural_network', type: 'is_a', description: 'GCN是一种GNN', createdAt: '2026-05-27' },
    // ... 更多关系
  ],
};
```

#### 1.3 项目代码知识 (`src/data/projectKnowledge.ts`)

Project V6项目本身的代码/文档知识，也以静态JSON文件存储。

```typescript
// src/data/projectKnowledge.ts
// Project V6 代码知识图谱

export const projectKnowledgeGraph: KnowledgeGraph = {
  version: '1.0.0',
  lastUpdated: '2026-05-27',
  entities: [
    {
      id: 'code:api_layer',
      type: 'code',
      name: 'API Layer (src/lib/api.ts)',
      description: 'API客户端层，支持Mock和真实API两种模式',
      content: 'api.ts定义了所有后端API的客户端调用方法...',
      tags: ['API', '前端', '架构'],
      createdAt: '2026-05-27',
      updatedAt: '2026-05-27',
    },
    // ... 更多代码实体
  ],
  relations: [
    // ... 代码之间的关系
  ],
};
```

---

### 阶段2：知识图谱查询与检索（第3-4天）

#### 2.1 知识图谱查询函数 (`src/lib/knowledgeGraph.ts`)

```typescript
// src/lib/knowledgeGraph.ts
// 知识图谱查询与检索工具

import { joanKnowledgeGraph } from '@/data/knowledgeGraph';
import { projectKnowledgeGraph } from '@/data/projectKnowledge';
import type { KnowledgeGraph, KnowledgeEntity, KnowledgeSnippet } from '@/types';

/** 合并所有知识图谱 */
function getMergedGraph(): KnowledgeGraph {
  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    entities: [...joanKnowledgeGraph.entities, ...projectKnowledgeGraph.entities],
    relations: [...joanKnowledgeGraph.relations, ...projectKnowledgeGraph.relations],
  };
}

/** 简单关键词匹配检索（第一阶段：不使用向量） */
export function searchKnowledge(query: string, maxResults = 5): KnowledgeSnippet[] {
  const graph = getMergedGraph();
  const queryLower = query.toLowerCase();
  const queryKeywords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  const scoredEntities = graph.entities.map(entity => {
    let score = 0;
    
    // 名称匹配（权重最高）
    if (entity.name.toLowerCase().includes(queryLower)) score += 10;
    
    // 描述匹配
    if (entity.description?.toLowerCase().includes(queryLower)) score += 5;
    
    // 内容匹配
    if (entity.content?.toLowerCase().includes(queryLower)) score += 3;
    
    // 标签匹配
    const tagMatchCount = entity.tags.filter(t => 
      t.toLowerCase().includes(queryLower) || 
      queryKeywords.some(k => t.toLowerCase().includes(k))
    ).length;
    score += tagMatchCount * 2;
    
    // 关键词匹配
    queryKeywords.forEach(kw => {
      if (entity.name.toLowerCase().includes(kw)) score += 3;
      if (entity.description?.toLowerCase().includes(kw)) score += 1;
      if (entity.content?.toLowerCase().includes(kw)) score += 0.5;
    });
    
    return { entity, score };
  });
  
  // 按分数排序，返回前N个
  const topEntities = scoredEntities
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
  
  // 转换为KnowledgeSnippet
  return topEntities.map(({ entity, score }) => ({
    entityId: entity.id,
    content: `${entity.name}: ${entity.description || ''}\n${entity.content ? entity.content.slice(0, 500) : ''}`,
    relevance: Math.min(score / 10, 1), // 归一化到0-1
    source: `Knowledge Graph: ${entity.type}`,
  }));
}

/** 根据实体ID获取详细信息 */
export function getEntityById(id: string): KnowledgeEntity | null {
  const graph = getMergedGraph();
  return graph.entities.find(e => e.id === id) || null;
}

/** 获取与某实体相关的所有实体 */
export function getRelatedEntities(id: string): KnowledgeEntity[] {
  const graph = getMergedGraph();
  const relatedIds = new Set<string>();
  
  graph.relations.forEach(rel => {
    if (rel.source === id) relatedIds.add(rel.target);
    if (rel.target === id) relatedIds.add(rel.source);
  });
  
  return Array.from(relatedIds)
    .map(rid => graph.entities.find(e => e.id === rid))
    .filter(Boolean) as KnowledgeEntity[];
}
```

#### 2.2 集成到AI聊天 (`src/pages/AIChatPage.tsx`)

修改`sendMessage`函数，在调用`api.aiChat`时传入知识图谱context：

```typescript
// 在 AIChatPage.tsx 的 sendMessage 函数中
// 修改第204行左右的代码

// 原代码：
// const response = await api.aiChat(convId, textToSend, undefined, defaultModel);

// 新代码：
const knowledgeSnippets = searchKnowledge(textToSend, 3); // 检索最相关的3条知识
const contextText = knowledgeSnippets.length > 0 
  ? `相关背景知识：\n${knowledgeSnippets.map(s => s.content).join('\n\n---\n\n')}`
  : undefined;

const response = await api.aiChat(convId, textToSend, contextText, defaultModel);
```

---

### 阶段3：Zotero完整导入（第5-7天）

#### 3.1 扩展Zotero导入API（后端）

**文件**：`edge-functions/api/[[default]].js`

需要扩展`handleImportZotero`函数，支持：
1. 导入PDF附件（通过Zotero API获取附件下载链接）
2. 导入笔记内容（Zotero的`notes`字段）
3. 将导入的数据存储到KV（不仅是返回，还要持久化）

**实现要点**：

```javascript
// 在 handleImportZotero 函数中扩展

// 1. 获取用户的Zotero库中的所有项目（包括PDF和笔记）
const itemsUrl = `https://api.zotero.org/users/${encodeURIComponent(userId)}/items?format=json&limit=100`;
const itemsRes = await fetch(itemsUrl, { headers: { 'Zotero-API-Key': apiKey } });
const items = await itemsRes.json();

// 2. 分离论文、PDF附件、笔记
const papers = items.filter(i => i.data.itemType === 'journalArticle' || i.data.itemType === 'conferencePaper');
const attachments = items.filter(i => i.data.itemType === 'attachment' && i.data.contentType === 'application/pdf');
const notes = items.filter(i => i.data.itemType === 'note');

// 3. 为每个论文匹配PDF和笔记
for (const paper of papers) {
  const paperKey = paper.key;
  // 找到该论文的子附件（PDF）
  const pdfAttachments = attachments.filter(a => a.data.parentItem === paperKey);
  // 找到该论文的子笔记
  const paperNotes = notes.filter(n => n.data.parentItem === paperKey);
  
  // 下载PDF（如果需要）
  // 注意：Zotero API的PDF下载需要额外步骤（可能需要授权的URL）
  
  // 构建完整的论文数据
  const fullPaper = {
    id: `zotero-${paperKey}`,
    title: paper.data.title,
    authors: ...,
    abstract: paper.data.abstractNote,
    zoteroKey: paperKey,
    pdfUrl: pdfAttachments[0] ? await getPdfDownloadUrl(pdfAttachments[0].key, apiKey) : null,
    notes: paperNotes.map(n => ({
      id: `zotero-note-${n.key}`,
      content: n.data.note,
      createdAt: n.data.dateAdded,
    })),
  };
  
  // 存储到KV
  await kvSetJson(`paper:${fullPaper.id}`, fullPaper);
}
```

#### 3.2 前端Zotero导入界面优化

**文件**：`src/pages/ImportExportPage.tsx`

当前导入界面可能比较简单，需要扩展：
1. 显示导入进度（导入了多少篇、多少PDF、多少笔记）
2. 导入完成后显示详细结果
3. 支持重新导入（增量更新）

---

### 阶段4：知识图谱管理界面（第8-10天）

#### 4.1 知识图谱查看页面

**新文件**：`src/pages/KnowledgeGraphPage.tsx`

功能：
1. 可视化展示知识图谱（使用简单的关系图或列表）
2. 搜索知识实体
3. 查看实体详情和相关实体
4. 手动添加/编辑知识实体（可选）

#### 4.2 将Zotero导入的论文/笔记融入知识图谱

当Zotero导入完成后，自动将导入的论文和笔记添加到知识图谱中：

```typescript
// 在Zotero导入完成后，调用此函数将论文添加到知识图谱
function addZoteroPapersToKnowledgeGraph(papers: any[]) {
  const newEntities = papers.map(p => ({
    id: `paper:${p.id}`,
    type: 'paper' as const,
    name: p.title,
    description: p.abstract?.slice(0, 200) || '',
    content: p.abstract || '',
    source: `Zotero:${p.zoteroKey}`,
    tags: p.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  
  // 存储到KV或本地存储
  // ...
}
```

---

## 三、文件变更清单

### 新增文件
| 文件路径 | 说明 |
|---------|------|
| `src/types/index.ts` | 添加KnowledgeGraph相关类型（修改现有文件） |
| `src/data/knowledgeGraph.ts` | Joan的学术知识图谱静态数据 |
| `src/data/projectKnowledge.ts` | Project V6代码知识图谱静态数据 |
| `src/lib/knowledgeGraph.ts` | 知识图谱查询与检索工具函数 |
| `src/pages/KnowledgeGraphPage.tsx` | 知识图谱管理页面 |
| `src/components/knowledge/KnowledgeGraphViewer.tsx` | 知识图谱可视化组件 |
| `src/components/knowledge/EntityDetail.tsx` | 实体详情组件 |

### 修改文件
| 文件路径 | 修改内容 |
|---------|----------|
| `src/pages/AIChatPage.tsx` | 调用`searchKnowledge`获取context，传入`api.aiChat` |
| `src/lib/api.ts` | 可能不需要修改（`aiChat`已支持context参数） |
| `edge-functions/api/[[default]].js` | 扩展`handleImportZotero`支持PDF和笔记 |
| `cloud-functions/api/ai/[[default]].js` | 可能不需要修改（已支持context） |

---

## 四、风险评估与缓解措施

### 风险1：静态知识数据文件过大
**风险**：`src/data/knowledgeGraph.ts`可能包含大量知识，导致前端打包文件过大。

**缓解**：
- 第一阶段只放入核心知识（约50-100个实体）
- 使用代码分割（dynamic import）按需加载
- 后续迁移到KV存储+API查询

### 风险2：Zotero PDF下载复杂
**风险**：Zotero API的PDF下载需要特殊处理（可能需要通过Zotero Web API或授权URL）。

**缓解**：
- 第一阶段只导入元数据+笔记，不下载PDF
- PDF下载作为第二阶段功能
- 或者只保存PDF链接，不下载文件

### 风险3：知识图谱查询效率低
**风险**：简单关键词匹配可能不够准确，返回不相关的结果。

**缓解**：
- 第一阶段使用简单关键词匹配（能工作）
- 第二阶段升级到向量语义搜索（需要嵌入模型或外部API）

---

## 五、实施时间表

| 阶段 | 天数 | 交付物 |
|------|------|--------|
| 阶段1：知识图谱数据结构设计 | 1-2天 | 类型定义+静态知识数据 |
| 阶段2：知识图谱查询与检索 | 3-4天 | 查询函数+集成到AI聊天 |
| 阶段3：Zotero完整导入 | 5-7天 | 扩展导入API+前端界面 |
| 阶段4：知识图谱管理界面 | 8-10天 | 知识图谱查看/编辑页面 |
| 测试与优化 | 11-12天 | 完整测试+性能优化 |

---

## 六、下一步行动

1. **立即开始**：创建类型定义（`src/types/index.ts`修改）
2. **并行工作**：同时开始构建静态知识数据（`src/data/knowledgeGraph.ts`）
3. **优先验证**：先让"AI聊天+知识图谱context"跑通，再完善其他功能

---

**计划制定人**：Joan（贞德）  
**计划日期**：2026-05-27  
**计划版本**：v1.0
