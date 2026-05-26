/**
 * Local Edge Function Dev Server
 * Runs edge-functions/index.js on localhost:8787
 */

import http from 'http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 8787;
const UPLOADS_DIR = join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory KV storage simulation
const kvStore = new Map();
const kvMeta = new Map();

const mockKv = {
  async get(key) {
    const v = kvStore.get(key);
    if (v === undefined) return null;
    const meta = kvMeta.get(key);
    if (meta && meta.expiration && meta.expiration < Date.now() / 1000) {
      kvStore.delete(key);
      kvMeta.delete(key);
      return null;
    }
    return v;
  },
  async put(key, value, options = {}) {
    kvStore.set(key, value);
    kvMeta.set(key, options);
    return;
  },
  async delete(key) {
    kvStore.delete(key);
    kvMeta.delete(key);
    return;
  },
  async list(options = {}) {
    const prefix = options.prefix || '';
    const keys = [];
    for (const key of kvStore.keys()) {
      if (key.startsWith(prefix)) {
        keys.push({ name: key });
      }
    }
    return { keys, list_complete: true, cursor: '' };
  },
};

// Load edge function module
const edgeFunctionUrl = new URL('../edge-functions/index.js', import.meta.url);
let onRequest;

try {
  const mod = await import(edgeFunctionUrl.href + '?t=' + Date.now());
  onRequest = mod.onRequest;
} catch (e) {
  console.error('Failed to load edge function:', e);
  process.exit(1);
}

// Convert Web Response to Node.js response
async function sendWebResponse(res, webRes) {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const body = await webRes.arrayBuffer();
  res.end(Buffer.from(body));
}

// Serve static file from uploads directory
function serveStaticFile(res, filePath) {
  try {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const contentTypes = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain; charset=utf-8',
      md: 'text/plain; charset=utf-8',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };
    const data = readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'File not found' }));
  }
}

// Handle file upload
async function handleUpload(req, res, body) {
  try {
    const json = JSON.parse(body.toString('utf-8'));
    const { filename, data } = json;

    if (!filename || !data) {
      res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ success: false, error: 'filename and data are required' }));
      return;
    }

    // Sanitize filename
    const safeName = basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}-${safeName}`;
    const filePath = join(UPLOADS_DIR, uniqueName);

    // Decode base64 and save
    const buffer = Buffer.from(data, 'base64');
    writeFileSync(filePath, buffer);

    const fileUrl = `http://localhost:${PORT}/uploads/${uniqueName}`;
    console.log(`[Upload] Saved ${filename} → ${filePath} (${buffer.length} bytes)`);

    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({
      success: true,
      data: { url: fileUrl, filename: safeName, size: buffer.length },
    }));
  } catch (e) {
    console.error('[Upload] Error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  // Static file serving: /uploads/:filename
  if (pathname.startsWith('/uploads/')) {
    const filename = basename(pathname.replace('/uploads/', ''));
    const filePath = join(UPLOADS_DIR, filename);
    serveStaticFile(res, filePath);
    return;
  }

  // File upload: POST /api/upload
  if (pathname === '/api/upload' && req.method === 'POST') {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    await handleUpload(req, res, body);
    return;
  }

  // Collect body for POST/PUT/PATCH
  let body = null;
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks);
  }

  const url = 'http://' + req.headers.host + req.url;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  const request = new Request(url, {
    method: req.method,
    headers,
    body: body && body.length > 0 ? body : undefined,
    duplex: 'half',
  });

  const context = {
    request,
    env: {
      ACADEMIC_HUB_KV: mockKv,
      JWT_SECRET: process.env.JWT_SECRET || 'academic-hub-v4-jwt-secret-key-2026-prod',
    },
  };

  const reqStart = Date.now();
  let statusCode = 500;
  try {
    const response = await onRequest(context);
    statusCode = response.status;
    await sendWebResponse(res, response);
  } catch (e) {
    console.error('[DevServer] Error:', e);
    statusCode = 500;
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
  } finally {
    await recordRequestMetrics(statusCode, Date.now() - reqStart, pathname, req.method);
  }
});

// System metrics tracking
const STARTUP_TIME = Date.now();

async function recordRequestMetrics(statusCode, durationMs, pathname, method) {
  try {
    // Total requests
    const requests = parseInt(await mockKv.get('system:metrics:requests') || '0', 10);
    await mockKv.put('system:metrics:requests', String(requests + 1));
    // Errors (4xx/5xx)
    if (statusCode >= 400) {
      const errors = parseInt(await mockKv.get('system:metrics:errors') || '0', 10);
      await mockKv.put('system:metrics:errors', String(errors + 1));
    }
    // Total response time
    const totalTime = parseInt(await mockKv.get('system:metrics:responseTime') || '0', 10);
    await mockKv.put('system:metrics:responseTime', String(totalTime + Math.round(durationMs)));
    // Startup time
    await mockKv.put('system:metrics:startup', String(STARTUP_TIME));
    // Recent request timestamp (for 24h calculation)
    const recentKey = 'system:metrics:recent:' + Math.floor(Date.now() / 1000);
    await mockKv.put(recentKey, '1', { expiration: Math.floor((Date.now() + 86400000) / 1000) });
    // Daily request counter (for chart)
    const dailyKey = 'system:metrics:daily:' + new Date().toISOString().slice(0, 10);
    const dailyCount = parseInt(await mockKv.get(dailyKey) || '0', 10);
    await mockKv.put(dailyKey, String(dailyCount + 1));

    // Record activity for key endpoints
    const actionMap = {
      'POST /api/auth/login': { action: '用户登录', target: '认证系统' },
      'POST /api/auth/logout': { action: '用户登出', target: '认证系统' },
      'POST /api/papers': { action: '添加文献', target: '文献库' },
      'PUT /api/papers': { action: '更新文献', target: '文献库' },
      'DELETE /api/papers': { action: '删除文献', target: '文献库' },
      'POST /api/projects': { action: '创建项目', target: '研究项目' },
      'PUT /api/projects': { action: '更新项目', target: '研究项目' },
      'DELETE /api/projects': { action: '删除项目', target: '研究项目' },
      'POST /api/admin/workbuddy/seed': { action: '注入种子数据', target: 'WorkBuddy' },
      'POST /api/admin/workbuddy/clean': { action: '清理 KV 数据', target: 'WorkBuddy' },
      'POST /api/admin/workbuddy/reindex': { action: '重建索引', target: 'WorkBuddy' },
      'GET /api/admin/workbuddy/export': { action: '导出数据', target: 'WorkBuddy' },
    };
    const key = method + ' ' + pathname;
    const mapped = actionMap[key];
    if (mapped) {
      const activities = JSON.parse(await mockKv.get('system:activities') || '[]');
      activities.unshift({
        id: 'act-' + Date.now(),
        action: mapped.action,
        target: mapped.target,
        user: pathname.startsWith('/api/admin') ? 'admin' : 'user',
        status: statusCode < 400 ? 'success' : 'error',
        time: new Date().toISOString(),
      });
      if (activities.length > 30) activities.length = 30;
      await mockKv.put('system:activities', JSON.stringify(activities));
    }
  } catch (e) {
    // Ignore metrics errors
  }
}

server.listen(PORT, () => {
  console.log(`[DevServer] Edge Function server running at http://localhost:${PORT}`);
  console.log(`[DevServer] KV: memory-backed | JWT_SECRET: ${process.env.JWT_SECRET ? 'from env' : 'default'}`);
  console.log(`[DevServer] Uploads dir: ${UPLOADS_DIR}`);
});
