// ========================================
// PaperDetailPage — 文献详情
// ========================================
import { useState, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, ExternalLink, Quote, BookmarkPlus,
  BookOpen, MessageSquare, Highlighter, Calendar, Hash,
  FileText, Users, Building2, Tag, Clock, Trash2, Pencil,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import AnimatedPage from '@/components/shared/AnimatedPage';
import JoanQuote from '@/components/shared/JoanQuote';
import EmptyState from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import type { Paper, Note, Highlight } from '@/types';
import { EditPaperDialog } from '@/components/shared/EditPaperDialog';

// ---------- Loading Skeleton ----------
function PaperDetailSkeleton() {
  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-20" />
          <div className="flex-1" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-16" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-24" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </AnimatedPage>
  );
}

// ========== Main Page ==========
export default function PaperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Data state
  const [paper, setPaper] = useState<Paper | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [relatedPapers, setRelatedPapers] = useState<Paper[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [noteSaving, setNoteSaving] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [error, setError] = useState(false);

  // Load paper data on mount
  const loadPaper = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const [paperRes, notesRes, highlightsRes, allPapersRes] = await Promise.all([
        api.getPaper(id),
        api.getNotes(id),
        api.getHighlights(id),
        api.getPapers(),
      ]);

      if (paperRes.success && paperRes.data) {
        setPaper(paperRes.data);
        setIsFav(paperRes.data.isFavorited);

        // Related papers: tag matching
        if (allPapersRes.success && allPapersRes.data) {
          const currentTags = new Set(paperRes.data.tags || []);
          setRelatedPapers(
            allPapersRes.data
              .filter((p) => p.id !== paperRes.data!.id && (p.tags || []).some((t) => currentTags.has(t)))
              .slice(0, 6)
          );
        }
      } else {
        setError(true);
      }

      if (notesRes.success && notesRes.data) {
        setSavedNotes(notesRes.data);
      }

      if (highlightsRes.success && highlightsRes.data) {
        setHighlights(highlightsRes.data);
      }
    } catch (err) {
      console.error('[PaperDetail] Load error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadPaper(); }, [loadPaper]);

  // Toggle favorite
  const toggleFav = async () => {
    if (!id || favLoading) return;
    setFavLoading(true);
    try {
      const res = await api.toggleFavorite(id);
      if (res.success && res.data) {
        setIsFav(res.data.isFavorited);
        toast.success(res.data.isFavorited ? '已添加到收藏' : '已取消收藏');
      }
    } catch {
      toast.error('操作失败，请重试');
    } finally {
      setFavLoading(false);
    }
  };

  // Add note
  const addNote = async () => {
    if (!noteInput.trim() || !id || noteSaving) return;
    setNoteSaving(true);
    try {
      const res = await api.addNote(id, noteInput.trim());
      if (res.success && res.data) {
        setSavedNotes((prev) => [...prev, res.data]);
        setNoteInput('');
        toast.success('笔记已保存');
      }
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setNoteSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!id) return;
    try {
      await api.deleteNote(id, noteId);
      setSavedNotes((prev) => prev.filter(n => n.id !== noteId));
      toast.success('笔记已删除');
    } catch {
      toast.error('删除失败，请重试');
    }
  };

  const handleDeletePaper = async () => {
    if (!paper) return;
    if (!confirm('确定要删除这篇文献吗？此操作不可撤销。')) return;
    try {
      await api.deletePaper(paper.id);
      toast.success('文献已删除');
      navigate('/dashboard/library');
    } catch {
      toast.error('删除失败');
    }
  };

  const handlePaperUpdated = (updated: Paper) => {
    setPaper(updated);
  };

  const copyCitation = (format: string) => {
    if (!paper) return;
    let citation = '';
    const authors = paper.authors.join(', ');
    switch (format) {
      case 'bibtex':
        citation = `@${paper.venueType === 'conference' ? 'inproceedings' : paper.venueType === 'journal' ? 'article' : 'misc'}{${paper.authors[0]?.split(' ').pop()?.toLowerCase() ?? 'unknown'}${paper.year},
  title={${paper.title}},
  author={${authors}},
  year={${paper.year}},
  booktitle={${paper.venue}}
}`;
        break;
      case 'ieee':
        citation = `${authors}, "${paper.title}," ${paper.venue}, ${paper.year}.`;
        break;
      case 'gb7714':
        citation = `${authors}. ${paper.title}[J]. ${paper.venue}, ${paper.year}.`;
        break;
    }
    navigator.clipboard.writeText(citation).then(() => {
      toast.success(`${format.toUpperCase()} 引用已复制`);
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = citation;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success(`${format.toUpperCase()} 引用已复制`);
    });
  };

  // Loading state
  if (loading) return <PaperDetailSkeleton />;

  // Error / not found state
  if (error || !paper) {
    return (
      <AnimatedPage>
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="文献未找到"
          description="请求的文献不存在或已被移除。"
          action={
            <Button onClick={() => navigate('/dashboard/library')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回文献库
            </Button>
          }
        />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="space-y-6">
        {/* Top Nav */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/library')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyCitation('bibtex')}
              className="text-xs"
            >
              <Quote className="h-3 w-3 mr-1" />
              BibTeX
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyCitation('ieee')}
              className="text-xs"
            >
              IEEE
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyCitation('gb7714')}
              className="text-xs"
            >
              GB/T
            </Button>
            <Button
              variant={isFav ? 'default' : 'outline'}
              size="sm"
              onClick={toggleFav}
              disabled={favLoading}
            >
              <Star className={cn('h-4 w-4 mr-1', isFav && 'fill-current')} />
              {isFav ? '已收藏' : '收藏'}
            </Button>
            {paper.pdfUrl ? (
              <Button variant="default" size="sm" asChild>
                <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  PDF
                </a>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ExternalLink className="h-4 w-4 mr-1" />
                暂无PDF
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              编辑
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDeletePaper}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              删除
            </Button>
          </div>
        </div>

        {/* Header */}
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {(paper.tags || []).map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
            {paper.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {(paper.authors || []).join(', ')}
              </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {paper.venue}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {paper.year}
            </span>
            <span className="flex items-center gap-1">
              <BookmarkPlus className="h-4 w-4" />
              {paper.citationCount || 0} 引用
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              添加于 {formatDate(paper.addedAt || paper.addedDate || '')}
            </span>
          </div>
        </div>

        {/* Joan's Note */}
        {paper.joanNote && (
          <JoanQuote category="academic" className="max-w-full" />
        )}

        {/* Edit Dialog */}
        <EditPaperDialog
          open={editDialogOpen}
          paper={paper}
          onOpenChange={setEditDialogOpen}
          onSaved={handlePaperUpdated}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="notes">
              笔记
              {savedNotes.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
                  {savedNotes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="highlights">
              高亮标注
              {highlights.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
                  {highlights.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="related">相关文献</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-6">
            {/* Abstract */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">摘要</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {paper.abstract}
                </p>
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">关键词</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(paper.keywords || []).map((kw) => (
                    <Badge key={kw} variant="outline" className="gap-1">
                      <Hash className="h-3 w-3" />
                      {kw}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Meta Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">元数据</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                  {[
                    ['发表类型', paper.venueType],
                    ['会议/期刊', paper.venue],
                    ['年份', String(paper.year)],
                    ['引用量', String(paper.citationCount)],
                    ['DOI', paper.doi || '暂无'],
                    ['PDF', paper.pdfUrl ? '可用' : '暂无'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <dt className="text-muted-foreground w-20 shrink-0">{label}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  添加笔记
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="在这里记录你的阅读笔记、思考与感悟..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  rows={5}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={addNote} disabled={!noteInput.trim() || noteSaving}>
                    {noteSaving ? '保存中...' : '保存笔记'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {savedNotes.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-8 w-8" />}
                title="暂无笔记"
                description="在上方添加第一条阅读笔记。"
              />
            ) : (
              <div className="space-y-3">
                {savedNotes.map((note, i) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-[11px] text-muted-foreground">
                            {formatDate(note.createdAt)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteNote(note.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Highlights Tab */}
          <TabsContent value="highlights" className="mt-4">
            {highlights.length === 0 ? (
              <EmptyState
                icon={<Highlighter className="h-8 w-8" />}
                title="暂无高亮标注"
                description="在 PDF 预览模式中选择文本即可创建高亮标注。PDF 预览功能即将上线。"
              />
            ) : (
              <div className="space-y-3">
                {highlights.map((hl, i) => (
                  <motion.div
                    key={hl.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card>
                      <CardContent className="pt-4">
                        <div
                          className="text-sm leading-relaxed px-3 py-2 rounded"
                          style={{ backgroundColor: `${hl.color}22`, borderLeft: `3px solid ${hl.color}` }}
                        >
                          {hl.text}
                        </div>
                        {hl.note && (
                          <p className="mt-2 text-xs text-muted-foreground italic">{hl.note}</p>
                        )}
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {hl.page ? `第 ${hl.page} 页 · ` : ''}{formatDate(hl.createdAt)}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Related Tab */}
          <TabsContent value="related" className="mt-4">
            {relatedPapers.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="h-8 w-8" />}
                title="暂无相关文献"
                description="未找到与本文标签匹配的其他文献。"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPapers.map((rp) => (
                  <Link key={rp.id} to={`/dashboard/paper/${rp.id}`}>
                    <Card className="h-full transition-all hover:shadow-card-hover cursor-pointer">
                      <CardContent className="pt-4 pb-3">
                        <h4 className="line-clamp-2 text-sm font-semibold hover:text-primary transition-colors">
                          {rp.title}
                        </h4>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {(rp.authors || []).slice(0, 2).join(', ')} · {rp.year}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(rp.tags || []).slice(0, 2).map((t) => (
                            <Badge
                              key={t}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AnimatedPage>
  );
}
