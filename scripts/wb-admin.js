// ========================================
// Joan's Academic Hub — WorkBuddy Admin CLI
// ========================================
// 通过此脚本可由 WorkBuddy 直接操作后端 KV 数据
// 用法:
//   node scripts/wb-admin.js seed-papers
//   node scripts/wb-admin.js list-users
//   node scripts/wb-admin.js export-papers
//   node scripts/wb-admin.js reset-kv
//   node scripts/wb-admin.js get-kv papers:all
//   node scripts/wb-admin.js health

const API_BASE = process.env.ACADEMIC_HUB_URL || 'http://localhost:8787';
const WB_TOKEN = process.env.WORKBUDDY_ADMIN_TOKEN || 'dev-wb-admin-token';

async function apiCall(path, method = 'GET', body) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-WB-Token': WB_TOKEN,
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, options);
  return res.json();
}

// Seed papers from local data file
async function seedPapers() {
  console.log('📥 正在加载种子数据...');
  const { seedPapers } = await import('../src/data/papers.ts');
  const { seedProjects } = await import('../src/data/projects.ts');

  console.log(`📚 文献: ${seedPapers.length} 篇`);
  console.log(`📁 项目: ${seedProjects.length} 个`);

  const result = await apiCall('/api/admin/workbuddy/seed', 'POST', {
    papers: seedPapers,
    projects: seedProjects,
  });

  if (result.success) {
    console.log('✅ 种子数据注入成功！');
    console.log(`   文献: ${result.data.papersLoaded} 篇`);
    console.log(`   项目: ${result.data.projectsLoaded} 个`);
    console.log(`   KV 总键数: ${result.data.totalKVKeys}`);
  } else {
    console.error('❌ 注入失败:', result.error);
  }
}

async function listUsers() {
  console.log('👥 正在获取用户列表...');
  const result = await apiCall('/api/admin/workbuddy/users');
  if (result.success) {
    console.log(`共 ${result.data.length} 个用户:`);
    result.data.forEach(u => {
      console.log(`  - ${u.username} (${u.role}) [${u.id}]`);
    });
  } else {
    console.error('❌ 获取失败:', result.error);
  }
}

async function exportPapers() {
  console.log('📤 正在导出文献...');
  const result = await apiCall('/api/admin/workbuddy/papers');
  if (result.success) {
    const fs = await import('fs');
    const path = await import('path');
    const outPath = path.join(process.cwd(), 'export', 'papers_export.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(result.data, null, 2));
    console.log(`✅ 已导出 ${result.total} 篇文献到 ${outPath}`);
  } else {
    console.error('❌ 导出失败:', result.error);
  }
}

async function getKV(key) {
  console.log(`🔍 读取 KV: ${key}`);
  const result = await apiCall(`/api/admin/workbuddy/kv/${key}`);
  if (result.success) {
    console.log(JSON.stringify(result.data.value, null, 2));
  } else {
    console.error('❌ 读取失败:', result.error);
  }
}

async function healthCheck() {
  console.log('🏥 健康检查...');
  const result = await apiCall('/api/admin/workbuddy/health');
  if (result.success) {
    console.log(`✅ 状态: ${result.data.status}`);
    console.log(`   时间: ${result.data.timestamp}`);
    console.log(`   KV 键数: ${result.data.kvSize}`);
    console.log('   KV 键列表:');
    result.data.kvKeys.forEach(k => console.log(`     - ${k}`));
  } else {
    console.error('❌ 健康检查失败:', result.error);
  }
}

async function resetKV(prefix) {
  console.log(`⚠️  确认清空 KV (前缀: ${prefix || '全部'})...`);
  const result = await apiCall(`/api/admin/workbuddy/kv?prefix=${prefix || ''}&confirm=yes`, 'DELETE');
  if (result.success) {
    console.log(`✅ 已删除 ${result.data.deleted} 个键`);
  } else {
    console.error('❌ 删除失败:', result.error);
  }
}

// CLI
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'seed-papers': await seedPapers(); break;
  case 'list-users': await listUsers(); break;
  case 'export-papers': await exportPapers(); break;
  case 'get-kv': await getKV(arg); break;
  case 'health': await healthCheck(); break;
  case 'reset-kv': await resetKV(arg); break;
  default:
    console.log(`
Joan's Academic Hub — WorkBuddy Admin CLI

用法:
  node scripts/wb-admin.js <command> [args]

命令:
  seed-papers     注入种子文献和项目数据
  list-users      列出所有用户
  export-papers   导出所有文献到 export/ 目录
  get-kv <key>    读取指定 KV 值
  health          健康检查 + KV 状态
  reset-kv [prefix]  清空 KV (可指定前缀)

环境变量:
  ACADEMIC_HUB_URL        后端地址 (默认 http://localhost:8787)
  WORKBUDDY_ADMIN_TOKEN   WorkBuddy Admin Token
`);
}
