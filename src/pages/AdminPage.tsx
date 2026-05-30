// ========================================
// AdminPage — 生产级管理员面板 v3
// ========================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield, Users, Database, FileText, Activity, Settings,
  Trash2, RefreshCcw, Download, AlertTriangle,
  CheckCircle2, XCircle, Server, Loader2, Globe,
  Ban, UserCheck, Search, Eye, ChevronLeft, ChevronRight,
  BarChart3, PieChart, TrendingUp, Clock, MoreVertical,
  Edit, UserX, Mail, Building, Calendar, Trash,
  Filter, ArrowUpDown, ArrowUp, ArrowDown, Package,
  BookOpen, FolderKanban, LayoutGrid, Wrench, HardDrive,
  Save, X, SlidersHorizontal, ChevronDown, ChevronUp,
  FileDown, RotateCcw, KeyRound, Lock, Unlock, Layers,
  Sparkles, Monitor, Info, Code, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import AnimatedPage from '@/components/shared/AnimatedPage';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import type { User } from '@/types';

// recharts
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from 'recharts';

// ---- Types ----
interface ExtendedUser extends User {
  isActive?: boolean;
  lastLoginAt?: string;
  paperCount?: number;
  projectCount?: number;
  loginCount?: number;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  newThisWeek: number;
  newThisMonth: number;
}

interface AdminPaper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  venue?: string;
  tags?: string[];
  createdAt?: string;
  addedAt?: string;
  ownerUsername: string;
  ownerDisplayName: string;
}

interface AdminProject {
  id: string;
  title: string;
  description?: string;
  status?: string;
  progress?: number;
  createdAt?: string;
  ownerUsername: string;
  ownerDisplayName: string;
}

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  allowRegistration: boolean;
  publicSpacesEnabled: boolean;
  jwtExpiryHours: number;
  maxLoginAttempts: number;
}

// ---- Colors for charts ----
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316'];

// ---- Count-up animation hook ----
function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return value;
}

