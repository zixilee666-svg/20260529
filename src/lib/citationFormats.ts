import type { Paper } from '@/types';

export function toBibTeX(paper: Paper): string {
  const id = `${paper.authors[0].split(' ').pop()?.toLowerCase()}${paper.year}`;
  const authors = paper.authors.join(' and ');
  return `@${paper.venueType === 'journal' ? 'article' : 'inproceedings'}{${id},
  title     = {${paper.title}},
  author    = {${authors}},
  year      = {${paper.year}},
  journal   = {${paper.venue}}${paper.volume ? `, vol. ${paper.volume}` : ''}${paper.issue ? `, no. ${paper.issue}` : ''}${paper.pages ? `, pp. ${paper.pages}` : ''},
  doi       = {${paper.doi || 'N/A'}},
  url       = {${paper.pdfUrl}}
}`;
}

export function toIEEE(paper: Paper): string {
  const authors = paper.authors.map((a) => {
    const parts = a.split(' ');
    if (parts.length === 1) return a;
    const lastName = parts.pop();
    const initials = parts.map(p => p[0] + '.').join(' ');
    return `${lastName}, ${initials}`;
  }).join(', ');
  let citation = `[${paper.citationCount}] ${authors}, "${paper.title}," ${paper.venue}`;
  if (paper.volume) citation += `, vol. ${paper.volume}`;
  if (paper.issue) citation += `, no. ${paper.issue}`;
  if (paper.pages) citation += `, pp. ${paper.pages}`;
  citation += `, ${paper.year}`;
  return citation + '.';
}

export function toGB7714(paper: Paper): string {
  const authors = paper.authors.map((a) => {
    const parts = a.split(' ');
    if (parts.length === 1) return a;
    const lastName = parts.pop();
    const givenName = parts.join(' ');
    return `${lastName} ${givenName}`;
  }).join(', ');
  let citation = `${authors}. ${paper.title}[J]. ${paper.venue}`;
  if (paper.volume) citation += `, ${paper.volume}`;
  if (paper.issue) citation += `(${paper.issue})`;
  if (paper.pages) citation += `: ${paper.pages}`;
  citation += `, ${paper.year}`;
  if (paper.doi) citation += `. DOI: ${paper.doi}`;
  return citation + '.';
}

export type CitationFormat = 'bibtex' | 'ieee' | 'gb7714';

export function formatCitation(paper: Paper, format: CitationFormat): string {
  switch (format) {
    case 'bibtex': return toBibTeX(paper);
    case 'ieee': return toIEEE(paper);
    case 'gb7714': return toGB7714(paper);
    default: return toIEEE(paper);
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}
