import { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import mammoth from 'mammoth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FileImage,
  ExternalLink,
  Loader2,
} from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

type PreviewType = 'pdf' | 'text' | 'docx' | 'markdown' | 'unsupported';

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  fileName?: string;
  content?: string; // 直接传入的文本内容（用于 markdown/note 类型）
}

function getPreviewType(fileName: string): PreviewType {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['txt', 'text'].includes(ext)) return 'text';
  if (ext === 'docx') return 'docx';
  if (['md', 'markdown'].includes(ext)) return 'markdown';
  return 'unsupported';
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ── PDF Preview ──
function PdfPreview({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [error, setError] = useState('');

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setError('');
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    setError(err.message || '无法加载 PDF');
  }, []);

  return (
    <div className="flex flex-col items-center">
      {error ? (
        <div className="text-center py-8 text-destructive">
          <p className="text-sm">{error}</p>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm mt-2 inline-block"
          >
            在外部打开
          </a>
        </div>
      ) : (
        <>
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
            className="max-w-full"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer
              renderAnnotationLayer
              className="shadow-lg"
            />
          </Document>

          {numPages > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                {pageNumber} / {numPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[48px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setScale((s) => Math.min(3, s + 0.2))}
                disabled={scale >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Text Preview ──
function TextPreview({ fileUrl, content }: { fileUrl: string; content?: string }) {
  const [text, setText] = useState(content || '');
  const [loading, setLoading] = useState(!content);
  const [error, setError] = useState('');

  useEffect(() => {
    if (content) {
      setText(content);
      setLoading(false);
      return;
    }
    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error('无法加载文件');
        return res.text();
      })
      .then((t) => {
        setText(t);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [fileUrl, content]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-8 text-destructive text-sm">{error}</div>
    );
  }
  return (
    <div className="max-h-[60vh] overflow-auto rounded-md border bg-muted/30 p-4">
      <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-foreground">
        {text}
      </pre>
    </div>
  );
}

// ── DOCX Preview ──
function DocxPreview({ fileUrl }: { fileUrl: string }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error('无法加载文件');
        return res.arrayBuffer();
      })
      .then((buffer) => mammoth.extractRawText({ arrayBuffer: buffer }))
      .then((result) => {
        setText(result.value);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [fileUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-8 text-destructive text-sm">{error}</div>
    );
  }
  return (
    <div className="max-h-[60vh] overflow-auto rounded-md border bg-muted/30 p-4">
      <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-foreground">
        {text}
      </pre>
    </div>
  );
}

// ── Markdown Preview ──
function MarkdownPreview({ fileUrl, content }: { fileUrl: string; content?: string }) {
  const [text, setText] = useState(content || '');
  const [loading, setLoading] = useState(!content);
  const [error, setError] = useState('');

  useEffect(() => {
    if (content) {
      setText(content);
      setLoading(false);
      return;
    }
    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error('无法加载文件');
        return res.text();
      })
      .then((t) => {
        setText(t);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [fileUrl, content]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-8 text-destructive text-sm">{error}</div>
    );
  }
  return (
    <div className="max-h-[60vh] overflow-auto rounded-md border bg-muted/30 p-4">
      <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-foreground">
        {text}
      </pre>
    </div>
  );
}

// ── Unsupported Preview ──
function UnsupportedPreview({ fileUrl, fileName }: { fileUrl: string; fileName?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileImage className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm text-muted-foreground mb-1">
        暂不支持预览此格式的文件
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        {fileName || '未知文件'}
      </p>
      <Button asChild variant="outline" size="sm">
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 mr-1" />
          在外部打开
        </a>
      </Button>
    </div>
  );
}

// ── Main Dialog ──
export default function FilePreviewDialog({
  open,
  onOpenChange,
  fileUrl,
  fileName = '未知文件',
  content,
}: FilePreviewDialogProps) {
  const previewType = getPreviewType(fileName);

  // If content is provided directly (for markdown/note types), override preview type
  const effectiveType = content ? (previewType === 'markdown' ? 'markdown' : 'text') : previewType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            <span className="truncate max-w-[400px]">{fileName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {effectiveType === 'pdf' && <PdfPreview fileUrl={fileUrl} />}
          {effectiveType === 'text' && <TextPreview fileUrl={fileUrl} content={content} />}
          {effectiveType === 'docx' && <DocxPreview fileUrl={fileUrl} />}
          {effectiveType === 'markdown' && <MarkdownPreview fileUrl={fileUrl} content={content} />}
          {effectiveType === 'unsupported' && (
            <UnsupportedPreview fileUrl={fileUrl} fileName={fileName} />
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
          {!content && (
            <Button variant="outline" size="sm" asChild>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-1" />
                下载/打开
              </a>
            </Button>
          )}
          <Button size="sm" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
