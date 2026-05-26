// ========================================
// DashboardPage — 主页仪表盘 (API 集成版 + 增强交互)
// ========================================
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Star, Clock, Trophy, Flame, TrendingUp, FileText, FolderOpen,
  RefreshCw, ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AnimatedPage from '@/components/shared/AnimatedPage';
import { AnimatedCounter, formatNumber } from '@/components/shared/AnimatedCounter';
import JoanQuote from '@/components/shared/JoanQuote';
import { api } from '@/lib/api';
import type { Paper, Project, ReadingStats } from '@/types';
import { cn } from '@/lib/utils';

// ---------- 统计卡片 ----------
function StatCard({
  icon: Icon, label, value, sub, color, link, animationDelay = 0
}: {
  icon: React.ElementType; label: string; value: number;
  sub?: string; color: string; link?: string; animationDelay?: number;
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (link) {
      navigate(link);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.3 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={cn(link && 'cursor-pointer')}
    >
      <Card className={cn(
        'h-full transition-all',
        link && 'hover:shadow-md hover:border-primary/30'
      )}>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-1">
              <AnimatedCounter
                value={value}
                duration={1.2}
                formatter={(v) => formatNumber(Math.round(v))}
                className="text-2xl font-bold tracking-tight"
              />
              {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
            </div>
          </div>
          {link && (
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------- 阅读热力图 ----------
function ReadingHeatmap({ data }: { data: number[] }) {
  const days = ['一', '二', '三', '四', '五', '六', '日'];

  const getColor = (v: number) => {
    if (v === 0) return 'bg-muted/30';
    if (v === 1) return 'bg-primary/20';
    if (v <= 3) return 'bg-primary/40';
    if (v <= 5) return 'bg-primary/70';
    return 'bg-primary';
  };

  const getLabel = (v: number) => {
    if (v === 0) return '无活动';
    if (v === 1) return '1 篇文献';
    return `${v} 篇文献`;
  };

  // Build calendar grid aligned by week (Mon-Sun)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the start date: go back to the Monday of the first week
  const totalDays = data.length;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (totalDays - 1));
  const startDayOfWeek = startDate.getDay(); // 0=Sun, 1=Mon...
  const daysBeforeMonday = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const calendarStart = new Date(startDate);
  calendarStart.setDate(startDate.getDate() - daysBeforeMonday);

  // Total cells: enough weeks to cover all data
  const calendarEnd = new Date(today);
  const calendarEndDayOfWeek = calendarEnd.getDay();
  const daysAfterSunday = calendarEndDayOfWeek === 0 ? 0 : 7 - calendarEndDayOfWeek;
  calendarEnd.setDate(today.getDate() + daysAfterSunday);

  const totalCells = Math.ceil((calendarEnd.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const weekCount = Math.ceil(totalCells / 7);

  // Build month labels
  const monthLabels: { weekIndex: number; label: string }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weekCount; w++) {
    const weekStart = new Date(calendarStart);
    weekStart.setDate(calendarStart.getDate() + w * 7);
    const month = weekStart.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ weekIndex: w, label: weekStart.toLocaleDateString('zh-CN', { month: 'short' }) });
      lastMonth = month;
    }
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col gap-1">
        {/* Month labels */}
        <div className="flex gap-1 pl-5">
          {monthLabels.map((m, i) => (
            <div
              key={i}
              className="text-[10px] text-muted-foreground whitespace-nowrap"
              style={{ marginLeft: i === 0 ? 0 : `${(m.weekIndex - (monthLabels[i - 1]?.weekIndex || 0)) * 16 - 16}px` }}
            >
              {m.label}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pt-0.5 text-[10px] text-muted-foreground">
            {days.map((d, i) => (
              <div key={d} className="h-3 w-4 leading-[12px]">{i % 2 === 1 ? '' : d}</div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {Array.from({ length: weekCount }).map((_, w) => (
              <div key={w} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, d) => {
                  const cellDate = new Date(calendarStart);
                  cellDate.setDate(calendarStart.getDate() + w * 7 + d);
                  const dateStr = cellDate.toISOString().split('T')[0];

                  // Find corresponding data index
                  const dataIndex = Math.floor((cellDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  const v = dataIndex >= 0 && dataIndex < data.length ? data[dataIndex] : 0;

                  const isToday = cellDate.getTime() === today.getTime();
                  const displayDate = cellDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' });

                  return (
                    <Tooltip key={d}>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: (w * 7 + d) * 0.002 }}
                          className={cn(
                            'h-3 w-3 rounded-sm transition-all cursor-default',
                            getColor(v),
                            v > 0 && 'hover:ring-2 hover:ring-primary/50',
                            isToday && 'ring-1 ring-primary ring-offset-1'
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <div className="text-center">
                          <div className="font-medium">{displayDate}</div>
                          <div className="text-muted-foreground">{getLabel(v)}</div>
                          {isToday && <div className="text-primary text-[10px] mt-0.5">今天</div>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ---------- 最近论文卡片 ----------
function RecentPaper({ paper }: { paper: Paper }) {
  return (
    <Link to={`/dashboard/paper/${paper.id}`} className="group">
      <div className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-medium group-hover:text-primary transition-colors">
            {paper.title}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 ? ' et al.' : ''} · {paper.year}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {paper.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">{t}</Badge>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---------- 项目进度卡片 ----------
function ProjectCard({ project }: { project: Project }) {
  const objectives = project.objectives || [];
  const completed = objectives.filter((o) => o.completed).length;
  const total = objectives.length;
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; color: string }> = {
    'in-progress': { label: '进行中', variant: 'default', color: 'text-primary' },
    'active': { label: '进行中', variant: 'default', color: 'text-primary' },
    'completed': { label: '已完成', variant: 'secondary', color: 'text-green-600' },
    'planned': { label: '计划中', variant: 'outline', color: 'text-muted-foreground' },
  };
  const st = statusMap[project.status] || statusMap['planned'];

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 text-sm font-semibold">{project.title || project.name || '未命名项目'}</h4>
            <Badge variant={st.variant} className="shrink-0 text-[10px]">{st.label}</Badge>
          </div>
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{project.description}</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{completed}/{total} 目标完成</span>
              <span className="font-medium">{project.progress || 0}%</span>
            </div>
            <Progress value={project.progress || 0} className="h-1.5" />
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              {(project.relatedPaperIds || project.paperIds || []).length} 篇文献
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {(project.updatedAt ? new Date(project.updatedAt) : new Date()).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------- Loading Skeleton ----------
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 统计卡片骨架 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 pt-6">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* 热力图骨架 */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
      {/* 论文和收藏骨架 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 p-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      {/* 项目骨架 */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 p-4 border rounded-lg">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== 主页面 ==========
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const loadData = useCallback(async () => {
    if (!refreshing) setLoading(true);
    try {
      // 并行加载所有数据
      const [statsRes, papersRes, projectsRes] = await Promise.all([
        api.getReadingStats(),
        api.getPapers({ pageSize: 200 }),
        api.getProjects(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (papersRes.success && papersRes.data) {
        setPapers(papersRes.data);
      }

      if (projectsRes.success && projectsRes.data) {
        setProjects(projectsRes.data);
      }
    } catch (err) {
      console.error('[Dashboard] Failed to load data:', err);
      toast.error('加载数据失败，请刷新重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    toast.success('数据已刷新');
  }, [loadData]);

  // 计算衍生数据
  const recentPapers = papers
    .slice()
    .sort((a, b) => new Date(b.addedAt || b.addedDate || '').getTime() - new Date(a.addedAt || a.addedDate || '').getTime())
    .slice(0, 5);

  const favorites = papers.filter((p) => p.isFavorited);
  const allTags = Array.from(new Set(papers.flatMap((p) => p.tags)));

  if (loading) {
    return (
      <AnimatedPage>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-20 w-72" />
          </div>
          <DashboardSkeleton />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="space-y-6">
        {/* 顶部欢迎 + 语录 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                欢迎回来，研究者 ⚖️
              </h1>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-full hover:bg-accent transition-colors"
                title="刷新数据"
              >
                <RefreshCw className={cn(
                  'h-4 w-4 text-muted-foreground',
                  refreshing && 'animate-spin'
                )} />
              </motion.button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              以圣洁纯粹之心，行理性严谨之事
            </p>
          </div>
          <JoanQuote className="hidden sm:block max-w-xs" />
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard
              icon={BookOpen} label="文献总量" value={stats.totalPapers}
              sub="篇" color="bg-primary"
              link="/dashboard/library"
              animationDelay={0}
            />
            <StatCard
              icon={TrendingUp} label="本周阅读" value={stats.weeklyRead}
              sub="篇" color="bg-emerald-500"
              link="/dashboard/library"
              animationDelay={0.05}
            />
            <StatCard
              icon={Star} label="收藏文献" value={favorites.length}
              sub="篇" color="bg-amber-500"
              link="/dashboard/library"
              animationDelay={0.1}
            />
            <StatCard
              icon={Flame} label="连续天数" value={stats.streakDays}
              sub="天" color="bg-orange-500"
              animationDelay={0.15}
            />
            <StatCard
              icon={Trophy} label="学术积分" value={stats.points}
              sub="分" color="bg-accent"
              animationDelay={0.2}
            />
          </div>
        )}

        {/* 阅读热力图 */}
        {stats && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">阅读热力图 <span className="text-xs font-normal text-muted-foreground">（近 90 天）</span></CardTitle>
            </CardHeader>
            <CardContent>
              <ReadingHeatmap data={stats.weeklyHeatmap} />
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>少</span>
                <div className="h-3 w-3 rounded-sm bg-muted/30" />
                <div className="h-3 w-3 rounded-sm bg-primary/20" />
                <div className="h-3 w-3 rounded-sm bg-primary/40" />
                <div className="h-3 w-3 rounded-sm bg-primary/70" />
                <div className="h-3 w-3 rounded-sm bg-primary" />
                <span>多</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 最近添加 */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">最近添加</CardTitle>
                <Link to="/library" className="text-xs text-primary hover:underline">
                  查看全部 →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentPapers.length > 0 ? (
                <div className="space-y-1">
                  {recentPapers.map((paper) => (
                    <RecentPaper key={paper.id} paper={paper} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  暂无文献，<Link to="/import" className="text-primary hover:underline">导入文献</Link>开始你的学术之旅
                </p>
              )}
            </CardContent>
          </Card>

          {/* 收藏精选 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">收藏精选</CardTitle>
            </CardHeader>
            <CardContent>
              {favorites.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {favorites.slice(0, 4).map((paper) => (
                      <Link key={paper.id} to={`/dashboard/paper/${paper.id}`} className="group block">
                        <div className="flex items-start gap-2.5">
                          <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-xs font-medium group-hover:text-primary transition-colors">
                              {paper.title}
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              {paper.year} · {paper.venue} · {paper.citationCount || 0} 引用
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <p className="text-xs text-muted-foreground text-center">
                    共 {favorites.length} 篇收藏文献
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无收藏文献
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 研究项目 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">研究项目</CardTitle>
              <Link to="/research" className="text-xs text-primary hover:underline">
                管理项目 →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {projects.map((proj) => (
                  <ProjectCard key={proj.id} project={proj} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                暂无研究项目，<Link to="/research" className="text-primary hover:underline">创建第一个项目</Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AnimatedPage>
  );
}
