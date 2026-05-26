// ========================================
// ProjectDetailPage — 项目详情页
// 从学术空间卡片链接进入，展示项目完整信息
// ========================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, FlaskConical, Target, BookOpen, Calendar,
  CheckCircle2, Circle, ChevronRight, AlertCircle, Loader2,
  Hash, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import AnimatedPage from '@/components/shared/AnimatedPage';
import { projectApi, paperApi } from '@/services/api';
import type { Project, Paper } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  'active': { label: '进行中', variant: 'default', color: 'bg-blue-100 text-blue-700' },
  'in-progress': { label: '进行中', variant: 'default', color: 'bg-blue-100 text-blue-700' },
  'completed': { label: '已完成', variant: 'default', color: 'bg-green-100 text-green-700' },
  'planned': { label: '计划中', variant: 'secondary', color: 'bg-gray-100 text-gray-600' },
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  } catch {
    return dateStr;
  }
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    loadProject(id);
  }, [id]);

  const loadProject = async (projectId: string) => {
    setLoading(true);
    try {
      const res = await projectApi.getProject(projectId);
      if (res.success && res.data) {
        const p = res.data as Project;
        setProject(p);
        // Load related papers
        if (p.paperIds?.length || p.relatedPaperIds?.length) {
          loadPapers(p);
        }
      } else {
        setError('项目不存在或已被删除');
      }
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadPapers = async (p: Project) => {
    try {
      // Try to get papers from the project owner's paper list
      if (p.userId) {
        const res = await paperApi.getPapersByUserId?.(p.userId) || await paperApi.getPapers(p.username || '');
        if (res.success && res.data) {
          const allIds = new Set([...(p.paperIds || []), ...(p.relatedPaperIds || [])]);
          setPapers((res.data as Paper[]).filter((paper: Paper) => allIds.has(paper.id)));
        }
      }
    } catch {
      // Ignore paper loading errors
    }
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AnimatedPage>
    );
  }

  if (error || !project) {
    return (
      <AnimatedPage>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">{error || '项目未找到'}</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/dashboard/research')}>
            <ArrowLeft className="h-4 w-4" />
            返回研究页面
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  const status = statusConfig[project.status] || statusConfig.planned;
  const objectives = project.objectives || [];
  const completedCount = objectives.filter(o => o.completed).length;

  return (
    <AnimatedPage>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="outline" size="sm" className="gap-1 shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{project.name || project.title || '未命名项目'}</h1>
              <Badge className={cn(status.color, 'border-0')}>
                {status.label}
              </Badge>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                创建于 {formatDate(project.createdAt)}
              </span>
              {project.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  开始 {formatDate(project.startDate)}
                </span>
              )}
              {project.endDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  截止 {formatDate(project.endDate)}
                </span>
              )}
              {project.username && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <Link to={`/u/${project.username}`} className="text-primary hover:underline">
                    @{project.username}
                  </Link>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">项目进度</span>
              <span className="text-sm font-bold">{project.progress || 0}%</span>
            </div>
            <Progress value={project.progress || 0} className="h-2" />
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                {completedCount}/{objectives.length} 目标已完成
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {papers.length} 篇关联文献
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Objectives */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              研究目标
            </CardTitle>
          </CardHeader>
          <CardContent>
            {objectives.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无研究目标</p>
            ) : (
              <div className="space-y-3">
                {objectives.map((obj, idx) => (
                  <motion.div
                    key={obj.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    {obj.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <span className={cn('text-sm', obj.completed && 'line-through text-muted-foreground')}>
                      {obj.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Papers */}
        {papers.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                关联文献
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {papers.map((paper) => (
                  <Link
                    key={paper.id}
                    to={`/dashboard/paper/${paper.id}`}
                    className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50 group"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Hash className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {paper.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {paper.authors.slice(0, 3).join(', ')}
                        {paper.authors.length > 3 ? ' et al.' : ''} · {paper.year}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {project.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
