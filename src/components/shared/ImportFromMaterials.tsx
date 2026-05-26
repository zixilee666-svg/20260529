// ========================================
// ImportFromMaterials — 从资料导入文献
// 在 LibraryPage / MyLibraryPage 中使用
// ========================================
import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Upload, X, FileType, BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import type { Material, Paper } from '@/types';

interface ImportFromMaterialsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: (paper: Paper) => void;
}

export function ImportFromMaterialsDialog({ open, onOpenChange, onImportSuccess }: ImportFromMaterialsProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());

  const loadMaterials = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const res = await api.getMaterials();
      if (res.success && res.data) {
        const matData = (res as any).data || [];
        setMaterials(Array.isArray(matData) ? matData : (matData.data || []));
      }
    } catch (e) {
      console.error('Failed to load materials:', e);
    } finally {
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  // 尝试从资料内容中提取元数据
  const extractMetadata = (content?: string) => {
    const result: { authors: string[]; year: number; doi: string; abstract: string } = {
      authors: [], year: new Date().getFullYear(), doi: '', abstract: content?.slice(0, 500) || '',
    };
    if (!content) return result;

    // 提取年份 (1900-2030)
    const yearMatch = content.match(/\b(19\d{2}|20[0-3]\d)\b/);
    if (yearMatch) result.year = parseInt(yearMatch[1], 10);

    // 提取 DOI
    const doiMatch = content.match(/10\.\d{4,}\/[^\s\n]+/);
    if (doiMatch) result.doi = doiMatch[0];

    // 尝试提取作者 (简单的启发式匹配)
    const authorPatterns = [
      /(?:Authors?|作者)[：:]\s*([\s\S]{3,200}?)(?:\n|\r|Abstract|摘要|Keywords|关键词)/i,
      /(?:Authors?|作者)[：:]\s*([A-Z][^\n\r]{3,200}?)(?:\n|\r|$)/i,
    ];
    for (const pattern of authorPatterns) {
      const match = content.match(pattern);
      if (match) {
        const raw = match[1].trim();
        result.authors = raw.split(/[,，;；&]/).map(s => s.trim()).filter(Boolean).slice(0, 10);
        break;
      }
    }

    return result;
  };

  const handleImport = async (material: Material) => {
    setImportingIds(prev => new Set(prev).add(material.id));
    try {
      const meta = extractMetadata(material.content);
      const paper: Partial<Paper> = {
        title: material.title || material.fileName?.replace(/\.[^/.]+$/, '') || '未命名文献',
        abstract: meta.abstract,
        authors: meta.authors,
        year: meta.year,
        venue: material.source || '资料导入',
        doi: meta.doi,
        tags: material.tags || [],
        pdfUrl: material.fileUrl || '',
      };
      const res = await api.createPaper(paper);
      if (res.success && res.data) {
        toast.success(`「${paper.title}」已导入为文献，请补充元数据`);
        setMaterials(prev => prev.filter(m => m.id !== material.id));
        onImportSuccess?.(res.data);
      } else {
        toast.error('导入失败');
      }
    } catch (e) {
      toast.error('导入失败: ' + (e as Error).message);
    } finally {
      setImportingIds(prev => {
        const next = new Set(prev);
        next.delete(material.id);
        return next;
      });
    }
  };

  const typeLabel = (type?: string) => {
    switch (type) {
      case 'pdf': return 'PDF';
      case 'markdown': return 'Markdown';
      case 'file': return '文件';
      default: return '资料';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            从资料导入文献
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            正在加载资料...
          </div>
        ) : materials.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">暂无可用资料</p>
            <p className="text-xs text-muted-foreground">
              您可以在「导入导出」页面上传 PDF、Markdown、DOCX 或 TXT 文件作为资料
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted-foreground">
              选择资料将其导入为文献。导入后会从资料列表中移除。
            </p>
            {materials.map((material) => (
              <Card key={material.id} className="overflow-hidden">
                <CardContent className="p-3 flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileType className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{material.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {typeLabel(material.type)}
                      </Badge>
                      {material.fileName && (
                        <span className="text-[11px] text-muted-foreground truncate">
                          {material.fileName}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-8"
                    disabled={importingIds.has(material.id)}
                    onClick={() => handleImport(material)}
                  >
                    {importingIds.has(material.id) ? (
                      <span className="text-xs">导入中...</span>
                    ) : (
                      <>
                        <BookOpen className="h-3 w-3 mr-1" />
                        <span className="text-xs">导入</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── 快捷入口按钮（显示可导入数量）──
export function ImportMaterialsButton({ onClick, count }: { onClick: () => void; count?: number }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={onClick}
    >
      <Upload className="h-4 w-4" />
      从资料导入
      {count !== undefined && count > 0 && (
        <Badge variant="default" className="ml-1 h-5 px-1.5 text-[10px]">
          {count}
        </Badge>
      )}
    </Button>
  );
}
