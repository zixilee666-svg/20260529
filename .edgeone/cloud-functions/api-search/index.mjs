/**
 * Cloud Function: Academic Search Proxy (v3-retry)
 *
 * 路由配置见 config.json: ^/api-external/search/(arxiv|semantic-scholar)$
 * 为什么用 Cloud Function 而不用 Edge Function？
 * - Edge Function (V8 isolate) 无法访问外部网络（fetch 外部域名会 net_exception_timeout）
 * - Cloud Function (Node.js) 可以正常访问外部 API
 */
// ============================================================
// CORS
// ============================================================
function corsHeaders(request) {
  const origin = request.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Max-Age': '86400',
  };
}

const CLOUD_FN_VERSION = 'v3-retry-20260529';

function successJson(data, message = 'Success') {
  const body = { success: true, data, Message: message, _version: CLOUD_FN_VERSION };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function errorJson(message, status = 502) {
  const body = { success: false, data: [], Message: message, _version: CLOUD_FN_VERSION };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function safeTimeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => { try { controller.abort(); } catch (_) {} }, ms);
  return controller.signal;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// fetch + 指数退避重试
// ============================================================
async function fetchWithRetry(url, options, maxRetries = 2) {
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { ...options, signal: safeTimeoutSignal(25000) });
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '0', 10);
        const waitMs = retryAfter > 0 ? retryAfter * 1000 : Math.min(2000 * Math.pow(2, attempt), 16000);
        if (attempt < maxRetries) { await sleep(waitMs); continue; }
      }
      if (res.status >= 500 && attempt < maxRetries) {
        await sleep(1000 * Math.pow(2, attempt));
        continue;
      }
      return res;
    } catch (e) {
      lastError = e;
      if (attempt < maxRetries && (e.name === 'TimeoutError' || e.message?.includes('timeout'))) {
        await sleep(1000 * Math.pow(2, attempt));
        continue;
      }
      throw e;
    }
  }
  throw lastError || new Error('Max retries exceeded');
}

// ============================================================
// arXiv 搜索
// ============================================================
async function handleSearchArxiv(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query') || '';
  const start = parseInt(url.searchParams.get('start') || '0', 10);
  const maxResults = Math.min(parseInt(url.searchParams.get('max_results') || '10', 10), 50);

  if (!query.trim()) return successJson({ data: [], total: 0, limit: maxResults }, 'Empty query');

  try {
    const arxivUrl = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=${start}&max_results=${maxResults}`;
    const res = await fetchWithRetry(arxivUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'AcademicHub/1.2 (mailto:research@academichub.local)' },
    });

    if (!res.ok) {
      return successJson(
        { data: [], total: 0, limit: maxResults, _diag: { stage: 'fetch_error', status: res.status } },
        `[v3] arXiv HTTP ${res.status}`);
    }

    const xml = await res.text();
    if (!xml.includes('<entry>')) {
      return successJson(
        { data: [], total: 0, limit: maxResults, _diag: { stage: 'no_entry', xmlLength: xml.length } },
        `[v3] 无结果: XML=${xml.length}B`);
    }

    const totalMatch = xml.match(/<opensearch:totalResults>(\d+)<\/opensearch:totalResults>/);
    const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;

    const entries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const title = (entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.replace(/\s+/g, ' ').trim() || '';
      const id = (entry.match(/<id>([\s\S]*?)<\/id>/) || [])[1]?.trim() || '';
      const published = (entry.match(/<published>([\s\S]*?)<\/published>/) || [])[1]?.trim() || '';
      const summary = (entry.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1]?.replace(/\s+/g, ' ').trim() || '';
      const authors = [];
      const authorRegex = /<name>([\s\S]*?)<\/name>/g;
      let aMatch;
      while ((aMatch = authorRegex.exec(entry)) !== null) {
        if (!aMatch[1].includes('@')) authors.push(aMatch[1].trim());
      }
      entries.push({
        id: id.split('/').pop() || id,
        title, authors,
        year: parseInt(published.split('-')[0], 10) || new Date().getFullYear(),
        venue: 'arXiv', abstract: summary, url: id, citations: 0,
      });
    }
    return successJson({ data: entries, total, offset: start, limit: maxResults },
      `[v3] arXiv 成功: ${entries.length} 条`);

  } catch (e) {
    return successJson(
      { data: [], total: 0, limit: maxResults, _diag: { stage: 'exception', error: e.message } },
      `[v3] arXiv 异常: ${e.message}`);
  }
}

// ============================================================
// Semantic Scholar 搜索
// ============================================================
async function handleSearchSemanticScholar(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query') || '';
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 100);
  const apiKey = url.searchParams.get('apiKey');

  if (!query.trim()) return successJson({ data: [], total: 0, limit, next: null }, 'Empty query');

  try {
    const fields = 'title,authors,year,venue,abstract,citationCount,externalIds,url,openAccessPdf,isOpenAccess';
    const ssUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=${fields}&limit=${limit}&offset=${offset}`;
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'AcademicHub/1.2 (mailto:research@academichub.local)',
    };
    if (apiKey) headers['x-api-key'] = apiKey;

    const res = await fetchWithRetry(ssUrl, { method: 'GET', headers });

    if (!res.ok) {
      if (res.status === 429) return errorJson('[v3] Semantic Scholar API 限流，请稍后（30-60 秒）再试', 429);
      return successJson({ data: [], total: 0, limit, next: null },
        `[v3] SS API HTTP ${res.status}`);
    }

    const data = await res.json();
    const papers = (data.data || []).map(p => ({
      id: p.paperId || '',
      title: p.title || '',
      authors: (p.authors || []).map(a => a.name).filter(Boolean),
      year: p.year || new Date().getFullYear(),
      venue: p.venue || '',
      abstract: p.abstract || '',
      doi: p.externalIds?.DOI || '',
      url: p.url || '',
      citations: p.citationCount || 0,
      openAccessPdf: p.openAccessPdf?.url || '',
      isOpenAccess: p.isOpenAccess || false,
    }));

    return successJson({ data: papers, total: data.total || papers.length, offset, limit, next: data.next || null },
      `[v3] SS 成功: ${papers.length} 条`);

  } catch (e) {
    return successJson({ data: [], total: 0, limit, next: null },
      `[v3] SS 异常: ${e.message}`);
  }
}

// ============================================================
// Main Handler
// ============================================================
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'GET') return errorJson('Method not allowed', 405);

  let response;
  if (path.includes('/search/arxiv')) {
    response = await handleSearchArxiv(request);
  } else if (path.includes('/search/semantic-scholar')) {
    response = await handleSearchSemanticScholar(request);
  } else {
    response = errorJson('Unknown search endpoint', 404);
  }

  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(request)).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, headers });
}
