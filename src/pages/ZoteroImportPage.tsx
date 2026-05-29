// ========================================
// ZoteroImportPage — Zotero 文献批量导入页
// 将 Zotero 导出数据（论文+笔记+分类）导入 Academic Hub
// 同源页面，避免 CORS / eo_token 问题
// ========================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { FileDown, Database, BookOpen, Library, ArrowRight, CheckCircle2, XCircle, Loader2, Play, FolderOpen, AlertTriangle } from 'lucide-react';
import { apiClient, IS_MOCK } from '@/services/api';

// ---- 类型定义 ----
interface ZoteroMeta {
  total_papers: number;
  total_notes: number;
  total_attachments: number;
  matched_notes: number;
  collections: number;
  exported_at: string;
}

interface ZoteroCollection {
  name: string;
  count: number;
}

interface ZoteroNote {
  key: string;
  note: string;
  dateAdded: string;
}

interface ZoteroPaper {
  zotero_key: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  abstract: string;
  doi: string;
  url: string;
  tags: string[];
  item_type: string;
  date: string;
  date_added: string;
  collections: string[];
  notes: ZoteroNote[];
  note_count: number;
}

interface ZoteroExport {
  meta: ZoteroMeta;
  collections: Record<string, ZoteroCollection>;
  papers: ZoteroPaper[];
}

interface ImportLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warn';
  message: string;
}

// ---- 分类库配置 ----
const LIBRARY_CONFIGS = [
  { name: 'Cross_GNN_Fraud', color: '#ef4444', icon: 'Network', desc: '跨领域GNN在欺诈检测中的应用' },
  { name: 'Fraud_Core', color: '#f59e0b', icon: 'Shield', desc: '金融欺诈检测核心文献' },
  { name: 'GNN_Core', color: '#3b82f6', icon: 'GitBranch', desc: '图神经网络核心理论与方法' },
];

