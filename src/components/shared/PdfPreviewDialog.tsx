// ========================================
// PdfPreviewDialog — PDF 预览对话框
// ========================================
import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl?: string;
  title?: string;
}

export function PdfPreviewDialog({ open, onOpenChange, pdfUrl, title }: PdfPreviewDialogProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loadError, setLoadError] = useState(false);

  if (!pdfUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-medium truncate max-w-[60%]">
              {title || 'PDF 预览'}
            </DialogTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setScale(s => Math.max(0.5, s - 0.2))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setScale(s => Math.min(3, s + 0.2))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {numPages > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Button
                variant="outline" size="sm" className="h-7 px-2"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber(p => p - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground">
                第 {pageNumber} / {numPages} 页
              </span>
              <Button
                variant="outline" size="sm" className="h-7 px-2"
                disabled={pageNumber >= numPages}
                onClick={() => setPageNumber(p => p + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 flex justify-center p-4">
          {loadError ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">PDF 加载失败</p>
              <p className="text-xs mt-1">可能是跨域限制或链接无效</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">在新窗口打开</a>
              </Button>
            </div>
          ) : (
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => { setNumPages(numPages); setPageNumber(1); setLoadError(false); }}
              onLoadError={() => setLoadError(true)}
              loading={
                <div className="flex items-center justify-center h-96 text-sm text-muted-foreground">
                  正在加载 PDF...
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer
                renderAnnotationLayer
                loading={
                  <div className="flex items-center justify-center h-96 text-sm text-muted-foreground">
                    正在渲染页面...
                  </div>
                }
              />
            </Document>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
