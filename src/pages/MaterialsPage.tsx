// ========================================
// MaterialsPage — 个人资料管理
// 支持：PDF/Markdown/笔记/链接上传与分类管理
// ========================================
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Link2, FileUp, PenLine, Upload, Trash2, Edit2,
  Search, X, Plus, Star, ExternalLink, FolderOpen,
  BookOpen, Presentation, StickyNote, BookMarked, FileBadge,
  MoreHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AnimatedPage from '@/components/shared/AnimatedPage';
import EmptyState from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import type { Material, MaterialCategory, MaterialType } from '@/types';
import { cn } from '@/lib/utils';

// Category definitions
const CATEGORIES: { value: MaterialCategory; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'courseware', label: '课件', icon: Presentation, color: '#7C3AED' },
  { value: 'slides', label: '幻灯片', icon: BookOpen, color: '#0891B2' },
  { value: 'notes', label: '个人笔记', icon: StickyNote, color: '#C9A96E' },
  { value: 'book', label: '电子书', icon: BookMarked, color: '#2D8A4E' },
  { value: 'reference', label: '参考资料', icon: FileBadge, color: '#3d5a80' },
  { value: 'report', label: '报告', icon: FileText, color: '#B91C1C' },
  { value: 'other', label: '其他', icon: FolderOpen, color: '#64748B' },
];