const COLLECTION_TAGS: Record<string, { color: string; bg: string; text: string }> = {
  'Cross_GNN_Fraud': { color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700' },
  'Fraud_Core': { color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700' },
  'GNN_Core': { color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-700' },
};

// ============================================================
// 主组件
// ============================================================
export default function ZoteroImportPage() {
  // 状态
  const [data, setData] = useState<ZoteroExport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [creatingLibs, setCreatingLibs] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [libIds, setLibIds] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<'idle' | 'libraries' | 'import' | 'link' | 'done'>('idle');
  const logContainerRef = useRef<HTMLDivElement>(null);

  // 记录日志
  const addLog = useCallback((type: ImportLog['type'], message: string) => {
    const entry: ImportLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setLogs(prev => [...prev, entry]);
  }, []);

  // 自动滚动日志
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // 加载数据
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const resp = await fetch('/zotero_full_export.json');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        const json: ZoteroExport = await resp.json();
        setData(json);
        addLog('info', `✅ 数据加载成功: ${json.meta.total_papers} 篇论文, ${json.meta.matched_notes} 条笔记, ${json.meta.collections} 个分类`);
      } catch (e: any) {
        setLoadError(e.message);
        addLog('error', `❌ 数据加载失败: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [addLog]);

  // 检查 Mock 模式
  useEffect(() => {
    if (IS_MOCK) {
      addLog('warn', '⚠️ 当前为 Mock 模式，数据将仅本地暂存，不会持久化到 KV 存储');
    }
  }, [addLog]);

  // ---- 创建分类库 ----
  const handleCreateLibraries = async () => {
    if (IS_MOCK) {
      addLog('warn', '⚠️ Mock 模式下跳过分类库创建（使用模拟数据）');
      const mockIds: Record<string, string> = {};
      LIBRARY_CONFIGS.forEach(l => { mockIds[l.name] = `mock-lib-${l.name}`; });
      setLibIds(mockIds);
      addLog('success', '✅ Mock 模式：分类库已就绪');
      toast.success('分类库创建完成（Mock）');
      return;
    }

    setCreatingLibs(true);
    setPhase('libraries');
    addLog('info', '📂 开始创建文献分类库...');

    const created: Record<string, string> = {};

    for (const lib of LIBRARY_CONFIGS) {
      try {
        addLog('info', `  创建 ${lib.name}...`);
        const resp = await apiClient.post<any>('/libraries', {
          name: lib.name,
          description: lib.desc,
          color: lib.color,
          icon: lib.icon,
          paperIds: [],
        });

        if ('success' in resp && resp.success && resp.data) {
          created[lib.name] = resp.data.id || '';
          addLog('success', `  ✅ ${lib.name} → ${resp.data.id}`);
        } else {
          // 检查是否已存在
          addLog('warn', `  ⚠️ ${lib.name} 可能已存在，尝试获取...`);
          const listResp = await apiClient.get<any[]>('/users/admin/libraries');
          if (Array.isArray(listResp) || ('data' in listResp && Array.isArray((listResp as any).data))) {
            const libs = Array.isArray(listResp) ? listResp : (listResp as any).data;
            const existing = libs.find((l: any) => l.name === lib.name);
            if (existing) {
              created[lib.name] = existing.id;
              addLog('success', `  ✅ ${lib.name} 已存在 → ${existing.id}`);
            } else {
              addLog('error', `  ❌ ${lib.name} 创建失败`);
            }
          }
        }
      } catch (e: any) {
        addLog('error', `  ❌ ${lib.name} 异常: ${e.message}`);
      }
    }

    if (Object.keys(created).length > 0) {
      setLibIds(created);
      addLog('success', `✅ 分类库就绪: ${Object.keys(created).length}/${LIBRARY_CONFIGS.length} 个`);
      toast.success(`创建了 ${Object.keys(created).length} 个分类库`);
    } else {
      addLog('error', '❌ 分类库全部创建失败');
      toast.error('分类库创建失败');
    }

    setCreatingLibs(false);
  };

  // ---- 批量导入论文 ----
  const handleStartImport = async () => {
    if (!data) return;

    // Mock 模式处理
    if (IS_MOCK) {
      addLog('info', '⚠️ Mock 模式：模拟导入过程...');
      const total = data.meta.total_papers;
      setProgress({ current: 0, total, success: 0, failed: 0 });
      setImporting(true);
      setPhase('import');

      for (let i = 0; i < Math.min(total, 10); i++) {
        await new Promise(r => setTimeout(r, 150));
        const paper = data.papers[i];
        setProgress(p => ({
          current: p.current + 1,
          total,
          success: p.success + 1,
          failed: p.failed,
        }));
        addLog('success', `  ✅ [${i + 1}/${total}] ${paper.title.slice(0, 60)}... (+${paper.note_count || 0}条笔记)`);
      }

      // 显示摘要
      const shown = Math.min(total, 10);
      addLog('info', `🟡 Mock 模式：仅展示前 ${shown} 篇。生产环境将导入全部 ${total} 篇`);
      addLog('success', '✅ Mock 导入完成');
      setImporting(false);
      setPhase('done');
      toast.success(`Mock: 展示了 ${shown} 篇论文`);
      return;
    }

    // 真实 API 导入
    setImporting(true);
    setPhase('import');
    const papers = data.papers;
    const total = papers.length;
    let success = 0;
    let failed = 0;

    setProgress({ current: 0, total, success: 0, failed: 0 });
    addLog('info', `📥 开始导入 ${total} 篇论文（每批 5 篇）...`);

    const BATCH = 5;

    for (let i = 0; i < total; i += BATCH) {
      const batch = papers.slice(i, i + BATCH);

      const results = await Promise.allSettled(
        batch.map(async (paper, bi) => {
          const idx = i + bi;
          const notes = (paper.notes || []).map((n, j) => ({
            id: `zn-${paper.zotero_key}-${j}`,
            content: (n.note || '').slice(0, 5000),
            createdAt: n.dateAdded || new Date().toISOString(),
          }));

          const paperObj = {
            title: paper.title || '未命名',
            authors: paper.authors || [],
            year: paper.year || 2024,
            venue: paper.venue || 'Unknown',
            abstract: (paper.abstract || '').slice(0, 3000),
            doi: paper.doi || '',
            url: paper.url || '',
            tags: (paper.tags || []).slice(0, 10),
            notes: notes.slice(0, 10),
            zoteroKey: paper.zotero_key,
            zoteroCollections: paper.collections || [],
          };

          try {
            const resp = await apiClient.post<any>('/papers', paperObj);
            return { idx, paper, resp, success: ('success' in resp && resp.success) };
          } catch (e: any) {
            return { idx, paper, error: e.message, success: false };
          }
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value.success) {
            success++;
            const p = r.value.paper;
            const noteCount = p.note_count || (p.notes || []).length;
            addLog('success', `  ✅ [${r.value.idx + 1}/${total}] ${p.title.slice(0, 60)}... (+${noteCount}条笔记)`);
          } else {
            failed++;
            addLog('error', `  ❌ [${r.value.idx + 1}] ${r.value.paper.title.slice(0, 50)}: ${(r.value as any).error || 'unknown'}`);
          }
        } else {
          failed++;
          addLog('error', `  ❌ [${i + 1}~${Math.min(i + BATCH, total)}] 请求异常: ${r.reason}`);
        }
      }

      setProgress({ current: Math.min(i + BATCH, total), total, success, failed });

      // 避免速率限制
      await new Promise(r => setTimeout(r, 300));
    }

    addLog('info', '─'.repeat(50));
    addLog('success', `🎉 导入完成: 成功 ${success} 篇, 失败 ${failed} 篇`);

    setProgress({ current: total, total, success, failed });
    setImporting(false);
    toast.success(`导入完成: ${success}/${total} 篇`);
  };

  // ---- 关联论文到分类库 ----
  const handleLinkToLibraries = async () => {
    if (!data) return;

    const libIdsAvailable = Object.keys(libIds).length > 0;
    if (!libIdsAvailable) {
      addLog('warn', '⚠️ 请先创建分类库');
      toast.error('请先创建分类库');
      return;
    }

    setImporting(true);
    setPhase('link');
    addLog('info', '📂 关联论文到分类库...');

    if (IS_MOCK) {
      addLog('success', '✅ Mock 模式：模拟关联完成');
      toast.success('关联完成（Mock）');
      setImporting(false);
      setPhase('done');
      return;
    }

    try {
      // 获取已导入的论文
      const papersResp = await apiClient.get<any>('/papers');
      const allPapers = Array.isArray(papersResp) ? papersResp :
        ('data' in papersResp ? (papersResp as any).data : []);

      if (!Array.isArray(allPapers) || allPapers.length === 0) {
        addLog('warn', '⚠️ 未找到已导入的论文，请先执行导入');
        return;
      }

      let linked = 0;
      for (const paper of data.papers) {
        const collections = paper.collections || [];
        if (collections.length === 0) continue;

        const matched = allPapers.find((p: any) => p.zoteroKey === paper.zotero_key);
        if (!matched) continue;

        for (const colName of collections) {
          const libId = libIds[colName];
          if (!libId || !matched.id) continue;

          try {
            await apiClient.post(`/libraries/${libId}/papers`, { paperId: matched.id });
            linked++;
          } catch {
            // 可能已关联，跳过
          }
        }
      }

      addLog('success', `✅ ${linked} 个关联已建立`);
      toast.success(`${linked} 个论文关联成功`);
    } catch (e: any) {
      addLog('error', `❌ 关联失败: ${e.message}`);
    } finally {
      setImporting(false);
      setPhase('done');
    }
  };

  // ---- "一键全流程" ----
  const handleFullImport = async () => {
    await handleCreateLibraries();
    // 小延迟，等 UI 更新
    await new Promise(r => setTimeout(r, 500));
    await handleStartImport();
    await new Promise(r => setTimeout(r, 500));
    await handleLinkToLibraries();
  };

  // ---- 渲染 ----
  const isWorking = importing || creatingLibs;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 页头 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <FileDown className="w-7 h-7 text-[#c9a04d]" />
          Zotero 文献批量导入
        </h1>
        <p className="text-muted-foreground mt-1">
          将 Zotero 文献库（论文 + 笔记 + 分类）一键导入 Academic Hub
        </p>
      </div>

      {/* Mock 提示 */}
      {IS_MOCK && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Mock 模式</p>
            <p className="text-sm text-amber-600">当前为本地调试模式，数据不会持久化到服务器。部署到生产环境后（VITE_MOCK_MODE=false）将正常导入。</p>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#3d5a80]" />
          <span className="ml-3 text-muted-foreground">加载 Zotero 导出数据...</span>
        </div>
      )}

      {/* 加载错误 */}
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-700 font-medium">数据加载失败</p>
          <p className="text-sm text-red-500 mt-1">{loadError}</p>
          <p className="text-xs text-red-400 mt-3">请确保 zotero_full_export.json 在 public/ 目录下</p>
        </div>
      )}

      {/* 数据就绪 */}
      {data && !loading && (
        <>
          {/* 数据概览 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={BookOpen} label="论文" value={data.meta.total_papers} />
            <StatCard icon={FileDown} label="笔记" value={data.meta.matched_notes} />
            <StatCard icon={Library} label="分类" value={data.meta.collections} />
            <StatCard icon={Database} label="附件" value={data.meta.total_attachments} />
          </div>

          {/* 分类标签 */}
          {Object.keys(data.collections).length > 0 && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Zotero 分类</h3>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(data.collections).map(([key, col]) => {
                  const tag = COLLECTION_TAGS[col.name];
                  return (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${tag?.bg || 'bg-gray-50'} ${tag?.text || 'text-gray-600'}`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag?.color || '#888' }} />
                      {col.name} ({col.count}篇)
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* 操作区 */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Play className="w-5 h-5 text-[#3d5a80]" />
              导入操作
            </h3>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCreateLibraries}
                disabled={isWorking}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c9a04d] hover:bg-[#b8943d] disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                仅创建分类库
              </button>

              <button
                onClick={handleStartImport}
                disabled={isWorking}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3d5a80] hover:bg-[#2c4466] disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <FileDown className="w-4 h-4" />
                开始导入 ({data.meta.total_papers} 篇)
              </button>

              <button
                onClick={handleLinkToLibraries}
                disabled={isWorking || Object.keys(libIds).length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
                title={Object.keys(libIds).length === 0 ? '请先创建分类库' : ''}
              >
                <ArrowRight className="w-4 h-4" />
                关联到分类库
              </button>

              <button
                onClick={handleFullImport}
                disabled={isWorking}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <Play className="w-4 h-4" />
                一键全流程
              </button>
            </div>

            {/* 进度条 */}
            {progress.total > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    进度: {progress.current}/{progress.total}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {progress.success}
                    </span>
                    {progress.failed > 0 && (
                      <span className="flex items-center gap-1 text-red-500">
                        <XCircle className="w-3.5 h-3.5" /> {progress.failed}
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#3d5a80] to-[#6baed6] rounded-full transition-all duration-300"
                    style={{ width: `${progress.total > 0 ? (progress.current / progress.total * 100) : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* 工作状态 */}
            {isWorking && (
              <div className="flex items-center gap-2 text-sm text-[#3d5a80]">
                <Loader2 className="w-4 h-4 animate-spin" />
                {phase === 'libraries' && '创建分类库中...'}
                {phase === 'import' && '导入论文中...'}
                {phase === 'link' && '关联论文到分类库...'}
              </div>
            )}

            {/* 完成状态 */}
            {phase === 'done' && !isWorking && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                全部操作完成
              </div>
            )}
          </div>

          {/* 日志面板 */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-300 font-mono">📝 导入日志</h3>
              <button
                onClick={() => setLogs([])}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                清空
              </button>
            </div>
            <div
              ref={logContainerRef}
              className="bg-gray-950 text-sm font-mono p-4 h-[400px] overflow-y-auto"
            >
              {logs.length === 0 ? (
                <span className="text-gray-500">准备就绪，点击导入按钮开始...</span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                    <span
                      className={
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-emerald-400' :
                        log.type === 'warn' ? 'text-amber-400' :
                        'text-blue-300'
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---- 统计卡片子组件 ----
function StatCard({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-xl border p-5 text-center hover:shadow-md transition-shadow">
      <Icon className="w-8 h-8 text-[#3d5a80] mx-auto mb-2" />
      <div className="text-3xl font-bold text-[#1a1a2e]">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
