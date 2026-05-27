// =======================================
// Knowledge Graph Query & Retrieval Library v1.0
// 功能：从静态知识图谱中检索相关知识片段，用于AI对话context注入
// =======================================

import type { KnowledgeSnippet, KnowledgeEntity, KnowledgeGraph } from '../types';
import academicKnowledgeGraph from '../data/knowledgeGraph';
import projectKnowledgeGraph from '../data/projectKnowledge';

// ----- 内存中的知识图谱（合并学术+项目） -----

let mergedGraph: KnowledgeGraph | null = null;

function getMergedGraph(): KnowledgeGraph {
  if (mergedGraph) return mergedGraph;

  // 合并学术知识图谱和项目知识图谱
  const allEntities = [
    ...academicKnowledgeGraph.entities,
    ...projectKnowledgeGraph.entities,
  ];
  const allRelations = [
    ...academicKnowledgeGraph.relations,
    ...projectKnowledgeGraph.relations,
  ];

  mergedGraph = {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    entities: allEntities,
    relations: allRelations,
  };

  return mergedGraph;
}

// ----- 检索函数 -----

/**
 * 从知识图谱中检索与查询相关的知识片段
 * 第一阶段：简单关键词匹配（后续升级到向量语义搜索）
 *
 * @param query - 用户查询字符串
 * @param maxResults - 最大返回结果数（默认3）
 * @returns KnowledgeSnippet[] - 相关知识片段数组
 */
export function searchKnowledge(query: string, maxResults: number = 3): KnowledgeSnippet[] {
  const graph = getMergedGraph();
  const queryLower = query.toLowerCase();
  const snippets: KnowledgeSnippet[] = [];

  // 遍历所有实体，计算相关性得分
  for (const entity of graph.entities) {
    const relevance = calculateRelevance(entity, queryLower);
    if (relevance > 0.1) { // 阈值：只返回相关性>0.1的实体
      snippets.push({
        entityId: entity.id,
        content: formatEntityAsContext(entity),
        relevance,
        source: entity.source || 'unknown',
      });
    }
  }

  // 按相关性得分降序排序，取前maxResults个
  snippets.sort((a, b) => b.relevance - a.relevance);
  return snippets.slice(0, maxResults);
}

/**
 * 根据实体ID获取实体详情
 */
export function getEntityById(id: string): KnowledgeEntity | null {
  const graph = getMergedGraph();
  return graph.entities.find(e => e.id === id) || null;
}

/**
 * 获取与某实体相关的所有实体
 */
export function getRelatedEntities(id: string): KnowledgeEntity[] {
  const graph = getMergedGraph();
  const relatedIds = new Set<string>();

  // 找出所有与id相关的边
  for (const rel of graph.relations) {
    if (rel.source === id) relatedIds.add(rel.target);
    if (rel.target === id) relatedIds.add(rel.source);
  }

  // 返回相关实体
  return graph.entities.filter(e => relatedIds.has(e.id));
}

/**
 * 计算实体与查询的相关性得分（0-1）
 * 简单启发式：基于名称、描述、标签、内容中的关键词匹配
 */
function calculateRelevance(entity: KnowledgeEntity, queryLower: string): number {
  let score = 0;

  // 1. 名称匹配（权重最高）
  if (entity.name.toLowerCase().includes(queryLower)) {
    score += 0.5;
  }

  // 2. 描述匹配
  if (entity.description && entity.description.toLowerCase().includes(queryLower)) {
    score += 0.3;
  }

  // 3. 标签匹配
  if (entity.tags) {
    for (const tag of entity.tags) {
      if (tag.toLowerCase().includes(queryLower) || queryLower.includes(tag.toLowerCase())) {
        score += 0.2;
        break;
      }
    }
  }

  // 4. 内容匹配
  if (entity.content && entity.content.toLowerCase().includes(queryLower)) {
    score += 0.15;
  }

  // 5. 关键词精确匹配加分
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  for (const word of queryWords) {
    if (entity.name.toLowerCase().includes(word)) score += 0.05;
    if (entity.tags && entity.tags.some(t => t.toLowerCase().includes(word))) score += 0.03;
  }

  // 归一化到0-1
  return Math.min(score, 1.0);
}

/**
 * 将实体格式化为AI上下文文本
 */
function formatEntityAsContext(entity: KnowledgeEntity): string {
  const parts: string[] = [];

  parts.push(`【${entity.type.toUpperCase()}: ${entity.name}】`);

  if (entity.description) {
    parts.push(entity.description);
  }

  if (entity.content) {
    // 内容截断到500字符（避免context过长）
    const truncated = entity.content.length > 500
      ? entity.content.slice(0, 500) + '...'
      : entity.content;
    parts.push(truncated);
  }

  if (entity.tags && entity.tags.length > 0) {
    parts.push(`标签：${entity.tags.join(', ')}`);
  }

  return parts.join('\n');
}

// ----- 导出默认实例（单例模式） -----

const knowledgeGraphLib = {
  searchKnowledge,
  getEntityById,
  getRelatedEntities,
};

export default knowledgeGraphLib;
