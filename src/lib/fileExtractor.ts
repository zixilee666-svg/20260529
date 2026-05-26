// ========================================
// File Text Extractor — 从 PDF/DOCX/TXT/MD 提取纯文本
// ========================================

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Extract plain text from a file (PDF / DOCX / TXT / MD)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'txt' || ext === 'md' || ext === 'markdown') {
    let text = await file.text();
    if (text.length > 50000) {
      text = text.substring(0, 50000) + '\n\n[内容已截断，原始文件过大]';
    }
    return text;
  }

  if (ext === 'pdf') {
    return extractTextFromPDF(file);
  }

  if (ext === 'docx') {
    return extractTextFromDOCX(file);
  }

  throw new Error(`不支持的文件格式: .${ext}`);
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  if (fullText.length > 50000) {
    fullText = fullText.substring(0, 50000) + '\n\n[内容已截断，原始文件过大]';
  }

  return fullText || '[PDF 中未提取到文本内容]';
}

async function extractTextFromDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.default.extractRawText({ arrayBuffer });

  let text = result.value;
  if (text.length > 50000) {
    text = text.substring(0, 50000) + '\n\n[内容已截断，原始文件过大]';
  }

  return text || '[DOCX 中未提取到文本内容]';
}