// ---- Stat Card Component ----
function StatCard({
  icon: Icon, label, value, color, trend,
  sublabel, delay = 0
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  trend?: string;
  sublabel?: string;
  delay?: number;
}) {
  const num = typeof value === 'number' ? value : parseInt(String(value).replace(/,/g, ''), 10) || 0;
  const animated = useCountUp(num);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05 }}
    >
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-md text-white', color)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] text-muted-foreground">{label}</span>
          </div>
          <p className="text-xl font-bold tracking-tight">
            {typeof value === 'string' && value.includes('%')
              ? value
              : typeof value === 'string' && isNaN(num)
                ? value
                : animated.toLocaleString()}
          </p>
          {trend && (
            <p className="text-[10px] text-green-600 font-medium flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="h-3 w-3" />{trend}
            </p>
          )}
          {sublabel && !trend && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---- WorkBuddy Button ----
function WorkBuddyButton({ icon: Icon, label, desc, color, onClick }: {
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
  onClick: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const handleClick = async () => {
    setBusy(true);
    try { await onClick(); } finally { setBusy(false); }
  };
  return (
    <Button variant="outline" className="justify-start gap-3 h-auto p-4" onClick={handleClick} disabled={busy}>
      {busy ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Icon className={cn('h-5 w-5', color)} />}
      <div className="text-left">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
    </Button>
  );
}

// ---- Sort Icon ----
function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' | null }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
  return direction === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
}

// ---- Empty State ----
function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

// ========================================
// Main Admin Page
// ========================================
export default function AdminPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [systemMetrics, setSystemMetrics] = useState({ totalRequests: 0, avgResponseTime: 0, errorRate: 0, uptime: 100 });

  // User management states
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [userSort, setUserSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'createdAt', direction: 'desc' });
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  // User dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', email: '', institution: '', role: '' });
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<ExtendedUser | null>(null);

  // Content management states
  const [papers, setPapers] = useState<AdminPaper[]>([]);
  const [paperTotal, setPaperTotal] = useState(0);
  const [paperPage, setPaperPage] = useState(1);
  const [paperTotalPages, setPaperTotalPages] = useState(1);
  const [paperSearch, setPaperSearch] = useState('');
  const [paperYearFilter, setPaperYearFilter] = useState('');
  const [paperTagFilter, setPaperTagFilter] = useState('');
  const [paperYears, setPaperYears] = useState<number[]>([]);
  const [paperTags, setPaperTags] = useState<string[]>([]);
  const [paperLoading, setPaperLoading] = useState(false);
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());

  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [projectTotal, setProjectTotal] = useState(0);
  const [projectPage, setProjectPage] = useState(1);
  const [projectTotalPages, setProjectTotalPages] = useState(1);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('');
  const [projectStatuses, setProjectStatuses] = useState<string[]>([]);
  const [projectLoading, setProjectLoading] = useState(false);

  // Activity log states
  const [activitySearch, setActivitySearch] = useState('');
  const [activityStatusFilter, setActivityStatusFilter] = useState('');
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);

  // Settings states
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<SystemSettings>({
    siteName: '', siteDescription: '', allowRegistration: false,
    publicSpacesEnabled: true, jwtExpiryHours: 168, maxLoginAttempts: 5,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Spaces
  const [spaces, setSpaces] = useState<any[]>([]);
  const [spaceLoading, setSpaceLoading] = useState(false);

  // API Routes
  const [routes, setRoutes] = useState<any[]>([]);
  const [kvBreakdown, setKvBreakdown] = useState<Record<string, number>>({});

  // Charts data
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [contentDistribution, setContentDistribution] = useState<any[]>([]);
  const [requestData, setRequestData] = useState<any[]>([]);

  // ---- Load all admin data ----
  const loadAdminData = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const [usersRes, statsRes, activitiesRes] = await Promise.all([
        api.getAdminUsers({ page, search, limit: 20 }),
        api.getAdminStats(),
        api.getAdminActivities({ page: 1, limit: 20 }),
      ]);

      if (usersRes.success && usersRes.data) {
        const allUsers = usersRes.data.users || [];
        setUsers(allUsers);
        setUserTotal(usersRes.data.pagination?.total || 0);
        setUserTotalPages(usersRes.data.pagination?.totalPages || 1);
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        setUserStats({
          total: allUsers.length,
          active: allUsers.filter((u: any) => u.isActive !== false).length,
          inactive: allUsers.filter((u: any) => u.isActive === false).length,
          admins: allUsers.filter((u: any) => u.role === 'admin').length,
          newThisWeek: allUsers.filter((u: any) => new Date(u.createdAt) > oneWeekAgo).length,
          newThisMonth: allUsers.filter((u: any) => new Date(u.createdAt) > oneMonthAgo).length,
        });
        // Build user growth chart data (last 30 days)
        const growthMap: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          growthMap[d.toISOString().slice(0, 10)] = 0;
        }
        for (const u of allUsers) {
          const d = new Date(u.createdAt).toISOString().slice(0, 10);
          if (growthMap[d] !== undefined) growthMap[d]++;
        }
        setUserGrowthData(Object.entries(growthMap).map(([date, count]) => ({ date: date.slice(5), count })));
      }

      if (statsRes.success && statsRes.data) {
        const d = statsRes.data;
        setStats(d);
        setKvBreakdown(d.kvBreakdown || {});
        const m = d.metrics || {};
        setSystemMetrics({
          totalRequests: m.requests24h || 0,
          avgResponseTime: m.avgResponseTime || 0,
          errorRate: parseFloat(m.errorRate || 0),
          uptime: parseFloat(m.uptime || 100),
        });
        setContentDistribution([
          { name: '文献', value: d.totalPapers || 0, color: CHART_COLORS[0] },
          { name: '项目', value: d.totalProjects || 0, color: CHART_COLORS[1] },
          { name: '空间', value: d.totalSpaces || d.totalUsers || 0, color: CHART_COLORS[2] },
          { name: '文献库', value: d.totalLibraries || 0, color: CHART_COLORS[3] },
        ].filter(x => x.value > 0));
        setRequestData(d.dailyRequests || []);
      }

      if (activitiesRes.success && activitiesRes.data) {
        setActivities(activitiesRes.data.activities || []);
        setActivityTotal(activitiesRes.data.total || 0);
        setActivityTotalPages(activitiesRes.data.totalPages || 1);
      }
    } catch (err) {
      console.error('[Admin] Load error:', err);
      toast.error('加载管理数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Load papers ----
  const loadPapers = useCallback(async (page = 1) => {
    setPaperLoading(true);
    try {
      const res = await api.getAdminPapers({
        search: paperSearch,
        year: paperYearFilter,
        tag: paperTagFilter,
        page,
        limit: 15,
      });
      if (res.success && res.data) {
        setPapers(res.data.papers || []);
        setPaperTotal(res.data.total || 0);
        setPaperTotalPages(res.data.totalPages || 1);
        setPaperYears(res.data.years || []);
        setPaperTags(res.data.tags || []);
      }
    } catch (e) {
      toast.error('加载文献数据失败');
    } finally {
      setPaperLoading(false);
    }
  }, [paperSearch, paperYearFilter, paperTagFilter]);

  // ---- Load projects ----
  const loadProjects = useCallback(async (page = 1) => {
    setProjectLoading(true);
    try {
      const res = await api.getAdminProjects({
        search: projectSearch,
        status: projectStatusFilter,
        page,
        limit: 15,
      });
      if (res.success && res.data) {
        setProjects(res.data.projects || []);
        setProjectTotal(res.data.total || 0);
        setProjectTotalPages(res.data.totalPages || 1);
        setProjectStatuses(res.data.statuses || []);
      }
    } catch (e) {
      toast.error('加载项目数据失败');
    } finally {
      setProjectLoading(false);
    }
  }, [projectSearch, projectStatusFilter]);

  // ---- Load spaces ----
  const loadSpaces = useCallback(async () => {
    setSpaceLoading(true);
    try {
      const res = await api.getAdminUsers({ limit: 100 });
      if (res.success && res.data) {
        const allUsers = res.data.users || [];
        const spaceList = [];
        for (const u of allUsers) {
          const space = await fetch(`/api/spaces/${u.username}`).then(r => r.ok ? r.json() : null).catch(() => null);
          if (space && space.success && space.data) {
            spaceList.push({ ...space.data, ownerUsername: u.username, ownerDisplayName: u.displayName || u.username });
          } else {
            spaceList.push({
              username: u.username,
              displayName: u.displayName || u.username,
              stats: { papers: u.paperCount || 0, projects: u.projectCount || 0, libraries: 0 },
              ownerUsername: u.username,
              ownerDisplayName: u.displayName || u.username,
            });
          }
        }
        setSpaces(spaceList);
      }
    } catch (e) {
      toast.error('加载空间数据失败');
    } finally {
      setSpaceLoading(false);
    }
  }, []);

  // ---- Load settings ----
  const loadSettings = useCallback(async () => {
    try {
      const res = await api.getAdminSettings();
      if (res.success && res.data) {
        setSettings(res.data);
        setSettingsForm(res.data);
      }
    } catch (e) {
      console.error('加载设置失败', e);
    }
  }, []);

  // ---- Load activities with filters ----
  const loadActivities = useCallback(async (page = 1) => {
    try {
      const res = await api.getAdminActivities({
        search: activitySearch,
        status: activityStatusFilter,
        page,
        limit: 15,
      });
      if (res.success && res.data) {
        setActivities(res.data.activities || []);
        setActivityTotal(res.data.total || 0);
        setActivityTotalPages(res.data.totalPages || 1);
      }
    } catch (e) {
      toast.error('加载活动日志失败');
    }
  }, [activitySearch, activityStatusFilter]);

  useEffect(() => { loadAdminData(userPage, userSearch); }, [userPage, userSearch]);
  useEffect(() => { if (activeTab === 'content') { loadPapers(1); loadProjects(1); } }, [activeTab]);
  useEffect(() => { if (activeTab === 'spaces') loadSpaces(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'settings') loadSettings(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'api') loadRoutes(); }, [activeTab]);
  useEffect(() => { loadActivities(activityPage); }, [activityPage]);

  const loadRoutes = useCallback(async () => {
    try {
      const res = await api.getAdminRoutes();
      if (res.success && res.data) {
        setRoutes(res.data.routes || []);
      }
    } catch (e) {
      toast.error('加载 API 路由失败');
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdminData(userPage, userSearch);
    if (activeTab === 'content') { await loadPapers(paperPage); await loadProjects(projectPage); }
    if (activeTab === 'spaces') await loadSpaces();
    if (activeTab === 'activities') await loadActivities(activityPage);
    if (activeTab === 'api') await loadRoutes();
    setRefreshing(false);
    toast.success('数据已刷新');
  };

  // ---- User operations ----
  const toggleUserStatus = async (userId: string, currentActive: boolean) => {
    setUpdatingUser(userId);
    try {
      const res = await api.updateUser(userId, { isActive: !currentActive });
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentActive } : u));
        toast.success(currentActive ? '用户已禁用' : '用户已启用');
      } else {
        toast.error(res.error || '操作失败');
      }
    } catch {
      toast.error('操作失败');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setUpdatingUser(selectedUser.id);
    try {
      const res = await api.deleteUser(selectedUser.id);
      if (res.success) {
        setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
        toast.success(`用户 ${selectedUser.username} 已删除`);
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      } else {
        toast.error(res.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    } finally {
      setUpdatingUser(null);
    }
  };

  const openEditDialog = (u: ExtendedUser) => {
    setSelectedUser(u);
    setEditForm({
      displayName: u.displayName || '',
      email: u.email || '',
      institution: u.institution || '',
      role: u.role || 'user',
    });
    setEditUserDialogOpen(true);
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    setUpdatingUser(selectedUser.id);
    try {
      const res = await api.updateUser(selectedUser.id, {
        displayName: editForm.displayName,
        email: editForm.email,
        institution: editForm.institution,
        role: editForm.role,
      });
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...editForm } : u));
        toast.success('用户信息已更新');
        setEditUserDialogOpen(false);
      } else {
        toast.error(res.error || '更新失败');
      }
    } catch {
      toast.error('更新失败');
    } finally {
      setUpdatingUser(null);
    }
  };

  const openUserDetail = (u: ExtendedUser) => {
    setDetailUser(u);
    setUserDetailOpen(true);
  };

  // ---- Bulk user operations ----
  const handleBulkDeleteUsers = async () => {
    if (!window.confirm(`确定要删除选中的 ${selectedUserIds.size} 位用户吗？此操作不可撤销。`)) return;
    let successCount = 0;
    for (const uid of selectedUserIds) {
      if (uid === currentUser?.id) continue;
      try {
        const res = await api.deleteUser(uid);
        if (res.success) successCount++;
      } catch { /* ignore */ }
    }
    setUsers(prev => prev.filter(u => !selectedUserIds.has(u.id)));
    setSelectedUserIds(new Set());
    toast.success(`已删除 ${successCount} 位用户`);
  };

  const handleBulkDisableUsers = async (disable: boolean) => {
    let successCount = 0;
    for (const uid of selectedUserIds) {
      if (uid === currentUser?.id) continue;
      try {
        const res = await api.updateUser(uid, { isActive: !disable });
        if (res.success) successCount++;
      } catch { /* ignore */ }
    }
    setUsers(prev => prev.map(u => selectedUserIds.has(u.id) ? { ...u, isActive: !disable } : u));
    toast.success(`${disable ? '禁用' : '启用'}了 ${successCount} 位用户`);
  };

  // ---- Paper operations ----
  const handleDeletePaper = async (paperId: string) => {
    if (!window.confirm('确定要删除这篇文献吗？')) return;
    try {
      const res = await api.deleteAdminPaper(paperId);
      if (res.success) {
        setPapers(prev => prev.filter(p => p.id !== paperId));
        toast.success('文献已删除');
      } else {
        toast.error(res.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const handleBulkDeletePapers = async () => {
    if (!window.confirm(`确定要删除选中的 ${selectedPaperIds.size} 篇文献吗？`)) return;
    let successCount = 0;
    for (const pid of selectedPaperIds) {
      try {
        const res = await api.deleteAdminPaper(pid);
        if (res.success) successCount++;
      } catch { /* ignore */ }
    }
    setPapers(prev => prev.filter(p => !selectedPaperIds.has(p.id)));
    setSelectedPaperIds(new Set());
    toast.success(`已删除 ${successCount} 篇文献`);
  };

  // ---- Project operations ----
  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('确定要删除这个项目吗？')) return;
    try {
      const res = await api.deleteAdminProject(projectId);
      if (res.success) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        toast.success('项目已删除');
      } else {
        toast.error(res.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  // ---- Settings operations ----
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await api.updateAdminSettings(settingsForm);
      if (res.success) {
        setSettings(res.data);
        toast.success('系统设置已保存');
      } else {
        toast.error(res.error || '保存失败');
      }
    } catch {
      toast.error('保存失败');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleBackup = async () => {
    const toastId = toast.loading('正在生成全站备份...');
    try {
      const res = await api.createAdminBackup();
      if (res.success) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('备份已下载', { id: toastId });
      } else {
        toast.error('备份失败', { id: toastId });
      }
    } catch {
      toast.error('备份失败', { id: toastId });
    }
  };

  // ---- Filtered & sorted users ----
  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (userRoleFilter !== 'all') result = result.filter(u => u.role === userRoleFilter);
    if (userStatusFilter !== 'all') {
      result = result.filter(u => userStatusFilter === 'active' ? u.isActive !== false : u.isActive === false);
    }
    result.sort((a, b) => {
      let av: any = a[userSort.field as keyof ExtendedUser];
      let bv: any = b[userSort.field as keyof ExtendedUser];
      if (userSort.field === 'createdAt' || userSort.field === 'lastLoginAt') {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      } else {
        av = (av || '').toString().toLowerCase();
        bv = (bv || '').toString().toLowerCase();
      }
      if (av < bv) return userSort.direction === 'asc' ? -1 : 1;
      if (av > bv) return userSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [users, userRoleFilter, userStatusFilter, userSort]);

  const toggleSort = (field: string) => {
    setUserSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // ---- Activity status color ----
  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  // ---- Role badge ----
  const RoleBadge = ({ role }: { role: string }) => {
    if (role === 'admin') return <Badge className="text-[10px] bg-primary hover:bg-primary">管理员</Badge>;
    return <Badge variant="secondary" className="text-[10px]">用户</Badge>;
  };

  // ---- Status badge ----
  const StatusBadge = ({ isActive }: { isActive?: boolean }) => {
    if (isActive === false) return <Badge variant="outline" className="text-[10px] text-red-500 border-red-200">已禁用</Badge>;
    return <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">活跃</Badge>;
  };

  if (currentUser?.role !== 'admin') {
    return (
      <AnimatedPage>
        <div className="flex flex-col items-center justify-center py-20">
          <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold">访问受限</h2>
          <p className="text-sm text-muted-foreground mt-2">此页面仅限管理员访问。</p>
        </div>
      </AnimatedPage>
    );
  }

  if (loading) {
    return (
      <AnimatedPage>
        <div className="space-y-6 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">管理后台</h1>
              <p className="text-sm text-muted-foreground">系统管理与监控面板</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCcw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
              {refreshing ? '刷新中...' : '刷新'}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
            <StatCard icon={Users} label="总用户" value={userStats?.total || 0} color="bg-blue-500" trend={`+${userStats?.newThisWeek || 0} 本周`} delay={0} />
            <StatCard icon={FileText} label="文献数" value={stats?.totalPapers || 0} color="bg-primary" delay={1} />
            <StatCard icon={Activity} label="项目数" value={stats?.totalProjects || 0} color="bg-purple-500" delay={2} />
            <StatCard icon={Database} label="KV 键数" value={stats?.metrics?.kvUsage || 0} color="bg-emerald-500" delay={3} />
            <StatCard icon={Server} label="24h 请求" value={systemMetrics.totalRequests} color="bg-orange-500" delay={4} />
            <StatCard icon={CheckCircle2} label="可用性" value={systemMetrics.uptime + '%'} color="bg-green-500" sublabel={`${systemMetrics.avgResponseTime}ms 平均响应`} delay={5} />
          </div>

          {/* User Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: '活跃用户', value: userStats?.active || 0, icon: Users, color: 'blue' },
              { label: '本周新增', value: userStats?.newThisWeek || 0, icon: TrendingUp, color: 'green' },
              { label: '本月新增', value: userStats?.newThisMonth || 0, icon: Calendar, color: 'purple' },
              { label: '管理员', value: userStats?.admins || 0, icon: Shield, color: 'orange' },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                <Card className={cn(`bg-gradient-to-br from-${item.color}-50 to-${item.color}-100 dark:from-${item.color}-950/30 dark:to-${item.color}-900/30 border-${item.color}-200 dark:border-${item.color}-800`)}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn(`text-xs text-${item.color}-600 dark:text-${item.color}-400`)}>{item.label}</p>
                        <p className={cn(`text-2xl font-bold text-${item.color}-700 dark:text-${item.color}-300`)}>{item.value}</p>
                      </div>
                      <item.icon className={cn(`h-8 w-8 text-${item.color}-500/30`)} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto gap-1">
              {[
                { value: 'overview', icon: BarChart3, label: '系统概览' },
                { value: 'users', icon: Users, label: '用户管理' },
                { value: 'content', icon: BookOpen, label: '内容管理' },
                { value: 'spaces', icon: LayoutGrid, label: '空间管理' },
                { value: 'activities', icon: Clock, label: '活动日志' },
                { value: 'settings', icon: SlidersHorizontal, label: '系统设置' },
                { value: 'api', icon: Server, label: 'API 接口' },
                { value: 'workbuddy', icon: Wrench, label: 'WorkBuddy' },
              ].map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs">
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ==================== OVERVIEW TAB ==================== */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* User Growth Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      用户增长趋势（近30天）
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={userGrowthData}>
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-purple-500" />
                      内容分布
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      {contentDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={contentDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={4}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                              labelLine={false}
                            >
                              {contentDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Legend fontSize={11} />
                          </RePieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                          暂无内容数据
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Request Volume */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Server className="h-4 w-4 text-orange-500" />
                      请求量（近7天）
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={requestData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Bar dataKey="requests" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* System Health */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-emerald-500" />
                      系统健康状态
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { label: 'API 服务', status: stats?.systemHealth?.edgeFunctions || 'healthy', detail: 'Edge Functions' },
                        { label: 'KV 存储', status: stats?.systemHealth?.kv || 'healthy', detail: 'EdgeOne KV' },
                        { label: 'Cloud Functions', status: stats?.systemHealth?.cloudFunctions || 'healthy', detail: 'Node.js Runtime' },
                        { label: 'ArXiv 搜索', status: 'healthy' as const, detail: '外部服务' },
                      ].map(svc => (
                        <div key={svc.label} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <span className="text-sm font-medium">{svc.label}</span>
                            <p className="text-[10px] text-muted-foreground">{svc.detail}</p>
                          </div>
                          <Badge
                            className={cn(
                              'text-[10px]',
                              svc.status === 'healthy' ? 'bg-green-500 hover:bg-green-500'
                              : svc.status === 'degraded' ? 'bg-amber-500 hover:bg-amber-500'
                              : 'bg-red-500 hover:bg-red-500'
                            )}
                          >
                            {svc.status === 'healthy' ? '正常' : svc.status === 'degraded' ? '降级' : '异常'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-3">性能指标</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: '平均响应时间', value: `${systemMetrics.avgResponseTime}ms`, width: Math.max(0, 100 - systemMetrics.avgResponseTime / 2) },
                          { label: '错误率', value: `${systemMetrics.errorRate}%`, width: Math.max(0, 100 - systemMetrics.errorRate * 100) },
                          { label: '系统运行时间', value: `${systemMetrics.uptime}min`, width: Math.min(100, systemMetrics.uptime) },
                          { label: '24h 请求数', value: String(systemMetrics.totalRequests), width: Math.min(100, systemMetrics.totalRequests / 10) },
                        ].map(m => (
                          <div key={m.label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{m.label}</span>
                              <span className="font-medium">{m.value}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${m.width}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Log Preview */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      最近活动
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab('activities')}>
                      查看全部
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {activities.length === 0 ? (
                      <EmptyState icon={Clock} title="暂无活动记录" description="系统操作将自动记录在此" />
                    ) : (
                      activities.slice(0, 10).map((act: any) => (
                        <div key={act.id} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                          <div className="mt-0.5 shrink-0">
                            {act.status === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                              : act.status === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                              : <XCircle className="h-4 w-4 text-red-500" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-[10px]">{act.action}</Badge>
                              <Badge variant="outline" className="text-[10px]">@{act.user}</Badge>
                              <span className="text-[11px] text-muted-foreground">{formatRelativeTime(act.time)}</span>
                            </div>
                            <p className="text-sm mt-1 truncate">{act.target}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ==================== USERS TAB ==================== */}
            <TabsContent value="users" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">用户列表</CardTitle>
                      <CardDescription>管理注册用户（共 {userTotal} 人）</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Search */}
                      <form onSubmit={(e) => { e.preventDefault(); setUserPage(1); loadAdminData(1, userSearch); }} className="flex gap-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input placeholder="搜索用户..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-8 w-44 h-8 text-sm" />
                        </div>
                        <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">搜索</Button>
                      </form>
                      {/* Filters */}
                      <select
                        value={userRoleFilter}
                        onChange={e => setUserRoleFilter(e.target.value as any)}
                        className="h-8 text-xs rounded-md border border-input bg-background px-2"
                      >
                        <option value="all">全部角色</option>
                        <option value="admin">管理员</option>
                        <option value="user">普通用户</option>
                      </select>
                      <select
                        value={userStatusFilter}
                        onChange={e => setUserStatusFilter(e.target.value as any)}
                        className="h-8 text-xs rounded-md border border-input bg-background px-2"
                      >
                        <option value="all">全部状态</option>
                        <option value="active">活跃</option>
                        <option value="inactive">已禁用</option>
                      </select>
                      {/* Bulk actions */}
                      {selectedUserIds.size > 0 && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => handleBulkDisableUsers(true)}>
                            <Ban className="h-3 w-3" />禁用
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => handleBulkDisableUsers(false)}>
                            <UserCheck className="h-3 w-3" />启用
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8 text-xs gap-1" onClick={handleBulkDeleteUsers}>
                            <Trash2 className="h-3 w-3" />删除
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredUsers.length === 0 ? (
                    <EmptyState icon={Users} title="暂无用户数据" description="未找到匹配的用户" />
                  ) : (
                    <>
                      <div className="rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted/50 border-b">
                                <th className="p-3 w-10">
                                  <input
                                    type="checkbox"
                                    className="accent-primary h-4 w-4"
                                    checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.has(u.id))}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
                                      } else {
                                        setSelectedUserIds(new Set());
                                      }
                                    }}
                                  />
                                </th>
                                <th className="p-3 text-left font-medium text-xs text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('displayName')}>
                                  <span className="flex items-center gap-1">用户 <SortIcon active={userSort.field === 'displayName'} direction={userSort.direction} /></span>
                                </th>
                                <th className="p-3 text-left font-medium text-xs text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('role')}>
                                  <span className="flex items-center gap-1">角色 <SortIcon active={userSort.field === 'role'} direction={userSort.direction} /></span>
                                </th>
                                <th className="p-3 text-left font-medium text-xs text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('isActive')}>
                                  <span className="flex items-center gap-1">状态 <SortIcon active={userSort.field === 'isActive'} direction={userSort.direction} /></span>
                                </th>
                                <th className="p-3 text-left font-medium text-xs text-muted-foreground hidden md:table-cell">机构</th>
                                <th className="p-3 text-left font-medium text-xs text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('createdAt')}>
                                  <span className="flex items-center gap-1">注册时间 <SortIcon active={userSort.field === 'createdAt'} direction={userSort.direction} /></span>
                                </th>
                                <th className="p-3 text-right font-medium text-xs text-muted-foreground">操作</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredUsers.map((u, idx) => (
                                <motion.tr
                                  key={u.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: idx * 0.02 }}
                                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                                >
                                  <td className="p-3">
                                    <input
                                      type="checkbox"
                                      className="accent-primary h-4 w-4"
                                      checked={selectedUserIds.has(u.id)}
                                      onChange={e => {
                                        const next = new Set(selectedUserIds);
                                        if (e.target.checked) next.add(u.id); else next.delete(u.id);
                                        setSelectedUserIds(next);
                                      }}
                                    />
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                        {(u.displayName || u.username || 'U')[0].toUpperCase()}
                                      </div>
                                      <div>
                                        <button
                                          className="text-sm font-medium hover:text-primary hover:underline text-left"
                                          onClick={() => openUserDetail(u)}
                                        >
                                          {u.displayName || u.username}
                                        </button>
                                        <p className="text-[11px] text-muted-foreground">@{u.username}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3"><RoleBadge role={u.role} /></td>
                                  <td className="p-3"><StatusBadge isActive={u.isActive} /></td>
                                  <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">{u.institution || '-'}</td>
                                  <td className="p-3 text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                                  <td className="p-3">
                                    <div className="flex justify-end gap-1">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openUserDetail(u)}>
                                            <Eye className="h-3.5 w-3.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p className="text-xs">查看详情</p></TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditDialog(u)}>
                                            <Edit className="h-3.5 w-3.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p className="text-xs">编辑</p></TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            disabled={updatingUser === u.id || u.role === 'admin' || u.id === currentUser?.id}
                                            onClick={() => toggleUserStatus(u.id, u.isActive !== false)}
                                          >
                                            {u.isActive !== false ? <Ban className="h-3.5 w-3.5 text-amber-500" /> : <UserCheck className="h-3.5 w-3.5 text-green-500" />}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p className="text-xs">{u.isActive !== false ? '禁用' : '启用'}</p></TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            disabled={updatingUser === u.id || u.role === 'admin' || u.id === currentUser?.id}
                                            onClick={() => { setSelectedUser(u); setDeleteDialogOpen(true); }}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p className="text-xs">删除</p></TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {userTotalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <span className="text-xs text-muted-foreground">共 {userTotal} 条，第 {userPage}/{userTotalPages} 页</span>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                            {Array.from({ length: Math.min(5, userTotalPages) }, (_, i) => {
                              const page = userPage <= 3 ? i + 1 : userPage + i - 2;
                              if (page > userTotalPages) return null;
                              return (
                                <Button key={page} variant={userPage === page ? 'default' : 'outline'} size="sm" onClick={() => setUserPage(page)}>
                                  {page}
                                </Button>
                              );
                            })}
                            <Button variant="outline" size="sm" disabled={userPage >= userTotalPages} onClick={() => setUserPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ==================== CONTENT TAB ==================== */}
            <TabsContent value="content" className="mt-4 space-y-4">
              <Tabs defaultValue="papers">
                <TabsList>
                  <TabsTrigger value="papers" className="gap-1"><BookOpen className="h-3.5 w-3.5" />文献管理</TabsTrigger>
                  <TabsTrigger value="projects" className="gap-1"><FolderKanban className="h-3.5 w-3.5" />项目管理</TabsTrigger>
                </TabsList>

                {/* Papers Sub-tab */}
                <TabsContent value="papers" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">文献列表</CardTitle>
                          <CardDescription>管理全站文献（共 {paperTotal} 篇）</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="搜索标题/作者/标签..."
                              value={paperSearch}
                              onChange={e => { setPaperSearch(e.target.value); setPaperPage(1); }}
                              className="pl-8 w-52 h-8 text-sm"
                            />
                          </div>
                          <select
                            value={paperYearFilter}
                            onChange={e => { setPaperYearFilter(e.target.value); setPaperPage(1); }}
                            className="h-8 text-xs rounded-md border border-input bg-background px-2"
                          >
                            <option value="">全部年份</option>
                            {paperYears.map(y => <option key={y} value={String(y)}>{y}</option>)}
                          </select>
                          <select
                            value={paperTagFilter}
                            onChange={e => { setPaperTagFilter(e.target.value); setPaperPage(1); }}
                            className="h-8 text-xs rounded-md border border-input bg-background px-2"
                          >
                            <option value="">全部标签</option>
                            {paperTags.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {selectedPaperIds.size > 0 && (
                            <Button size="sm" variant="destructive" className="h-8 text-xs gap-1" onClick={handleBulkDeletePapers}>
                              <Trash2 className="h-3 w-3" />删除 {selectedPaperIds.size} 篇
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {paperLoading ? (
                        <div className="space-y-2">
                          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                        </div>
                      ) : papers.length === 0 ? (
                        <EmptyState icon={BookOpen} title="暂无文献数据" description="全站尚未添加文献" />
                      ) : (
                        <>
                          <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/50 border-b">
                                  <th className="p-3 w-10">
                                    <input
                                      type="checkbox"
                                      className="accent-primary h-4 w-4"
                                      checked={papers.length > 0 && papers.every(p => selectedPaperIds.has(p.id))}
                                      onChange={e => {
                                        if (e.target.checked) setSelectedPaperIds(new Set(papers.map(p => p.id)));
                                        else setSelectedPaperIds(new Set());
                                      }}
                                    />
                                  </th>
                                  <th className="p-3 text-left font-medium text-xs text-muted-foreground">标题</th>
                                  <th className="p-3 text-left font-medium text-xs text-muted-foreground hidden lg:table-cell">作者</th>
                                  <th className="p-3 text-left font-medium text-xs text-muted-foreground">年份</th>
                                  <th className="p-3 text-left font-medium text-xs text-muted-foreground hidden md:table-cell">标签</th>
                                  <th className="p-3 text-left font-medium text-xs text-muted-foreground">所属用户</th>
                                  <th className="p-3 text-right font-medium text-xs text-muted-foreground">操作</th>
                                </tr>
                              </thead>
                              <tbody>
                                {papers.map(p => (
                                  <tr key={p.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                                    <td className="p-3">
                                      <input
                                        type="checkbox"
                                        className="accent-primary h-4 w-4"
                                        checked={selectedPaperIds.has(p.id)}
                                        onChange={e => {
                                          const next = new Set(selectedPaperIds);
                                          if (e.target.checked) next.add(p.id); else next.delete(p.id);
                                          setSelectedPaperIds(next);
                                        }}
                                      />
                                    </td>
                                    <td className="p-3">
                                      <p className="text-sm font-medium truncate max-w-[200px]" title={p.title}>{p.title}</p>
                                    </td>
                                    <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell truncate max-w-[150px]">{(p.authors || []).join(', ')}</td>
                                    <td className="p-3 text-xs">{p.year || '-'}</td>
                                    <td className="p-3 hidden md:table-cell">
                                      <div className="flex flex-wrap gap-1">
                                        {(p.tags || []).slice(0, 3).map(t => (
                                          <Badge key={t} variant="outline" className="text-[9px] h-4">{t}</Badge>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="p-3 text-xs text-muted-foreground">@{p.ownerUsername}</td>
                                    <td className="p-3">
                                      <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(`/#/dashboard/papers/${p.id}`, '_blank')}>
                                          <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeletePaper(p.id)}>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {paperTotalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                              <span className="text-xs text-muted-foreground">共 {paperTotal} 篇，第 {paperPage}/{paperTotalPages} 页</span>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm" disabled={paperPage <= 1} onClick={() => { setPaperPage(p => p - 1); loadPapers(paperPage - 1); }}><ChevronLeft className="h-4 w-4" /></Button>
                                {Array.from({ length: Math.min(5, paperTotalPages) }, (_, i) => {
                                  const page = paperPage <= 3 ? i + 1 : paperPage + i - 2;
                                  if (page > paperTotalPages) return null;
                                  return <Button key={page} variant={paperPage === page ? 'default' : 'outline'} size="sm" onClick={() => { setPaperPage(page); loadPapers(page); }}>{page}</Button>;
                                })}
                                <Button variant="outline" size="sm" disabled={paperPage >= paperTotalPages} onClick={() => { setPaperPage(p => p + 1); loadPapers(paperPage + 1); }}><ChevronRight className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Projects Sub-tab */}
                <TabsContent value="projects" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">项目列表</CardTitle>
                          <CardDescription>管理全站项目（共 {projectTotal} 个）</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder="搜索项目名称..."
                              value={projectSearch}
                              onChange={e => { setProjectSearch(e.target.value); setProjectPage(1); }}
                              className="pl-8 w-52 h-8 text-sm"
                            />
                          </div>
                          <select
                            value={projectStatusFilter}
                            onChange={e => { setProjectStatusFilter(e.target.value); setProjectPage(1); }}
                            className="h-8 text-xs rounded-md border border-input bg-background px-2"
                          >
                            <option value="">全部状态</option>
                            {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {projectLoading ? (
                        <div className="space-y-2">
                          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                        </div>
                      ) : projects.length === 0 ? (
                        <EmptyState icon={FolderKanban} title="暂无项目数据" description="全站尚未创建项目" />
                      ) : (
                        <>
                          <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/50 border-b">
                                  <th className="p-3 text-left font-medium text-xs text-muted-foreground">项目名称</th>
                                  <th className="p-3 text-left font-medium text-xs text-muted-foreground hidden md:table-cell">描述</th>
                                  <th className="p-3 text-left font-medium text-xs text-muted-foreground">状态</th>
                                  <th className="p-3 text-left font-medium text-xs text-muted-foreground">进度</th>
                                  <th className="p-3 text-left font-medium text-xs text-muted-foreground">创建者</th>
                                  <th className="p-3 text-right font-medium text-xs text-muted-foreground">操作</th>
                                </tr>
                              </thead>
                              <tbody>
                                {projects.map(p => (
                                  <tr key={p.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                                    <td className="p-3">
                                      <p className="text-sm font-medium">{p.title}</p>
                                      <p className="text-[10px] text-muted-foreground">{formatDate(p.createdAt)}</p>
                                    </td>
                                    <td className="p-3 text-xs text-muted-foreground hidden md:table-cell truncate max-w-[200px]">{p.description || '-'}</td>
                                    <td className="p-3">
                                      <Badge variant="outline" className="text-[10px]">{p.status || 'unknown'}</Badge>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                          <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress || 0}%` }} />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{p.progress || 0}%</span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-xs text-muted-foreground">@{p.ownerUsername}</td>
                                    <td className="p-3">
                                      <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(`/#/dashboard/projects/${p.id}`, '_blank')}>
                                          <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteProject(p.id)}>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {projectTotalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                              <span className="text-xs text-muted-foreground">共 {projectTotal} 个，第 {projectPage}/{projectTotalPages} 页</span>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm" disabled={projectPage <= 1} onClick={() => { setProjectPage(p => p - 1); loadProjects(projectPage - 1); }}><ChevronLeft className="h-4 w-4" /></Button>
                                {Array.from({ length: Math.min(5, projectTotalPages) }, (_, i) => {
                                  const page = projectPage <= 3 ? i + 1 : projectPage + i - 2;
                                  if (page > projectTotalPages) return null;
                                  return <Button key={page} variant={projectPage === page ? 'default' : 'outline'} size="sm" onClick={() => { setProjectPage(page); loadProjects(page); }}>{page}</Button>;
                                })}
                                <Button variant="outline" size="sm" disabled={projectPage >= projectTotalPages} onClick={() => { setProjectPage(p => p + 1); loadProjects(projectPage + 1); }}><ChevronRight className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* ==================== SPACES TAB ==================== */}
            <TabsContent value="spaces" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">空间管理</CardTitle>
                      <CardDescription>管理所有用户公开学术空间</CardDescription>
                    </div>
                    <Badge variant="secondary">{spaces.length} 个空间</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {spaceLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
                    </div>
                  ) : spaces.length === 0 ? (
                    <EmptyState icon={LayoutGrid} title="暂无空间数据" description="用户注册后将自动创建公开空间" />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {spaces.map((space, idx) => (
                        <motion.div
                          key={space.username || idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                        >
                          <Card className="hover:border-primary/50 transition-colors">
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                  {(space.displayName || space.username || 'U')[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{space.displayName || space.username}</p>
                                  <p className="text-[11px] text-muted-foreground">@{space.username}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                                <div className="rounded bg-muted/50 p-2">
                                  <p className="text-sm font-bold">{space.stats?.papers || 0}</p>
                                  <p className="text-[10px] text-muted-foreground">文献</p>
                                </div>
                                <div className="rounded bg-muted/50 p-2">
                                  <p className="text-sm font-bold">{space.stats?.projects || 0}</p>
                                  <p className="text-[10px] text-muted-foreground">项目</p>
                                </div>
                                <div className="rounded bg-muted/50 p-2">
                                  <p className="text-sm font-bold">{space.stats?.libraries || 0}</p>
                                  <p className="text-[10px] text-muted-foreground">文献库</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" onClick={() => window.open(`/#/u/${space.username}`, '_blank')}>
                                  <Eye className="h-3 w-3" />查看空间
                                </Button>
                                <Button size="sm" variant="ghost" className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                                  setSelectedUser(users.find(u => u.username === space.username) || null);
                                  setDeleteDialogOpen(true);
                                }}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ==================== ACTIVITIES TAB ==================== */}
            <TabsContent value="activities" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">活动日志</CardTitle>
                      <CardDescription>系统操作记录（共 {activityTotal} 条）</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="搜索活动..."
                          value={activitySearch}
                          onChange={e => { setActivitySearch(e.target.value); setActivityPage(1); }}
                          className="pl-8 w-44 h-8 text-sm"
                        />
                      </div>
                      <select
                        value={activityStatusFilter}
                        onChange={e => { setActivityStatusFilter(e.target.value); setActivityPage(1); }}
                        className="h-8 text-xs rounded-md border border-input bg-background px-2"
                      >
                        <option value="">全部状态</option>
                        <option value="success">成功</option>
                        <option value="error">失败</option>
                        <option value="warning">警告</option>
                      </select>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => loadActivities(1)}>
                        <Filter className="h-3 w-3 mr-1" />筛选
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <EmptyState icon={Clock} title="暂无活动记录" description="系统操作将自动记录在此" />
                  ) : (
                    <>
                      <div className="space-y-2">
                        {activities.map((act: any) => (
                          <motion.div
                            key={act.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className={cn('mt-0.5 shrink-0 h-8 w-8 rounded-full flex items-center justify-center', getActivityStatusColor(act.status))}>
                              {act.status === 'success' ? <CheckCircle2 className="h-4 w-4 text-white" />
                                : act.status === 'warning' ? <AlertTriangle className="h-4 w-4 text-white" />
                                : <XCircle className="h-4 w-4 text-white" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary" className="text-[10px]">{act.action}</Badge>
                                <Badge variant="outline" className="text-[10px]">@{act.user}</Badge>
                                <span className="text-[11px] text-muted-foreground">{formatRelativeTime(act.time)}</span>
                              </div>
                              <p className="text-sm mt-1">{act.target}</p>
                              {act.status === 'error' && act.error && (
                                <p className="text-xs text-red-500 mt-1 bg-red-50 dark:bg-red-950/30 rounded px-2 py-1">{act.error}</p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      {activityTotalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <span className="text-xs text-muted-foreground">共 {activityTotal} 条，第 {activityPage}/{activityTotalPages} 页</span>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" disabled={activityPage <= 1} onClick={() => setActivityPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                            {Array.from({ length: Math.min(5, activityTotalPages) }, (_, i) => {
                              const page = activityPage <= 3 ? i + 1 : activityPage + i - 2;
                              if (page > activityTotalPages) return null;
                              return <Button key={page} variant={activityPage === page ? 'default' : 'outline'} size="sm" onClick={() => setActivityPage(page)}>{page}</Button>;
                            })}
                            <Button variant="outline" size="sm" disabled={activityPage >= activityTotalPages} onClick={() => setActivityPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ==================== SETTINGS TAB ==================== */}
            <TabsContent value="settings" className="mt-4 space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      站点配置
                    </CardTitle>
                    <CardDescription>配置站点基本信息和功能开关</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">站点名称</label>
                      <Input
                        value={settingsForm.siteName}
                        onChange={e => setSettingsForm(prev => ({ ...prev, siteName: e.target.value }))}
                        placeholder="站点名称"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">站点描述</label>
                      <Input
                        value={settingsForm.siteDescription}
                        onChange={e => setSettingsForm(prev => ({ ...prev, siteDescription: e.target.value }))}
                        placeholder="站点描述"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">允许新用户注册</p>
                        <p className="text-[11px] text-muted-foreground">关闭后禁止新用户注册</p>
                      </div>
                      <Switch
                        checked={settingsForm.allowRegistration}
                        onCheckedChange={v => setSettingsForm(prev => ({ ...prev, allowRegistration: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">公开空间</p>
                        <p className="text-[11px] text-muted-foreground">用户空间是否在学术广场展示</p>
                      </div>
                      <Switch
                        checked={settingsForm.publicSpacesEnabled}
                        onCheckedChange={v => setSettingsForm(prev => ({ ...prev, publicSpacesEnabled: v }))}
                      />
                    </div>
                    <Button onClick={handleSaveSettings} disabled={savingSettings} className="w-full">
                      {savingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      保存设置
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      维护工具
                    </CardTitle>
                    <CardDescription>系统维护和备份操作</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <FileDown className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">全站备份</p>
                          <p className="text-[11px] text-muted-foreground">导出所有用户、文献、项目数据为 JSON</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={handleBackup}>
                        <Download className="h-3.5 w-3.5 mr-1" />导出
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <RotateCcw className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">重建索引</p>
                          <p className="text-[11px] text-muted-foreground">重新构建 users/spaces 索引</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={async () => {
                        const toastId = toast.loading('重建索引中...');
                        try {
                          const res = await api.adminReindex();
                          if (res.success) {
                            toast.success(`索引重建完成`, { id: toastId });
                            handleRefresh();
                          } else toast.error('重建失败', { id: toastId });
                        } catch { toast.error('重建失败', { id: toastId }); }
                      }}>
                        <RefreshCcw className="h-3.5 w-3.5 mr-1" />重建
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <Trash className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">清理缓存</p>
                          <p className="text-[11px] text-muted-foreground">清除过期 metrics 和临时数据</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => toast.success('缓存已清理（演示）')}>
                        <Trash className="h-3.5 w-3.5 mr-1" />清理
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <KeyRound className="h-4 w-4" />
                      安全配置
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">JWT Token 过期时间（小时）</label>
                      <Input
                        type="number"
                        value={settingsForm.jwtExpiryHours}
                        onChange={e => setSettingsForm(prev => ({ ...prev, jwtExpiryHours: parseInt(e.target.value) || 168 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">最大登录尝试次数</label>
                      <Input
                        type="number"
                        value={settingsForm.maxLoginAttempts}
                        onChange={e => setSettingsForm(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 5 }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ==================== API ROUTES TAB ==================== */}
            <TabsContent value="api" className="mt-4 space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* KV Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Database className="h-4 w-4 text-emerald-500" />
                      KV 存储键数统计
                    </CardTitle>
                    <CardDescription>按前缀分组的 KV 键分布</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(kvBreakdown).length === 0 ? (
                      <EmptyState icon={Database} title="暂无 KV 数据" description="KV 存储为空或尚未加载" />
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b">
                          <span>键前缀</span>
                          <span>数量</span>
                        </div>
                        {Object.entries(kvBreakdown)
                          .sort((a, b) => b[1] - a[1])
                          .map(([prefix, count]) => (
                            <div key={prefix} className="flex items-center justify-between py-1.5">
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{prefix}:</code>
                                <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden w-24">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${Math.min(100, (count / (stats?.metrics?.kvUsage || 1)) * 100)}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-medium">{count}</span>
                            </div>
                          ))}
                        <div className="flex items-center justify-between pt-2 border-t text-sm font-medium">
                          <span>总计</span>
                          <span>{stats?.metrics?.kvUsage || 0}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* API Routes Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Server className="h-4 w-4 text-blue-500" />
                      API 接口概览
                    </CardTitle>
                    <CardDescription>所有后端 API 端点统计</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {routes.map(group => (
                        <div key={group.group} className="rounded-lg border p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">{group.group}</p>
                          <p className="text-lg font-bold">{group.endpoints.length}</p>
                          <p className="text-[10px] text-muted-foreground">个端点</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Full API Routes Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    完整 API 接口列表
                  </CardTitle>
                  <CardDescription>所有后端路由端点及说明</CardDescription>
                </CardHeader>
                <CardContent>
                  {routes.length === 0 ? (
                    <EmptyState icon={Server} title="加载中..." description="正在获取 API 路由数据" />
                  ) : (
                    <div className="space-y-6">
                      {routes.map(group => (
                        <div key={group.group}>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">{group.group}</Badge>
                            <span className="text-xs text-muted-foreground">{group.endpoints.length} 个端点</span>
                          </h4>
                          <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                              <tbody>
                                {group.endpoints.map((ep: any, idx: number) => (
                                  <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                                    <td className="p-2.5 w-20">
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          'text-[10px] font-mono w-16 justify-center',
                                          ep.method === 'GET' && 'text-green-600 border-green-200',
                                          ep.method === 'POST' && 'text-blue-600 border-blue-200',
                                          ep.method === 'PUT' && 'text-amber-600 border-amber-200',
                                          ep.method === 'DELETE' && 'text-red-600 border-red-200'
                                        )}
                                      >
                                        {ep.method}
                                      </Badge>
                                    </td>
                                    <td className="p-2.5 font-mono text-xs text-primary-600">{ep.path}</td>
                                    <td className="p-2.5 text-xs text-muted-foreground text-right">{ep.desc}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ==================== WORKBUDDY TAB ==================== */}
            <TabsContent value="workbuddy" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">WorkBuddy 管理通道</CardTitle>
                  <CardDescription>通过此面板可直接操作 KV 存储中的数据</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <WorkBuddyButton
                      icon={Database}
                      label="注入种子数据"
                      desc="将预设文献数据导入 KV 存储"
                      color="text-primary"
                      onClick={async () => {
                        const toastId = toast.loading('正在注入种子数据...');
                        try {
                          const res = await api.adminSeedData();
                          if (res.success) {
                            toast.success(`已注入 ${res.data.added} 篇种子文献，当前共 ${res.data.total} 篇`, { id: toastId });
                            handleRefresh();
                          } else toast.error(res.error || '注入失败', { id: toastId });
                        } catch (e: any) { toast.error(e.message || '注入失败', { id: toastId }); }
                      }}
                    />
                    <WorkBuddyButton
                      icon={Upload}
                      label="从 Zotero 导入"
                      desc="上传 zotero_export.json 批量导入"
                      color="text-primary"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = async (e: any) => {
                          const file = e.target?.files?.[0];
                          if (!file) return;
                          const toastId = toast.loading('正在导入 Zotero 数据...');
                          try {
                            const text = await file.text();
                            const data = JSON.parse(text);
                            const res = await api.importZoteroKV(data, 'admin');
                            if (res.success) {
                              const d = res.data;
                              toast.success(
                                `Zotero 导入完成：${d.papers.imported} 篇论文（跳过 ${d.papers.skipped}），${d.libraries.created} 个文献库，${d.notes.imported} 条笔记`,
                                { id: toastId, duration: 6000 }
                              );
                              handleRefresh();
                            } else {
                              toast.error((res as any).error || '导入失败', { id: toastId });
                            }
                          } catch (e: any) {
                            toast.error(e.message || '导入失败', { id: toastId });
                          }
                        };
                        input.click();
                      }}
                    />
                    <WorkBuddyButton
                      icon={Download}
                      label="导出全部文献"
                      desc="以 BibTeX/CSV/JSON 格式导出"
                      color="text-primary"
                      onClick={async () => {
                        const format = window.confirm('点击「确定」导出 BibTeX，点击「取消」导出 CSV') ? 'bibtex' : 'csv';
                        const toastId = toast.loading(`正在导出 ${format.toUpperCase()}...`);
                        try {
                          const res = await api.adminExportPapers(format);
                          if (res.success) {
                            const blob = new Blob([res.data], { type: format === 'csv' ? 'text/csv' : 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `papers-export.${format === 'bibtex' ? 'bib' : 'csv'}`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast.success(`已导出 ${format.toUpperCase()} 格式文件`, { id: toastId });
                          } else toast.error('导出失败', { id: toastId });
                        } catch (e: any) { toast.error(e.message || '导出失败', { id: toastId }); }
                      }}
                    />
                    <WorkBuddyButton
                      icon={Trash2}
                      label="清理 KV 数据"
                      desc="清除非系统数据（保留 admin）"
                      color="text-red-500"
                      onClick={async () => {
                        if (!window.confirm('确定要清理 KV 数据吗？将保留 admin 账号和系统配置。')) return;
                        const toastId = toast.loading('正在清理 KV 数据...');
                        try {
                          const res = await api.adminCleanKv(true);
                          if (res.success) {
                            toast.success(`已清理 ${res.data.deleted} 条数据`, { id: toastId });
                            handleRefresh();
                          } else toast.error(res.error || '清理失败', { id: toastId });
                        } catch (e: any) { toast.error(e.message || '清理失败', { id: toastId }); }
                      }}
                    />
                    <WorkBuddyButton
                      icon={RefreshCcw}
                      label="重建索引"
                      desc="重新构建 users/spaces 索引"
                      color="text-primary"
                      onClick={async () => {
                        const toastId = toast.loading('正在重建索引...');
                        try {
                          const res = await api.adminReindex();
                          if (res.success) {
                            toast.success(`索引重建完成：${res.data.fixedUsers} 位用户，${res.data.fixedSpaces} 个空间`, { id: toastId });
                            handleRefresh();
                          } else toast.error(res.error || '重建失败', { id: toastId });
                        } catch (e: any) { toast.error(e.message || '重建失败', { id: toastId }); }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">API 端点</CardTitle>
                  <CardDescription>WorkBuddy 专用管理接口</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 font-mono text-xs">
                    {[
                      { method: 'POST', path: '/api/admin/workbuddy/seed', desc: '注入种子数据' },
                      { method: 'POST', path: '/api/admin/workbuddy/import-zotero-kv', desc: 'Zotero 批量导入 KV' },
                      { method: 'GET', path: '/api/admin/workbuddy/export', desc: '获取系统统计' },
                      { method: 'POST', path: '/api/admin/workbuddy/clean', desc: '清理 KV 数据' },
                      { method: 'GET', path: '/api/admin/workbuddy/export?format=bibtex', desc: '导出文献' },
                      { method: 'POST', path: '/api/admin/workbuddy/reindex', desc: '重建索引' },
                    ].map(ep => (
                      <div key={ep.path} className="flex items-center gap-3 rounded border p-2.5">
                        <Badge variant="outline" className={cn('text-[10px] font-mono w-14 justify-center', ep.method === 'GET' && 'text-green-600 border-green-200', ep.method === 'POST' && 'text-blue-600 border-blue-200')}>
                          {ep.method}
                        </Badge>
                        <code className="flex-1 text-primary-500">{ep.path}</code>
                        <span className="text-muted-foreground">{ep.desc}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* ==================== DIALOGS ==================== */}

          {/* Delete User Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认删除用户</DialogTitle>
                <DialogDescription>
                  确定要删除用户 <strong>{selectedUser?.username}</strong> 吗？此操作不可撤销，将同时删除该用户的所有数据和资源。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
                <Button variant="destructive" onClick={handleDeleteUser} disabled={updatingUser === selectedUser?.id}>
                  {updatingUser === selectedUser?.id ? '删除中...' : '确认删除'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>编辑用户</DialogTitle>
                <DialogDescription>修改用户 <strong>{selectedUser?.username}</strong> 的信息</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">显示名称</label>
                  <Input value={editForm.displayName} onChange={e => setEditForm(prev => ({ ...prev, displayName: e.target.value }))} placeholder="用户的显示名称" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">邮箱</label>
                  <Input type="email" value={editForm.email} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} placeholder="user@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">机构</label>
                  <Input value={editForm.institution} onChange={e => setEditForm(prev => ({ ...prev, institution: e.target.value }))} placeholder="所在机构或学校" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">角色</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="role" value="user" checked={editForm.role === 'user'} onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))} className="accent-primary" />
                      <span className="text-sm">普通用户</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="role" value="admin" checked={editForm.role === 'admin'} onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))} className="accent-primary" />
                      <span className="text-sm">管理员</span>
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUserDialogOpen(false)}>取消</Button>
                <Button onClick={handleEditUser} disabled={updatingUser === selectedUser?.id}>
                  {updatingUser === selectedUser?.id ? '保存中...' : '保存更改'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* User Detail Drawer */}
          <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {(detailUser?.displayName || detailUser?.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p>{detailUser?.displayName || detailUser?.username}</p>
                    <p className="text-xs text-muted-foreground font-normal">@{detailUser?.username}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-lg font-bold">{detailUser?.paperCount || 0}</p>
                    <p className="text-[11px] text-muted-foreground">文献</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-lg font-bold">{detailUser?.projectCount || 0}</p>
                    <p className="text-[11px] text-muted-foreground">项目</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-mono text-xs">{detailUser?.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">角色</span>
                    <RoleBadge role={detailUser?.role || 'user'} />
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">状态</span>
                    <StatusBadge isActive={detailUser?.isActive} />
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">邮箱</span>
                    <span>{detailUser?.email || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">机构</span>
                    <span>{detailUser?.institution || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">注册时间</span>
                    <span>{formatDate(detailUser?.createdAt)}</span>
                  </div>
                  {detailUser?.lastLoginAt && (
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">最后登录</span>
                      <span>{formatRelativeTime(detailUser.lastLoginAt)}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 text-xs" onClick={() => window.open(`/#/u/${detailUser?.username}`, '_blank')}>
                    <Eye className="h-3.5 w-3.5 mr-1" />查看公开空间
                  </Button>
                  <Button variant="outline" className="flex-1 text-xs" onClick={() => { setUserDetailOpen(false); openEditDialog(detailUser!); }}>
                    <Edit className="h-3.5 w-3.5 mr-1" />编辑信息
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    </AnimatedPage>
  );
}
