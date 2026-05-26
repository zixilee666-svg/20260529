// ========================================
// EditPaperDialog — 编辑文献信息弹窗
// ========================================
import { useState, useEffect, useCallback } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import type { Paper } from '@/types';

interface EditPaperDialogProps {
  open: boolean;
  paper: Paper | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: (updatedPaper: Paper) => void;
}

export function EditPaperDialog({ open, paper, onOpenChange, onSaved }: EditPaperDialogProps) {
  const [form, setForm] = useState({
    title: '',
    authors: '',
    year: '',
    venue: '',
    doi: '',
    pdfUrl: '',
    abstract: '',
    tags: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (paper && open) {
      setForm({
        title: paper.title || '',
        authors: (paper.authors || []).join(', '),
        year: String(paper.year || ''),
        venue: paper.venue || '',
        doi: paper.doi || '',
        pdfUrl: paper.pdfUrl || '',
        abstract: paper.abstract || '',
        tags: (paper.tags || []).join(', '),
      });
    }
  }, [paper, open]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = useCallback(async () => {
    if (!paper) return;
    if (!form.title.trim()) {
      toast.error('标题不能为空');
      return;
    }

    setSaving(true);
    try {
      const updateData: Partial<Paper> = {
        title: form.title.trim(),
        authors: form.authors.split(/[,，]/).map(s => s.trim()).filter(Boolean),
        year: Number(form.year) || new Date().getFullYear(),
        venue: form.venue.trim(),
        doi: form.doi.trim(),
        pdfUrl: form.pdfUrl.trim(),
        abstract: form.abstract.trim(),
        tags: form.tags.split(/[,，]/).map(s => s.trim()).filter(Boolean),
      };
      const res = await api.updatePaper(paper.id, updateData);
      if (res.success && res.data) {
        toast.success('文献已更新');
        onSaved?.(res.data);
        onOpenChange(false);
      } else {
        toast.error('更新失败');
      }
    } catch (e) {
      toast.error('更新失败: ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [paper, form, onSaved, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            编辑文献信息
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label>标题 <span className="text-red-500">*</span></Label>
            <Input
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="文献标题"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>作者（逗号分隔）</Label>
            <Input
              value={form.authors}
              onChange={e => handleChange('authors', e.target.value)}
              placeholder="如: Zhang, W., Chen, J."
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>年份</Label>
              <Input
                type="number"
                value={form.year}
                onChange={e => handleChange('year', e.target.value)}
                placeholder="2024"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>期刊 / 会议</Label>
              <Input
                value={form.venue}
                onChange={e => handleChange('venue', e.target.value)}
                placeholder="如: ICLR 2024"
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>DOI</Label>
              <Input
                value={form.doi}
                onChange={e => handleChange('doi', e.target.value)}
                placeholder="10.xxxx/..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>PDF 链接</Label>
              <Input
                value={form.pdfUrl}
                onChange={e => handleChange('pdfUrl', e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>标签（逗号分隔）</Label>
            <Input
              value={form.tags}
              onChange={e => handleChange('tags', e.target.value)}
              placeholder="如: GNN, Deep Learning"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>摘要</Label>
            <Textarea
              value={form.abstract}
              onChange={e => handleChange('abstract', e.target.value)}
              placeholder="文献摘要..."
              className="mt-1.5 min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="h-4 w-4 mr-1" />
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
