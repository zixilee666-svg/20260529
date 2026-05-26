import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { spaceService, type SpaceConfig } from '@/services/spaceService';
import { paperApi, projectApi } from '@/services/api';
import type { Paper, Project, Material } from '@/types';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  FlaskConical,
  User,
  Eye,
  Calendar,
  ExternalLink,
  FileText,
  MapPin,
  Mail,
  Star,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Target,
  FolderOpen,
  File,
  Link2,
  FileCode,
  StickyNote,
  Presentation,
  EyeIcon,
} from 'lucide-react';
import AnimatedPage from '@/components/shared/AnimatedPage';
import Loading from '@/components/common/Loading';
import FilePreviewDialog from '@/components/shared/FilePreviewDialog';

// ── Paper Row ──
function PaperRow({ paper, onPreview }: { paper: Paper; onPreview?: (url: string, name: string) => void }) {
  return (
    <div className="group">
      <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50">
        <Link to={`/dashboard/paper/${paper.id}`} className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-medium group-hover:text-primary transition-colors">
              {paper.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {paper.authors.slice(0, 3).join(', ')}
              {paper.authors.length > 3 ? ' et al.' : ''} · {paper.year}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span>{paper.venue}</span>
              {paper.citationCount !== undefined && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3" />
                  {paper.citationCount} 引用
                </span>
              )}
              {paper.tags.slice(0, 3).map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </Link>
        {(paper.pdfUrl || paper.url) && onPreview && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = paper.pdfUrl || paper.url || '';
              onPreview(url, paper.title + '.pdf');
            }}
            className="mt-1 p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors shrink-0"
            title="预览"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Material Row ──
const categoryLabels: Record<string, string> = {
  book: '电子书',
  report: '报告',
  courseware: '课件',
  slides: '幻灯片',
  notes: '笔记',
  reference: '参考资料',
  other: '其他',
};

function getMaterialIcon(type: Material['type'], fileName?: string) {
  if (type === 'pdf') return <FileText className="h-4 w-4" />;
  if (type === 'markdown') return <FileCode className="h-4 w-4" />;
  if (type === 'note') return <StickyNote className="h-4 w-4" />;
  if (type === 'link') return <Link2 className="h-4 w-4" />;
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (ext === 'pptx' || ext === 'ppt') return <Presentation className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

function MaterialRow({ material, onPreview }: { material: Material; onPreview?: (url: string, name: string, content?: string) => void }) {
  const isLink = material.type === 'link';
  const hasFile = !!material.fileUrl;
  const hasContent = !!material.content && (material.type === 'markdown' || material.type === 'note');

  const handleCardClick = () => {
    if (isLink && material.content) {
      window.open(material.content, '_blank', 'noopener,noreferrer');
    } else if (hasFile && onPreview) {
      onPreview(material.fileUrl!, material.fileName || material.title);
    } else if (hasContent && onPreview) {
      // For markdown/note with inline content, preview directly
      onPreview('', material.fileName || material.title, material.content);
    }
  };

  const canClick = (isLink && material.content) || (hasFile && onPreview) || (hasContent && onPreview);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg p-3 transition-colors group',
        canClick && 'hover:bg-accent/50 cursor-pointer'
      )}
      onClick={handleCardClick}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {getMaterialIcon(material.type, material.fileName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium">
          {material.title}
        </p>
        {material.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {material.description}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {categoryLabels[material.category] || material.category}
          </Badge>
          {material.fileName && (
            <span>{material.fileName}</span>
          )}
          {material.fileSize !== undefined && material.fileSize > 0 && (
            <span>{formatFileSize(material.fileSize)}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {isLink && material.content && (
          <a
            href={material.content}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            title="打开链接"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        {hasFile && onPreview && (
          <button
            onClick={() => onPreview(material.fileUrl!, material.fileName || material.title)}
            className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            title="预览"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ── Skeleton Loading ──
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-10 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

// ── Public Profile Page ──
// ── Project Card ──
function ProjectCard({ project, papers }: { project: Project; papers: Paper[] }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const projectPapers = papers.filter(p => project.paperIds?.includes(p.id) || project.relatedPaperIds?.includes(p.id));

  return (
    <div className="rounded-lg border bg-card transition-all hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FlaskConical className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">{project.name || project.title}</h4>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              project.status === 'completed' ? 'bg-green-100 text-green-700' :
              project.status === 'active' || project.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {project.status === 'completed' ? '已完成' :
               project.status === 'active' || project.status === 'in-progress' ? '进行中' : '计划中'}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {project.description}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {project.goalCount || project.objectives?.length || 0} 目标
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {projectPapers.length} 文献
            </span>
            {project.progress !== undefined && (
              <span>进度 {project.progress}%</span>
            )}
          </div>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground mt-1" /> : <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />}
      </button>

      {expanded && (
        <div className="border-t px-4 pb-3 pt-2">
          {project.objectives && project.objectives.length > 0 && (
            <div className="mb-3">
              <h5 className="text-[11px] font-semibold text-muted-foreground mb-1.5">研究目标</h5>
              <div className="space-y-1">
                {project.objectives.map((obj) => (
                  <div key={obj.id} className="flex items-center gap-2 text-xs">
                    <div className={`h-2 w-2 rounded-full ${obj.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={obj.completed ? 'text-muted-foreground line-through' : ''}>{obj.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {projectPapers.length > 0 && (
            <div>
              <h5 className="text-[11px] font-semibold text-muted-foreground mb-1.5">关联文献</h5>
              <div className="space-y-1">
                {projectPapers.map((paper) => (
                  <PaperRow key={paper.id} paper={paper} />
                ))}
              </div>
            </div>
          )}

          {projectPapers.length === 0 && (!project.objectives || project.objectives.length === 0) && (
            <p className="text-xs text-muted-foreground py-2">暂无详细内容</p>
          )}

          {/* View detail link */}
          <div className="mt-3 pt-2 border-t">
            <button
              onClick={() => navigate(`/dashboard/project/${project.id}`)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              查看完整项目详情
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [space, setSpace] = useState<SpaceConfig | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // File preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewName, setPreviewName] = useState('');
  const [previewContent, setPreviewContent] = useState<string | undefined>(undefined);

  const handlePreview = useCallback((url: string, name: string, content?: string) => {
    setPreviewUrl(url);
    setPreviewName(name);
    setPreviewContent(content);
    setPreviewOpen(true);
  }, []);

  useEffect(() => {
    if (username) loadProfile();
    return () => {
      // Reset custom theme on unmount
      document.documentElement.style.removeProperty('--color-primary');
    };
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await spaceService.getProfile(username!);
      if (res.success && res.data) {
        setSpace(res.data);
        // Apply custom theme
        if (res.data.theme?.primaryColor) {
          document.documentElement.style.setProperty(
            '--color-primary',
            res.data.theme.primaryColor,
          );
        }
        // Record view (fire and forget)
        spaceService.recordView(username!).catch(() => {});
        // Load papers, projects and materials (await all)
        await Promise.all([
          loadPapers(username!),
          loadProjects(username!),
          loadMaterials(username!),
        ]);
      } else {
        setError('学术空间不存在');
      }
    } catch {
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const loadPapers = async (uname: string) => {
    try {
      const res = await paperApi.getPapers(uname);
      if (res.success && res.data) {
        setPapers(res.data);
      }
    } catch (e) {
      console.error('Failed to load papers:', e);
    }
  };

  const loadProjects = async (uname: string) => {
    try {
      const res = await projectApi.getProjects(uname);
      if (res.success && res.data) {
        setProjects(res.data);
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  };

  const loadMaterials = async (uname: string) => {
    try {
      const res = await spaceService.getMaterials(uname);
      if (res.success && res.data) {
        setMaterials(res.data);
      }
    } catch (e) {
      console.error('Failed to load materials:', e);
    }
  };

  if (loading) {
    return (
      <AnimatedPage className="min-h-screen bg-ivory-100 dark:bg-primary-900">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <ProfileSkeleton />
        </div>
      </AnimatedPage>
    );
  }

  if (error) {
    return (
      <AnimatedPage className="min-h-screen bg-ivory-100 dark:bg-primary-900">
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h2 className="text-xl font-semibold text-primary-800 dark:text-ivory-100">
            {error}
          </h2>
          <p className="text-sm text-primary-400 mt-2">请检查链接或稍后再试</p>
          <Button variant="outline" className="mt-6" asChild>
            <Link to="/gallery">
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回画廊
            </Link>
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  if (!space) return null;

  return (
    <AnimatedPage className="min-h-screen bg-ivory-100 dark:bg-primary-900">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Back link */}
        <Button variant="ghost" size="sm" className="gap-1 text-primary-400" asChild>
          <Link to="/gallery">
            <ArrowLeft className="w-4 h-4" />
            返回画廊
          </Link>
        </Button>

        {/* Profile Header Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Avatar */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-display text-2xl font-bold">
                  {(space.displayName || space.username).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-primary-800 dark:text-ivory-100 font-display">
                    {space.displayName || space.username}
                  </h1>
                  {space.institution && (
                    <p className="text-sm text-primary-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {space.institution}
                    </p>
                  )}
                  {space.bio && (
                    <p className="mt-2 text-sm text-muted-foreground">{space.bio}</p>
                  )}

                  {/* Research tags */}
                  {space.researchField && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {space.researchField.split(/[,，、]/).map((f) => (
                        <Badge key={f} variant="secondary" className="text-xs">
                          {f.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-primary" />
                      {space.paperCount} 篇文献
                    </span>
                    <span className="flex items-center gap-1">
                      <FlaskConical className="w-4 h-4 text-primary" />
                      {space.projectCount} 个项目
                    </span>
                    <span className="flex items-center gap-1">
                      <FolderOpen className="w-4 h-4 text-primary" />
                      {materials.length} 份资料
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-primary" />
                      {space.viewCount} 次访问
                    </span>
                    {space.lastActiveAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-primary" />
                        最近活跃{' '}
                        {new Date(space.lastActiveAt).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Tabs */}
        <Tabs defaultValue="papers">
          <TabsList className="w-full">
            <TabsTrigger value="papers" className="flex-1 gap-1.5">
              <BookOpen className="w-4 h-4" />
              文献
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex-1 gap-1.5">
              <FlaskConical className="w-4 h-4" />
              项目
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex-1 gap-1.5">
              <FolderOpen className="w-4 h-4" />
              资料
            </TabsTrigger>
            <TabsTrigger value="about" className="flex-1 gap-1.5">
              <User className="w-4 h-4" />
              关于
            </TabsTrigger>
          </TabsList>

          {/* Papers Tab */}
          <TabsContent value="papers">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>文献列表</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    共 {papers.length} 篇
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {papers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    暂无公开文献
                  </div>
                ) : (
                  <div className="space-y-1">
                    {papers.map((paper) => (
                      <PaperRow key={paper.id} paper={paper} onPreview={handlePreview} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>研究项目</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    共 {projects.length} 个
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {space.projectCount > 0
                      ? `该学者有 ${space.projectCount} 个研究项目`
                      : '暂无公开项目'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <ProjectCard key={project.id} project={project} papers={papers} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>资料文件</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    共 {materials.length} 份
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {materials.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    暂无公开资料
                  </div>
                ) : (
                  <div className="space-y-1">
                    {materials.map((material) => (
                      <MaterialRow key={material.id} material={material} onPreview={handlePreview} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-primary-800 dark:text-ivory-100 mb-1">
                    个人简介
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {space.bio || '暂无简介'}
                  </p>
                </div>

                <Separator />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                      所在机构
                    </h4>
                    <p className="text-sm">{space.institution || '未填写'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                      研究领域
                    </h4>
                    <p className="text-sm">{space.researchField || '未填写'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                      加入时间
                    </h4>
                    <p className="text-sm">
                      {new Date(space.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                      用户名
                    </h4>
                    <p className="text-sm">@{space.username}</p>
                  </div>
                </div>

                <Separator />

                <div className="text-center">
                  <p className="text-xs text-primary-400">
                    以圣洁纯粹之心，行理性严谨之事
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* File Preview Dialog */}
        <FilePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          fileUrl={previewUrl}
          fileName={previewName}
          content={previewContent}
        />
      </div>
    </AnimatedPage>
  );
}