const MATERIAL_TYPES: { value: MaterialType; label: string; icon: React.ElementType }[] = [
  { value: 'pdf', label: 'PDF 文件', icon: FileText },
  { value: 'markdown', label: 'Markdown', icon: PenLine },
  { value: 'note', label: '笔记', icon: StickyNote },
  { value: 'link', label: '链接', icon: Link2 },
  { value: 'file', label: '其他文件', icon: Upload },
];

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function MaterialsPage() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [matForm, setMatForm] = useState({
    title: '', description: '', type: 'file' as MaterialType,
    category: 'other' as MaterialCategory, content: '', tags: '',
  });

  // File upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);

  // Load
  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getMaterials();
      if (res.success && res.data) {
        setMaterials(res.data);
      }
    } catch {
      // handled by fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMaterials(); }, [loadMaterials]);

  // Filter
  const filteredMaterials = useMemo(() => {
    let result = [...materials];
    if (activeCategory !== 'all') {
      result = result.filter(m => m.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [materials, activeCategory, search]);

  // Stats per category
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = { all: materials.length };
    CATEGORIES.forEach(c => {
      stats[c.value] = materials.filter(m => m.category === c.value).length;
    });
    return stats;
  }, [materials]);

  // Open create dialog
  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingMaterial(null);
    setMatForm({ title: '', description: '', type: 'file', category: 'other', content: '', tags: '' });
    setUploadFile(null);
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (mat: Material) => {
    setDialogMode('edit');
    setEditingMaterial(mat);
    setMatForm({
      title: mat.title,
      description: mat.description || '',
      type: mat.type,
      category: mat.category,
      content: mat.content || '',
      tags: mat.tags.join(', '),
    });
    setUploadFile(null);
    setDialogOpen(true);
  };

  // File upload handler
  const handleFileUpload = (file: File) => {
    setUploadFile(file);
    // Auto-fill title if empty
    if (!matForm.title) {
      setMatForm(f => ({ ...f, title: file.name.replace(/\.[^.]+$/, '') }));
    }
  };

  // Drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  // Upload file to server
  const uploadFileToServer = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const token = localStorage.getItem('joan_academic_token') || '';

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ filename: file.name, data: base64 }),
    });

    const result = await res.json();
    if (!result.success) {
      throw new Error(result.error || '上传失败');
    }
    return result.data.url;
  };

  // Save
  const saveMaterial = async () => {
    if (!matForm.title.trim()) {
      toast.error('请填写资料标题');
      return;
    }
    const tags = matForm.tags.split(',').map(t => t.trim()).filter(Boolean);
    try {
      let fileUrl = uploadFile ? await uploadFileToServer(uploadFile) : undefined;

      if (dialogMode === 'create') {
        const res = await api.createMaterial({
          title: matForm.title.trim(),
          description: matForm.description.trim(),
          type: matForm.type,
          category: matForm.category,
          content: matForm.content,
          fileName: uploadFile?.name,
          fileSize: uploadFile?.size,
          fileUrl,
          tags,
        });
        if (res.success && res.data) {
          setMaterials(prev => [res.data, ...prev]);
          toast.success('资料添加成功');
        }
      } else if (editingMaterial) {
        const res = await api.updateMaterial(editingMaterial.id, {
          title: matForm.title.trim(),
          description: matForm.description.trim(),
          type: matForm.type,
          category: matForm.category,
          content: matForm.content,
          tags,
        });
        if (res.success && res.data) {
          setMaterials(prev => prev.map(m => m.id === res.data.id ? res.data : m));
          toast.success('资料已更新');
        }
      }
      setDialogOpen(false);
      setUploadFile(null);
    } catch (err: any) {
      toast.error(err.message || '保存失败');
    }
  };

  // Delete
  const confirmDelete = async () => {
    if (!deletingMaterial) return;
    try {
      await api.deleteMaterial(deletingMaterial.id);
      setMaterials(prev => prev.filter(m => m.id !== deletingMaterial.id));
      toast.success('资料已删除');
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingMaterial(null);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (mat: Material) => {
    try {
      const res = await api.toggleMaterialFavorite(mat.id);
      if (res.success) {
        setMaterials(prev => prev.map(m =>
          m.id === mat.id ? { ...m, isFavorite: res.data!.isFavorite } : m
        ));
      }
    } catch { /* ignore */ }
  };

  // Open external link
  const openLink = (mat: Material) => {
    if (mat.content && (mat.content.startsWith('http://') || mat.content.startsWith('https://'))) {
      window.open(mat.content, '_blank', 'noopener,noreferrer');
    }
  };

  const getCategoryMeta = (cat: MaterialCategory) =>
    CATEGORIES.find(c => c.value === cat) || CATEGORIES[6];

  const getTypeIcon = (type: MaterialType) =>
    MATERIAL_TYPES.find(t => t.value === type)?.icon || FileText;

  return (
    <AnimatedPage>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">个人资料库</h1>
            <p className="text-sm text-muted-foreground">
              管理你的课件、笔记、参考资料等学习资源
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            添加资料
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={v => setActiveCategory(v as any)}>
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-flex w-max gap-1">
              <TabsTrigger value="all" className="gap-1.5">
                全部
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{categoryStats.all}</Badge>
              </TabsTrigger>
              {CATEGORIES.map(cat => (
                <TabsTrigger key={cat.value} value={cat.value} className="gap-1.5">
                  <cat.icon className="h-3.5 w-3.5" />
                  {cat.label}
                  {categoryStats[cat.value] > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{categoryStats[cat.value]}</Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索资料标题、描述或标签..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Materials Grid/List */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="暂无资料"
            description={search ? '未找到匹配的搜索结果' : activeCategory === 'all' ? '点击上方「添加资料」开始上传你的学习资源' : '该分类下暂无资料'}
            action={!search && <Button variant="outline" onClick={openCreateDialog}>添加资料</Button>}
          />
        ) : (
          <div className={cn(
            viewMode === 'grid'
              ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
              : 'space-y-2'
          )}>
            {filteredMaterials.map((mat, i) => {
              const cat = getCategoryMeta(mat.category);
              const TypeIcon = getTypeIcon(mat.type);
              return (
                <motion.div
                  key={mat.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  {viewMode === 'grid' ? (
                    <Card
                      className="group h-full hover:shadow-card-hover cursor-pointer transition-all"
                      onClick={() => mat.type === 'link' ? openLink(mat) : navigate(`/dashboard/material/${mat.id}`)}
                    >
                      <CardContent className="pt-5 flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: cat.color + '20' }}
                          >
                            <TypeIcon className="h-5 w-5" style={{ color: cat.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-1">
                              <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                {mat.title}
                              </h3>
                              {mat.isFavorite && (
                                <Star
                                  className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400 cursor-pointer"
                                  onClick={(e) => { e.stopPropagation(); toggleFavorite(mat); }}
                                />
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[10px] mt-1"
                              style={{ borderColor: cat.color + '60', color: cat.color }}
                            >
                              {cat.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Description */}
                        {mat.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                            {mat.description}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="mt-auto pt-3 flex items-center gap-2">
                          {mat.fileSize && (
                            <span className="text-[11px] text-muted-foreground">{formatFileSize(mat.fileSize)}</span>
                          )}
                          {mat.type === 'link' && mat.content && (
                            <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">{mat.content}</span>
                          )}
                          {mat.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                          ))}
                          {/* Actions */}
                          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {mat.type === 'link' && (
                              <Button
                                size="sm" variant="ghost" className="h-7 w-7 p-0"
                                onClick={(e) => { e.stopPropagation(); openLink(mat); }}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              size="sm" variant="ghost" className="h-7 w-7 p-0"
                              onClick={(e) => { e.stopPropagation(); openEditDialog(mat); }}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeletingMaterial(mat); setDeleteDialogOpen(true); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div
                      className="flex items-center gap-3 rounded-lg border p-3 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => mat.type === 'link' ? openLink(mat) : navigate(`/dashboard/material/${mat.id}`)}
                    >
                      <div className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                        <TypeIcon className="h-4 w-4" style={{ color: cat.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium truncate">{mat.title}</h3>
                          {mat.isFavorite && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px]">{cat.label}</Badge>
                          {mat.tags.slice(0, 2).map(t => (
                            <span key={t} className="text-[10px] text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        {mat.type === 'link' && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); openLink(mat); }}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); openEditDialog(mat); }}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); setDeletingMaterial(mat); setDeleteDialogOpen(true); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Material Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'create' ? '添加新资料' : '编辑资料'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Title */}
              <div>
                <label className="text-sm font-medium mb-1 block">标题 *</label>
                <Input
                  value={matForm.title}
                  onChange={e => setMatForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="资料名称"
                  maxLength={100}
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">资料类型</label>
                <div className="flex flex-wrap gap-2">
                  {MATERIAL_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setMatForm(f => ({ ...f, type: t.value }))}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all',
                        matForm.type === t.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      <t.icon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium mb-2 block">分类</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setMatForm(f => ({ ...f, category: cat.value }))}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all',
                        matForm.category === cat.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted'
                      )}
                      style={matForm.category === cat.value ? { borderColor: cat.color, color: cat.color } : {}}
                    >
                      <cat.icon className="h-3.5 w-3.5" />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-1 block">描述</label>
                <Textarea
                  value={matForm.description}
                  onChange={e => setMatForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="简要描述这份资料..."
                  rows={2}
                />
              </div>

              {/* Content / Upload */}
              {matForm.type === 'link' ? (
                <div>
                  <label className="text-sm font-medium mb-1 block">链接 URL</label>
                  <Input
                    value={matForm.content}
                    onChange={e => setMatForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="https://..."
                    type="url"
                  />
                </div>
              ) : matForm.type === 'markdown' || matForm.type === 'note' ? (
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {matForm.type === 'markdown' ? 'Markdown 内容' : '笔记内容'}
                  </label>
                  <Textarea
                    value={matForm.content}
                    onChange={e => setMatForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="在此输入内容..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium mb-1 block">上传文件</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
                      isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      accept={matForm.type === 'pdf' ? '.pdf' : undefined}
                    />
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{uploadFile.name}</span>
                        <span className="text-xs text-muted-foreground">{formatFileSize(uploadFile.size)}</span>
                        <button onClick={(e) => { e.stopPropagation(); setUploadFile(null); }} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          拖拽文件到此处，或 <span className="text-primary font-medium">点击选择文件</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">支持 PDF、Word、PPT、图片等格式</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="text-sm font-medium mb-1 block">标签（用逗号分隔）</label>
                <Input
                  value={matForm.tags}
                  onChange={e => setMatForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="深度学习, GNN, 课件"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={saveMaterial}>
                {dialogMode === 'create' ? '添加' : '保存'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>确认删除资料</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              确定要删除「<strong>{deletingMaterial?.title}</strong>」吗？此操作不可撤销。
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
              <Button variant="destructive" onClick={confirmDelete}>确认删除</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatedPage>
  );
}
