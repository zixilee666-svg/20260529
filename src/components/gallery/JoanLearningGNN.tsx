import { useEffect, useRef, useState } from 'react';

/**
 * 学术贞德画廊 - 《创造亚当》式GNN学习动态场景
 * 零依赖 | 背景透明 | SVG+CSS动画 | 响应式
 *
 * 场景布局（主提示词方案，不含辅助形态）：
 *  左侧 - Ruler白贞德（亚当位置，半躺斜卧）
 *  右侧 - Avenger黑贞（上帝位置，悬浮，暗色能量光环）
 *  两指之间 - GNN节点图（知识之火）
 *  背景 - GNN知识节点系统（四类节点+连线+流动光点）
 *
 * 辅助形态（Archer/Berserker/Alter Santa Lily/Young Santa Lily）按老板要求暂不添加
 */

// ════════════════════════════════════════════════════════════╗
//  GNN知识图谱数据
// ════════════════════════════════════════════════════════════╝

const GNN_CATEGORIES = {
  gnn: {
    name: 'GNN模型',
    shape: 'hexagon' as const,
    color: '#F4D03F',
    bg: 'rgba(244,208,63,0.18)',
    border: '#F4D03F',
    items: [
      { label: 'GCN', sub: 'Graph Convolutional', link: '/knowledge-graph/gnn-types/gcn' },
      { label: 'GAT', sub: 'Graph Attention', link: '/knowledge-graph/gnn-types/gat' },
      { label: 'GraphSAGE', sub: 'Sample & Aggregate', link: '/knowledge-graph/gnn-types/graphsage' },
      { label: 'GIN', sub: 'Graph Isomorphism', link: '/knowledge-graph/gnn-types/gin' },
      { label: 'GAE/VGAE', sub: 'Graph Auto-Encoder', link: '/knowledge-graph/gnn-types/gae-vgae' },
      { label: 'DiffPool', sub: 'Hierarchical Pool', link: '/knowledge-graph/gnn-types/diffpool' },
    ],
  },
  loss: {
    name: '损失函数',
    shape: 'circle' as const,
    color: '#3498DB',
    bg: 'rgba(52,152,219,0.18)',
    border: '#3498DB',
    items: [
      { label: 'CrossEntropy', sub: '交叉熵损失', link: '/knowledge-graph/loss-functions/cross-entropy' },
      { label: 'Reconstruction', sub: '重构损失', link: '/knowledge-graph/loss-functions/reconstruction' },
      { label: 'KL Divergence', sub: 'KL散度', link: '/knowledge-graph/loss-functions/kl-divergence' },
      { label: 'Contrastive', sub: '对比损失', link: '/knowledge-graph/loss-functions/contrastive' },
      { label: 'Triplet Margin', sub: '三元组损失', link: '/knowledge-graph/loss-functions/triplet' },
    ],
  },
  dataset: {
    name: '数据集',
    shape: 'square' as const,
    color: '#2ECC71',
    bg: 'rgba(46,204,113,0.18)',
    border: '#2ECC71',
    items: [
      { label: 'Cora', sub: '2,708 nodes / 7 cls', link: '/knowledge-graph/datasets/cora' },
      { label: 'CiteSeer', sub: '3,327 nodes / 6 cls', link: '/knowledge-graph/datasets/citeseer' },
      { label: 'PubMed', sub: '19,717 nodes / 3 cls', link: '/knowledge-graph/datasets/pubmed' },
      { label: 'Reddit', sub: '大型规模', link: '/knowledge-graph/datasets/reddit' },
      { label: 'ogbn-arxiv', sub: '169K nodes', link: '/knowledge-graph/datasets/ogbn-arxiv' },
    ],
  },
  basic: {
    name: '基础知识',
    shape: 'diamond' as const,
    color: '#9B59B6',
    bg: 'rgba(155,89,182,0.18)',
    border: '#9B59B6',
    items: [
      { label: 'Message Passing', sub: '消息传递', link: '/knowledge-graph/basics/message-passing' },
      { label: 'Aggregation', sub: '聚合函数', link: '/knowledge-graph/basics/aggregation' },
      { label: 'Node Embedding', sub: '节点嵌入', link: '/knowledge-graph/basics/node-embedding' },
      { label: 'Spectral Domain', sub: '谱域', link: '/knowledge-graph/basics/spectral-domain' },
      { label: 'Spatial Domain', sub: '空域', link: '/knowledge-graph/basics/spatial-domain' },
      { label: 'Attention Mech', sub: '注意力机制', link: '/knowledge-graph/basics/attention-mechanism' },
      { label: 'Graph Fourier', sub: '图傅里叶', link: '/knowledge-graph/basics/graph-fourier' },
      { label: 'Over-smoothing', sub: '过平滑', link: '/knowledge-graph/basics/over-smoothing' },
    ],
  },
};

type CategoryKey = keyof typeof GNN_CATEGORIES;

// ════════════════════════════════════════════════════════════╗
//  SVG绘制辅助：六边形路径
// ════════════════════════════════════════════════════════════╝

function hexPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

function diamondPath(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx},${cy - ry}L${cx + rx},${cy}L${cx},${cy + ry}L${cx - rx},${cy}Z`;
}

// ════════════════════════════════════════════════════════════╗
//  粒子系统（Canvas 2D）
// ════════════════════════════════════════════════════════════╝

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

function ParticlesCanvas({ side }: { side: 'white' | 'black' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // 初始化粒子
    const count = 30;
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: side === 'white' ? 0.2 + Math.random() * 0.5 : -(0.2 + Math.random() * 0.5),
        vy: side === 'white' ? -0.3 - Math.random() * 0.4 : 0.2 + Math.random() * 0.3,
        size: 1.5 + Math.random() * 2.5,
        life: Math.random() * 200,
        maxLife: 150 + Math.random() * 100,
        color: side === 'white'
          ? `hsl(${40 + Math.random() * 20}, 100%, ${70 + Math.random() * 20}%)`
          : `hsl(${350 + Math.random() * 20}, 80%, ${40 + Math.random() * 20}%)`,
      });
    }
    particlesRef.current = particles;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ps = particlesRef.current;
      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life > p.maxLife || p.x < -10 || p.x > canvas.width + 10 || p.y < -10 || p.y > canvas.height + 10) {
          p.x = side === 'white' ? Math.random() * canvas.width * 0.3 : canvas.width * 0.7 + Math.random() * canvas.width * 0.3;
          p.y = Math.random() * canvas.height;
          p.life = 0;
        }
        const alpha = Math.max(0, 1 - p.life / p.maxLife) * 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        // 光晕
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.2;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [side]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 15 }}
    />
  );
}

// ════════════════════════════════════════════════════════════╗
//  GNN知识节点（SVG）
// ════════════════════════════════════════════════════════════╝

function GnnNodeSvg({ catKey, idx, total, orbitRx, orbitRy, phase }: {
  catKey: CategoryKey;
  idx: number;
  total: number;
  orbitRx: number;
  orbitRy: number;
  phase: number;
}) {
  const cat = GNN_CATEGORIES[catKey];
  const item = cat.items[idx];
  const angle = (idx / total) * Math.PI * 2 + phase;
  const baseCx = 500 + orbitRx * Math.cos(angle);
  const baseCy = 250 + orbitRy * Math.sin(angle);
  const nodeSize = catKey === 'dataset' ? 22 : 18;

  const shapeSvg = () => {
    const s = nodeSize;
    switch (cat.shape) {
      case 'hexagon':
        return <path d={hexPath(baseCx, baseCy, s)} fill={cat.bg} stroke={cat.border} strokeWidth="1.5" opacity="0.85" />;
      case 'circle':
        return <circle cx={baseCx} cy={baseCy} r={s} fill={cat.bg} stroke={cat.border} strokeWidth="1.5" opacity="0.85" />;
      case 'square':
        return <rect x={baseCx - s} y={baseCy - s} width={s * 2} height={s * 2} rx="3" fill={cat.bg} stroke={cat.border} strokeWidth="1.5" opacity="0.85" />;
      case 'diamond':
        return <path d={diamondPath(baseCx, baseCy, s, s * 0.7)} fill={cat.bg} stroke={cat.border} strokeWidth="1.5" opacity="0.85" />;
    }
  };

  return (
    <g className="gnn-node-group" style={{ cursor: 'pointer' }}>
      {/* 外发光 */}
      <circle cx={baseCx} cy={baseCy} r={nodeSize + 8} fill={cat.color} opacity="0.08">
        <animate attributeName="r" values={`${nodeSize + 4};${nodeSize + 12};${nodeSize + 4}`} dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.08;0.15;0.08" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* 形状 */}
      {shapeSvg()}
      {/* 标签 */}
      <text x={baseCx} y={baseCy + 4} textAnchor="middle" fontSize="8" fontWeight="700" fill={cat.border} pointerEvents="none">
        {item.label}
      </text>
      <title>{`${item.label} - ${item.sub}\n点击查看知识图谱`}</title>
    </g>
  );
}

// ════════════════════════════════════════════════════════════╗
//  Ruler白贞德 SVG（亚当位置 - 左侧半躺）
// ════════════════════════════════════════════════════════════╝

function RulerJeanneSvg() {
  return (
    <svg viewBox="0 0 420 380" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <defs>
        {/* 金发渐变 */}
        <linearGradient id="rHair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="30%" stopColor="#F4C430" />
          <stop offset="70%" stopColor="#DAA520" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        {/* 肤色渐变 */}
        <linearGradient id="rSkin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF8E7" />
          <stop offset="50%" stopColor="#FFE8C4" />
          <stop offset="100%" stopColor="#F5D0A0" />
        </linearGradient>
        {/* 银铠渐变 */}
        <linearGradient id="rArmor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0F0F0" />
          <stop offset="25%" stopColor="#E8E8E8" />
          <stop offset="50%" stopColor="#D8D8D8" />
          <stop offset="75%" stopColor="#C0C0C0" />
          <stop offset="100%" stopColor="#A8A8A8" />
        </linearGradient>
        {/* 深蓝裙渐变 */}
        <linearGradient id="rDress" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5B8FBF" />
          <stop offset="100%" stopColor="#2E4A6F" />
        </linearGradient>
        {/* 白披风渐变 */}
        <linearGradient id="rCape" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F5F0FF" />
          <stop offset="100%" stopColor="#E8E0F0" />
        </linearGradient>
        {/* 红旗渐变 */}
        <linearGradient id="rFlag" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF2D2D" />
          <stop offset="50%" stopColor="#E80000" />
          <stop offset="100%" stopColor="#B80000" />
        </linearGradient>
        {/* 紫披风渐变 */}
        <linearGradient id="rCapePurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9B59B6" />
          <stop offset="100%" stopColor="#6C3483" />
        </linearGradient>
        {/* 圣光光晕 */}
        <radialGradient id="rHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#FFD700" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
        </radialGradient>
        {/* 发光滤镜 */}
        <filter id="rGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="rSoftGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 圣光光晕背景 */}
      <circle cx="200" cy="190" r="160" fill="url(#rHalo)" opacity="0.3">
        <animate attributeName="r" values="155;165;155" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.25;0.35;0.25" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* 底部阴影 */}
      <ellipse cx="210" cy="365" rx="150" ry="10" fill="#000" opacity="0.08" />

      {/* ===== 身体组（呼吸动画）===== */}
      <g className="ruler-body">
        <animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="5s" repeatCount="indefinite" />

        {/* 紫披风（底层，飘动） */}
        <path className="r-cape-purple" d="M90 270 Q50 210 100 165 Q140 125 210 118 Q290 125 360 155 Q410 185 400 240 Q385 280 330 295 Q260 305 200 302 Q140 302 90 270Z"
          fill="url(#rCapePurple)" opacity="0.85" filter="url(#rGlow)">
          <animate attributeName="d" values="M90 270 Q50 210 100 165 Q140 125 210 118 Q290 125 360 155 Q410 185 400 240 Q385 280 330 295 Q260 305 200 302 Q140 302 90 270Z;M90 270 Q45 205 95 160 Q135 120 210 113 Q295 120 365 150 Q415 180 405 245 Q390 285 330 300 Q255 310 200 307 Q135 307 90 270Z;M90 270 Q50 210 100 165 Q140 125 210 118 Q290 125 360 155 Q410 185 400 240 Q385 280 330 295 Q260 305 200 302 Q140 302 90 270Z" dur="5s" repeatCount="indefinite" />
        </path>
        {/* 披风红色十字（Jerusalem Cross） */}
        <g transform="translate(190, 155)" opacity="0.5">
          <rect x="8" y="0" width="6" height="40" fill="#C0392B" rx="1" />
          <rect x="0" y="8" width="40" height="6" fill="#C0392B" rx="1" />
          {/* 四角小十字 */}
          <rect x="2" y="2" width="4" height="4" fill="#C0392B" rx="0.5" />
          <rect x="34" y="2" width="4" height="4" fill="#C0392B" rx="0.5" />
          <rect x="2" y="34" width="4" height="4" fill="#C0392B" rx="0.5" />
          <rect x="34" y="34" width="4" height="4" fill="#C0392B" rx="0.5" />
        </g>

        {/* 白披风内衬（中层） */}
        <path d="M110 265 Q75 210 115 170 Q150 135 215 128 Q285 135 350 162 Q395 190 385 242 Q370 278 320 292 Q255 300 200 298 Q145 298 110 265Z"
          fill="url(#rCape)" opacity="0.7" />

        {/* 深蓝裙摆 */}
        <path d="M135 210 Q120 255 145 285 Q185 298 245 295 Q305 292 355 278 Q378 260 368 228 Q358 208 318 202 Q265 198 215 202 Q165 205 135 210Z"
          fill="url(#rDress)" />

        {/* 银铠胸甲（主铠） */}
        <path d="M158 180 Q180 152 230 148 Q280 155 328 180 Q340 198 328 220 Q278 208 230 205 Q182 208 158 220 Q148 200 158 180Z"
          fill="url(#rArmor)" stroke="#A0A0A0" strokeWidth="0.8" />
        {/* 胸甲装饰纹路 */}
        <path d="M200 172 Q230 166 260 172" stroke="#C9A04D" strokeWidth="1.5" fill="none" opacity="0.7" />
        <path d="M192 188 Q230 182 268 188" stroke="#C9A04D" strokeWidth="1" fill="none" opacity="0.5" />
        {/* 胸甲中央宝石 */}
        <ellipse cx="230" cy="185" rx="6" ry="8" fill="#7B68EE" opacity="0.8" />
        <ellipse cx="230" cy="183" rx="3" ry="4" fill="#B088F9" opacity="0.9" />
        {/* 肩甲 */}
        <path d="M148 178 Q130 170 125 185 Q122 200 132 210 Q142 200 148 190Z" fill="url(#rArmor)" stroke="#A0A0A0" strokeWidth="0.8" />
        <path d="M312 178 Q330 170 335 185 Q338 200 328 210 Q318 200 312 190Z" fill="url(#rArmor)" stroke="#A0A0A0" strokeWidth="0.8" />
        {/* 腰带 */}
        <path d="M170 200 Q230 195 290 200" stroke="#C9A04D" strokeWidth="3" fill="none" />
        <rect x="222" y="194" width="16" height="10" rx="2" fill="#C9A04D" />
        <circle cx="230" cy="199" r="3" fill="#FFD700" />

        {/* 左腿（伸展向前） */}
        <path d="M160 248 Q135 252 105 255 Q82 258 76 260 Q70 263 80 266 Q122 268 168 262Z" fill="url(#rDress)" />
        <ellipse cx="118" cy="256" rx="14" ry="8" fill="url(#rArmor)" transform="rotate(-10 118 256)" />
        {/* 黑袜 */}
        <path d="M85 258 Q72 260 66 263 Q62 266 68 268 Q86 269 96 266Z" fill="#1a1a2e" />
        <ellipse cx="62" cy="265" rx="9" ry="5" fill="url(#rSkin)" transform="rotate(-15 62 265)" />

        {/* 右腿（弯曲向后） */}
        <path d="M295 246 Q335 240 365 235 Q385 233 390 235 Q393 238 385 242 Q345 248 305 254Z" fill="url(#rDress)" />
        <ellipse cx="345" cy="240" rx="14" ry="8" fill="url(#rArmor)" transform="rotate(10 345 240)" />

        {/* ===== 左臂（向前伸展 - 亚当手势）===== */}
        <g className="r-left-arm">
          <animateTransform attributeName="transform" type="translate" values="0,0;-4,3;0,0" dur="3s" repeatCount="indefinite" />
          {/* 上臂 */}
          <path d="M160 192 Q135 182 112 188 Q90 198 84 210 Q80 222 90 228 L108 222 Q102 212 110 202 Q126 194 142 196Z"
            fill="url(#rSkin)" />
          {/* 前臂 + 手（向前伸展） */}
          <path d="M90 228 Q74 234 56 242 Q44 252 40 262 Q38 270 44 273 Q52 275 60 270 L70 262 Q64 256 68 250 Q76 244 86 242 Q96 240 106 238Z"
            fill="url(#rSkin)" />
          {/* 左手手指（向上微曲，指向黑贞） */}
          <g transform="translate(40, 262)">
            {/* 拇指 */}
            <path d="M0,0 Q-6,-6 -8,-12" stroke="url(#rSkin)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* 食指（主要指向） */}
            <path d="M3,-2 Q1,-12 0,-20" stroke="url(#rSkin)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* 中指 */}
            <path d="M7,-3 Q6,-13 8,-19" stroke="url(#rSkin)" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* 无名指 */}
            <path d="M10,-2 Q10,-10 12,-16" stroke="url(#rSkin)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* 小指 */}
            <path d="M12,0 Q14,-6 16,-11" stroke="url(#rSkin)" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* 指尖微光 */}
            <circle cx="0" cy="-20" r="2.5" fill="#FFD700" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="r" values="2.5;3.5;2.5" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="8" cy="-19" r="2.5" fill="#FFD700" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
            </circle>
            <circle cx="12" cy="-16" r="2" fill="#FFD700" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" begin="0.6s" />
            </circle>
          </g>
        </g>

        {/* ===== 右臂（自然放置，持剑/旗帜）===== */}
        <g className="r-right-arm">
          <animateTransform attributeName="transform" type="translate" values="0,0;2,-1;0,0" dur="4s" repeatCount="indefinite" />
          {/* 上臂 */}
          <path d="M315 192 Q335 200 330 218 Q322 228 310 225Z" fill="url(#rSkin)" />
          {/* 前臂 */}
          <path d="M310 225 Q300 235 295 250 Q298 262 308 258Z" fill="url(#rSkin)" />
          {/* 手 */}
          <ellipse cx="308" cy="258" rx="7" ry="5" fill="url(#rSkin)" transform="rotate(20 308 258)" />
        </g>

        {/* 旗帜（右旁，百合花纹章） */}
        <g transform="translate(305, 162) rotate(-18)">
          <rect x="0" y="0" width="5" height="95" fill="#8B8B8B" rx="1" />
          {/* 旗面 */}
          <rect x="5" y="8" width="52" height="38" rx="3" fill="url(#rFlag)" stroke="#8B0000" strokeWidth="0.8" />
          {/* 百合花饰（Fleur-de-lis）×3 */}
          <g transform="translate(18, 18)" fill="white" opacity="0.95">
            {/* 中央百合 */}
            <path d="M8,2 Q5,0 4,3 Q3,6 6,8 Q8,10 10,8 Q13,6 12,3 Q11,0 8,2Z" />
            <path d="M4,8 L8,14 L12,8" stroke="white" strokeWidth="1.2" fill="none" />
            {/* 左侧小百合 */}
            <path d="M0,6 Q-2,4 -1,7 Q0,9 2,8" fill="white" opacity="0.8" />
            {/* 右侧小百合 */}
            <path d="M16,6 Q18,4 19,7 Q18,9 16,8" fill="white" opacity="0.8" />
          </g>
          {/* 旗杆金属顶 */}
          <circle cx="2.5" cy="4" r="3" fill="#FFD700" />
        </g>

        {/* 剑（腰间，柄可见） */}
        <g transform="translate(272, 198) rotate(25)">
          <rect x="0" y="0" width="4" height="60" fill="#C0C0C0" rx="1" />
          <path d="M-3,0 L8,0 L4,-10 L-3,-10Z" fill="#E8E8E8" stroke="#A0A0A0" strokeWidth="0.5" />
          {/* 剑柄宝石 */}
          <circle cx="2.5" cy="-5" r="2.5" fill="#7B68EE" />
        </g>
      </g>

      {/* ===== 头部组 ===== */}
      <g className="ruler-head">
        <animateTransform attributeName="transform" type="translate" values="0,0;-1,1;0,0" dur="6s" repeatCount="indefinite" />

        {/* 后发（金色大波浪，底层） */}
        <path d="M172 125 Q150 102 140 76 Q134 54 150 42 Q172 34 198 38 Q226 34 254 44 Q280 56 284 82 Q280 108 266 125Z"
          fill="url(#rHair)" />

        {/* 右侧粗辫子（主辫，飘动） */}
        <path className="r-braid-main" d="M280 80 Q310 72 332 88 Q356 108 348 132 Q340 152 320 145 Q300 135 288 118 Q280 100 280 80Z"
          fill="url(#rHair)" stroke="#B8860B" strokeWidth="0.8">
          <animate attributeName="d" values="M280 80 Q310 72 332 88 Q356 108 348 132 Q340 152 320 145 Q300 135 288 118 Q280 100 280 80Z;M280 80 Q314 68 338 84 Q364 102 356 136 Q348 156 326 148 Q304 138 286 120 Q278 102 280 80Z;M280 80 Q310 72 332 88 Q356 108 348 132 Q340 152 320 145 Q300 135 288 118 Q280 100 280 80Z" dur="4s" repeatCount="indefinite" />
        </path>
        {/* 辫子编织纹理 */}
        {[0, 1, 2, 3].map(i => (
          <path key={`braid1-${i}`} d={`M${288 + i * 5} ${88 + i * 10} Q${298 + i * 5} ${92 + i * 10} Q${310 + i * 5} ${100 + i * 9}`}
            stroke="#DAA520" strokeWidth="1.5" fill="none" opacity="0.5" />
        ))}
        {/* 辫梢黑色丝带 */}
        <path d="M320 145 Q330 155 325 168 Q320 175 315 170" stroke="#1a1a2e" strokeWidth="2" fill="none" opacity="0.8" />

        {/* 左侧细辫子（侧辫） */}
        <path d="M172 95 Q155 108 148 128 Q145 148 152 158 Q162 148 165 130Z"
          fill="url(#rHair)" />
        <path d="M152 158 Q148 170 155 178 Q162 172 165 160Z" fill="url(#rHair)" />
        {/* 左侧辫梢丝带 */}
        <path d="M155 178 Q150 185 148 180" stroke="#1a1a2e" strokeWidth="1.8" fill="none" opacity="0.7" />

        {/* 头部（圆形脸） */}
        <ellipse cx="215" cy="98" rx="38" ry="34" fill="url(#rSkin)" />

        {/* 刘海（前发，金色） */}
        <path d="M180 80 Q192 65 215 62 Q238 65 258 80 Q252 76 238 73 Q215 69 192 73 Q180 78 180 80Z"
          fill="url(#rHair)" />
        {/* 额前碎发 */}
        <path d="M195 72 Q200 66 208 70 Q215 66 222 72" stroke="url(#rHair)" strokeWidth="2" fill="none" />
        <path d="M222 72 Q230 66 238 72" stroke="url(#rHair)" strokeWidth="1.5" fill="none" />

        {/* 银色额冠（Tiara） */}
        <path d="M188 74 Q215 58 242 74 Q236 68 215 63 Q194 68 188 74Z" fill="#E8E8E8" stroke="#C9A04D" strokeWidth="0.8" />
        {/* 冠上宝石 */}
        <ellipse cx="215" cy="65" rx="5" ry="6" fill="#FFD700" />
        <ellipse cx="215" cy="63" rx="2.5" ry="3" fill="#FFF8DC" opacity="0.9" />
        {/* 冠饰花纹 */}
        <path d="M202 70 L202 64 M225 70 L225 64" stroke="#A0A0A0" strokeWidth="1.2" />
        <circle cx="202" cy="67" r="1.5" fill="#C9A04D" />
        <circle cx="225" cy="67" r="1.5" fill="#C9A04D" />

        {/* 呆毛（Ahoge） */}
        <path d="M215 59 Q220 44 230 46 Q232 50 228 55" stroke="#FFD700" strokeWidth="3" fill="none" strokeLinecap="round">
          <animate attributeName="d" values="M215 59 Q220 44 230 46 Q232 50 228 55;M215 59 Q222 42 226 44 Q228 48 225 53;M215 59 Q220 44 230 46 Q232 50 228 55" dur="3s" repeatCount="indefinite" />
        </path>

        {/* 眼睛（清澈蓝眸，FGO风格） */}
        <g>
          {/* 左眼 */}
          <ellipse cx="200" cy="100" rx="8" ry="10" fill="white" />
          {/* 虹膜 */}
          <ellipse cx="200" cy="100" rx="6" ry="9" fill="#5B9BD5" />
          {/* 瞳孔 */}
          <ellipse cx="200" cy="101" rx="3.5" ry="6" fill="#2E5C8A" />
          {/* 高光 */}
          <circle cx="201" cy="97" r="2.5" fill="white" />
          <circle cx="198.5" cy="99" r="1.2" fill="white" opacity="0.7" />
          {/* 上眼睑 */}
          <path d="M191 93 Q200 89 209 93" stroke="#3A3A5C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {/* 下眼睑 */}
          <path d="M193 105 Q200 108 207 105" stroke="#E8D8C8" strokeWidth="1" fill="none" opacity="0.6" />
          {/* 睫毛（上） */}
          <path d="M192 93 Q190 90 188 91" stroke="#3A3A5C" strokeWidth="1" fill="none" />
          <path d="M195 92 Q193 89 191 90" stroke="#3A3A5C" strokeWidth="0.8" fill="none" />
        </g>
        <g>
          {/* 右眼 */}
          <ellipse cx="228" cy="100" rx="8" ry="10" fill="white" />
          <ellipse cx="228" cy="100" rx="6" ry="9" fill="#5B9BD5" />
          <ellipse cx="228" cy="101" rx="3.5" ry="6" fill="#2E5C8A" />
          <circle cx="229" cy="97" r="2.5" fill="white" />
          <circle cx="226.5" cy="99" r="1.2" fill="white" opacity="0.7" />
          <path d="M219 93 Q228 89 237 93" stroke="#3A3A5C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M221 105 Q228 108 235 105" stroke="#E8D8C8" strokeWidth="1" fill="none" opacity="0.6" />
          <path d="M236 93 Q238 90 240 91" stroke="#3A3A5C" strokeWidth="1" fill="none" />
          <path d="M233 92 Q235 89 237 90" stroke="#3A3A5C" strokeWidth="0.8" fill="none" />
        </g>

        {/* 眉毛 */}
        <path d="M190 90 Q200 86 210 90" stroke="#8B6914" strokeWidth="1.5" fill="none" opacity="0.7" />
        <path d="M218 90 Q228 86 238 90" stroke="#8B6914" strokeWidth="1.5" fill="none" opacity="0.7" />

        {/* 腮红（FGO风格，明显） */}
        <ellipse cx="188" cy="110" rx="7" ry="4" fill="#FFB6C1" opacity="0.4" />
        <ellipse cx="238" cy="110" rx="7" ry="4" fill="#FFB6C1" opacity="0.4" />

        {/* 嘴巴（樱唇微启 - 渴望知识的表情） */}
        <path d="M204 116 Q215 121 226 116" stroke="#C06040" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* 微张的嘴（内色） */}
        <ellipse cx="215" cy="119.5" rx="4" ry="2" fill="#D4846A" opacity="0.4" />
        {/* 下唇高光 */}
        <ellipse cx="215" cy="121" rx="3" ry="1" fill="white" opacity="0.3" />
      </g>

      {/* 圣光粒子（头部周围漂浮） */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <circle key={`halo-${i}`} r={1.5 + (i % 2)} fill="#FFD700" opacity="0">
          <animate attributeName="cx" values={`${198 + i * 10};${205 + i * 10}`} dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.5}s`} />
          <animate attributeName="cy" values={`${55 - i * 6};${48 - i * 6}`} dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.5}s`} />
          <animate attributeName="opacity" values="0;0.8;0" dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.5}s`} />
        </circle>
      ))}
      {/* 发丝飘动光点 */}
      {[0, 1, 2].map(i => (
        <circle key={`hair-sparkle-${i}`} r="1.2" fill="#FFF8DC" opacity="0.6">
          <animate attributeName="cx" values={`${270 + i * 15};${280 + i * 15}`} dur={`${3 + i * 0.5}s`} repeatCount="indefinite" begin={`${i * 0.7}s`} />
          <animate attributeName="cy" values={`${78 + i * 8};${75 + i * 8}`} dur={`${3 + i * 0.5}s`} repeatCount="indefinite" begin={`${i * 0.7}s`} />
          <animate attributeName="opacity" values="0.6;0;0.6" dur={`${3 + i * 0.5}s`} repeatCount="indefinite" begin={`${i * 0.7}s`} />
        </circle>
      ))}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════╗
//  Avenger黑贞 SVG（上帝位置 - 右侧悬浮）
// ════════════════════════════════════════════════════════════╝

function AvengerJeanneSvg() {
  return (
    <svg viewBox="0 0 400 380" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <defs>
        {/* 白发渐变 */}
        <linearGradient id="aHair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="30%" stopColor="#F5F5F5" />
          <stop offset="70%" stopColor="#E8E8E8" />
          <stop offset="100%" stopColor="#D0D0D0" />
        </linearGradient>
        {/* 黑铠渐变 */}
        <linearGradient id="aArmor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a2a3e" />
          <stop offset="30%" stopColor="#1a1a2e" />
          <stop offset="60%" stopColor="#0a0a1a" />
          <stop offset="100%" stopColor="#050510" />
        </linearGradient>
        {/* 暗红披风渐变 */}
        <linearGradient id="aCape" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B0000" />
          <stop offset="40%" stopColor="#A01030" />
          <stop offset="100%" stopColor="#C0392B" />
        </linearGradient>
        {/* 暗能量光环 */}
        <radialGradient id="aDarkAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(108,52,131,0.4)" />
          <stop offset="40%" stopColor="rgba(80,20,100,0.2)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        {/* 龙焰光晕 */}
        <radialGradient id="aFlame" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF4444" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8B0000" stopOpacity="0" />
        </radialGradient>
        {/* 发光滤镜 */}
        <filter id="aGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="aStrongGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 暗色能量光环背景（多层） */}
      <g className="a-aura">
        <ellipse cx="200" cy="190" rx="190" ry="150" fill="url(#aDarkAura)" opacity="0.5">
          <animate attributeName="rx" values="185;195;185" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.6;0.4" dur="6s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="200" cy="190" rx="160" ry="120" fill="url(#aFlame)" opacity="0.3">
          <animate attributeName="rx" values="158;165;158" dur="4s" repeatCount="indefinite" />
        </ellipse>
        {/* 龙焰粒子（环绕飞舞） */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <circle key={`flame-${i}`} r={2 + (i % 3)} fill={`hsl(${350 + (i % 4) * 8}, ${75 + (i % 3) * 10}%, ${45 + (i % 4) * 8}%)`} opacity="0.6">
            <animate attributeName="cx" values={`${160 + (i % 4) * 20};${175 + (i % 4) * 20}`} dur={`${1.8 + (i % 3) * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.25}s`} />
            <animate attributeName="cy" values={`${140 + (i % 4) * 15};${132 + (i % 4) * 15}`} dur={`${1.8 + (i % 3) * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.25}s`} />
            <animate attributeName="opacity" values="0.6;0.1;0.6" dur={`${1.8 + (i % 3) * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.25}s`} />
          </circle>
        ))}
        {/* 暗紫能量星点 */}
        {[0, 1, 2, 3, 4].map(i => (
          <circle key={`sparkle-${i}`} r="1.5" fill="#B088F9" opacity="0.5">
            <animate attributeName="cx" values={`${120 + i * 30};${135 + i * 30}`} dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.4}s`} />
            <animate attributeName="cy" values={`${100 + i * 20};${90 + i * 20}`} dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.4}s`} />
            <animate attributeName="opacity" values="0.5;0;0.5" dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.4}s`} />
          </circle>
        ))}
      </g>

      {/* ===== 身体组（悬浮呼吸）===== */}
      <g className="avenger-body">
        <animateTransform attributeName="transform" type="translate" values="0,0;0,-4;0,0" dur="5s" repeatCount="indefinite" />

        {/* 暗红披风（火焰飘动，底层） */}
        <path className="a-cape" d="M75 210 Q40 155 85 115 Q125 75 195 68 Q270 75 340 108 Q395 148 375 200 Q355 248 300 265 Q235 275 170 268 Q110 258 75 210Z"
          fill="url(#aCape)" filter="url(#aGlow)" opacity="0.92">
          <animate attributeName="d" values="M75 210 Q40 155 85 115 Q125 75 195 68 Q270 75 340 108 Q395 148 375 200 Q355 248 300 265 Q235 275 170 268 Q110 258 75 210Z;M75 210 Q35 150 80 110 Q120 70 195 63 Q275 70 345 103 Q400 143 380 205 Q360 253 302 270 Q232 280 168 273 Q105 263 75 210Z;M75 210 Q40 155 85 115 Q125 75 195 68 Q270 75 340 108 Q395 148 375 200 Q355 248 300 265 Q235 275 170 268 Q110 258 75 210Z" dur="4s" repeatCount="indefinite" />
        </path>
        {/* 披风内衬（暗色） */}
        <path d="M90 205 Q55 158 95 122 Q130 85 195 78 Q270 85 335 115 Q385 152 370 200 Q352 242 302 258 Q240 268 175 262 Q115 252 90 205Z"
          fill="#1a1a2e" opacity="0.5" />

        {/* 黑色龙鳞铠甲（主铠） */}
        <path d="M128 175 Q152 145 205 140 Q258 148 308 175 Q320 192 308 215 Q258 202 205 198 Q152 202 128 215 Q118 198 128 175Z"
          fill="url(#aArmor)" stroke="#0a0a1a" strokeWidth="0.8" />
        {/* 龙鳞纹理（精细网格） */}
        {[0, 1, 2, 3].map(i => (
          <path key={`scale-${i}`} d={`M${148 + i * 40} ${170 + i * 3} Q${168 + i * 40} ${162 + i * 3} ${188 + i * 40} ${170 + i * 3}`}
            stroke="#6C3483" strokeWidth="1.2" fill="none" opacity="0.5" />
        ))}
        {[0, 1, 2].map(i => (
          <path key={`scale2-${i}`} d={`M${163 + i * 42} ${182 + i * 4} Q${183 + i * 42} ${174 + i * 4} ${203 + i * 42} ${182 + i * 4}`}
            stroke="#6C3483" strokeWidth="1" fill="none" opacity="0.35" />
        ))}
        {/* 铠甲装饰线 */}
        <path d="M175 168 Q205 162 240 168" stroke="#C0392B" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M168 185 Q205 178 242 185" stroke="#C0392B" strokeWidth="1" fill="none" opacity="0.4" />
        {/* 胸甲中央红宝石 */}
        <ellipse cx="240" cy="182" rx="5" ry="7" fill="#FF2D2D" opacity="0.9" />
        <ellipse cx="240" cy="180" rx="2.5" ry="3.5" fill="#FF6B6B" opacity="0.95" />

        {/* 肩甲（龙翼状） */}
        <path d="M118 175 Q98 165 92 180 Q88 198 100 210 Q112 200 118 190Z" fill="url(#aArmor)" stroke="#0a0a1a" strokeWidth="0.8" />
        <path d="M310 175 Q330 165 336 180 Q340 198 328 210 Q316 200 310 190Z" fill="url(#aArmor)" stroke="#0a0a1a" strokeWidth="0.8" />
        {/* 肩甲尖刺 */}
        <path d="M100 210 Q92 218 96 225" stroke="#C0392B" strokeWidth="2" fill="none" opacity="0.7" />
        <path d="M328 210 Q336 218 332 225" stroke="#C0392B" strokeWidth="2" fill="none" opacity="0.7" />

        {/* 右臂（伸展，食指指向白贞德 - 上帝手势） */}
        <g className="a-right-arm">
          <animateTransform attributeName="transform" type="translate" values="0,0;3,-2;0,0" dur="3s" repeatCount="indefinite" />
          {/* 上臂（铠） */}
          <path d="M288 185 Q315 175 338 183 Q348 195 342 210 Q335 220 320 222Z" fill="url(#aArmor)" />
          {/* 前臂（白色，露指铠手套） */}
          <path d="M320 222 Q342 228 360 235 Q370 243 366 255 Q362 265 350 262 L340 252 Q344 242 340 235 Q332 228 320 230Z" fill="url(#aHair)" />
          {/* 右手（手指伸展，指向白贞德） */}
          <g transform="translate(366, 255)">
            {/* 拇指 */}
            <path d="M0,0 Q-4,-5 -6,-10" stroke="url(#aHair)" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* 食指（直指，能量发射） */}
            <path d="M3,-2 L4,-14" stroke="url(#aHair)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* 中指 */}
            <path d="M7,-3 L8,-13" stroke="url(#aHair)" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* 无名指 */}
            <path d="M10,-2 L11,-10" stroke="url(#aHair)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* 小指 */}
            <path d="M12,0 L14,-7" stroke="url(#aHair)" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* 指尖能量丝线（暗红+金） */}
            <circle cx="4" cy="-14" r="2.8" fill="#FF2D2D" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="r" values="2.8;3.8;2.8" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="8" cy="-13" r="2.5" fill="#FFD700" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.15;0.8" dur="1.4s" repeatCount="indefinite" begin="0.2s" />
            </circle>
            <circle cx="11" cy="-10" r="2" fill="#FF2D2D" opacity="0.7">
              <animate attributeName="opacity" values="0.7;0.1;0.7" dur="1s" repeatCount="indefinite" begin="0.4s" />
            </circle>
            {/* 能量丝线（从指尖飞出） */}
            <path d="M4,-14 L12,-18 L20,-15" stroke="#FF2D2D" strokeWidth="1.5" fill="none" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1s" repeatCount="indefinite" />
            </path>
            <path d="M8,-13 L18,-16 L26,-12" stroke="#FFD700" strokeWidth="1" fill="none" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.05;0.4" dur="1.2s" repeatCount="indefinite" begin="0.2s" />
            </path>
          </g>
        </g>

        {/* 左臂（自然放置，握拳） */}
        <g className="a-left-arm">
          <animateTransform attributeName="transform" type="translate" values="0,0;-2,1;0,0" dur="4s" repeatCount="indefinite" />
          <path d="M135 185 Q115 195 118 212 Q122 222 135 218Z" fill="url(#aArmor)" />
          {/* 左手（握拳） */}
          <ellipse cx="135" cy="218" rx="8" ry="5" fill="url(#aHair)" transform="rotate(-15 135 218)" />
        </g>

        {/* 剑（腰间，旗不精叛击） */}
        <g transform="translate(268, 190) rotate(20)">
          <rect x="0" y="0" width="4" height="62" fill="#1a1a2e" rx="1" />
          <path d="M-4,0 L10,0 L5,-12 L-4,-12Z" fill="#2a1a2e" stroke="#6C3483" strokeWidth="0.5" />
          {/* 剑柄宝石（红） */}
          <circle cx="3" cy="-6" r="3" fill="#C0392B" />
          <circle cx="3" cy="-6" r="1.5" fill="#FF6B6B" opacity="0.9" />
          {/* 剑鞘 */}
          <path d="M-2,15 Q2,35 0,55 Q-2,58 -4,55" stroke="#1a1a2e" strokeWidth="3" fill="none" opacity="0.8" />
        </g>
      </g>

      {/* ===== 头部组 ===== */}
      <g className="avenger-head">
        <animateTransform attributeName="transform" type="translate" values="0,0;1,-2;0,0" dur="6s" repeatCount="indefinite" />

        {/* 白发（散开飞舞，主发团） */}
        <g className="a-hair-main">
          <animateTransform attributeName="transform" type="rotate" values="-2,200,88;2,200,88;-2,200,88" dur="5s" repeatCount="indefinite" />
          <path d="M155 105 Q130 78 136 52 Q148 28 172 22 Q200 18 228 26 Q258 38 268 64 Q272 90 265 115 Q255 132 235 135 Q210 130 185 125 Q160 118 155 105Z"
            fill="url(#aHair)" />
          {/* 发丝飘动（右侧） */}
          <path d="M268 64 Q290 48 315 58 Q330 72 318 88" stroke="#E8E8E8" strokeWidth="2.5" fill="none" opacity="0.7">
            <animate attributeName="d" values="M268 64 Q290 48 315 58 Q330 72 318 88;M268 64 Q292 45 318 55 Q335 68 320 85;M268 64 Q290 48 315 58 Q330 72 318 88" dur="3.5s" repeatCount="indefinite" />
          </path>
          {/* 发丝飘动（左侧） */}
          <path d="M155 80 Q138 62 128 58 Q122 65 130 78" stroke="#E8E8E8" strokeWidth="2" fill="none" opacity="0.6">
            <animate attributeName="d" values="M155 80 Q138 62 128 58 Q122 65 130 78;M155 80 Q135 58 125 55 Q120 62 128 76;M155 80 Q138 62 128 58 Q122 65 130 78" dur="4s" repeatCount="indefinite" begin="0.5s" />
          </path>
          {/* 发梢卷曲 */}
          <path d="M318 88 Q328 98 322 112 Q316 120 310 115" stroke="#D0D0D0" strokeWidth="1.8" fill="none" opacity="0.5" />
          <path d="M130 78 Q125 88 128 98 Q132 96 130 90" stroke="#D0D0D0" strokeWidth="1.5" fill="none" opacity="0.4" />
        </g>

        {/* 头部（白皙肌肤） */}
        <ellipse cx="200" cy="92" rx="36" ry="32" fill="#FFF5E6" />

        {/* 刘海（前发，白色半遮眼） */}
        <path d="M168 78 Q180 64 205 62 Q230 64 252 78 Q246 74 230 72 Q205 68 180 72 Q168 76 168 78Z"
          fill="url(#aHair)" />
        {/* 额前碎发（遮眼） */}
        <path d="M185 85 Q195 78 205 82 Q210 78 218 84" stroke="#E8E8E8" strokeWidth="1.8" fill="none" opacity="0.8" />
        <path d="M218 84 Q228 78 238 84" stroke="#E8E8E8" strokeWidth="1.5" fill="none" opacity="0.7" />

        {/* 额头黑饰（三尖王冠状） */}
        <path d="M178 74 Q200 58 222 74 Q218 68 200 64 Q182 68 178 74Z" fill="#1a1a2e" stroke="#6C3483" strokeWidth="0.8" />
        {/* 黑饰尖刺 */}
        <path d="M192 68 L192 60 L195 62" fill="#6C3483" />
        <path d="M200 64 L200 55 L203 58" fill="#6C3483" />
        <path d="M208 68 L208 60 L211 62" fill="#6C3483" />
        {/* 额饰宝石 */}
        <circle cx="200" cy="66" r="3" fill="#C0392B" />
        <circle cx="200" cy="66" r="1.5" fill="#FF4444" opacity="0.9" />

        {/* 耳坠（两侧） */}
        <g transform="translate(162, 82)">
          <circle cx="0" cy="0" r="3" fill="#6C3483" stroke="#C0392B" strokeWidth="0.5" />
          <path d="M0,3 Q2,10 0,14" stroke="#C0392B" strokeWidth="1" fill="none" />
        </g>
        <g transform="translate(238, 82)">
          <circle cx="0" cy="0" r="3" fill="#6C3483" stroke="#C0392B" strokeWidth="0.5" />
          <path d="M0,3 Q-2,10 0,14" stroke="#C0392B" strokeWidth="1" fill="none" />
        </g>

        {/* 眼睛（金黄色竖瞳，FGO特征） */}
        <g>
          {/* 左眼 */}
          <ellipse cx="185" cy="94" rx="8" ry="10" fill="white" />
          {/* 虹膜（金） */}
          <ellipse cx="185" cy="94" rx="6.5" ry="9" fill="#DAA520" />
          {/* 竖瞳（矩形，FGO标志性） */}
          <rect x="183" y="89" width="4" height="10" rx="1.5" fill="#8B6914" />
          {/* 竖瞳高光 */}
          <circle cx="184.5" cy="92" r="2" fill="white" />
          <circle cx="182" cy="94" r="1" fill="white" opacity="0.7" />
          {/* 上眼睑（锐利） */}
          <path d="M176 86 Q185 82 194 86" stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* 下眼睑 */}
          <path d="M178 97 Q185 100 192 97" stroke="#E8D8C8" strokeWidth="1" fill="none" opacity="0.5" />
          {/* 睫毛（上，粗） */}
          <path d="M176 86 Q174 83 172 84" stroke="#1a1a2e" strokeWidth="1.2" fill="none" />
          <path d="M179 85 Q177 82 175 83" stroke="#1a1a2e" strokeWidth="1" fill="none" />
        </g>
        <g>
          {/* 右眼 */}
          <ellipse cx="215" cy="94" rx="8" ry="10" fill="white" />
          <ellipse cx="215" cy="94" rx="6.5" ry="9" fill="#DAA520" />
          <rect x="213" y="89" width="4" height="10" rx="1.5" fill="#8B6914" />
          <circle cx="214.5" cy="92" r="2" fill="white" />
          <circle cx="212" cy="94" r="1" fill="white" opacity="0.7" />
          <path d="M206 86 Q215 82 224 86" stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M208 97 Q215 100 222 97" stroke="#E8D8C8" strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M224 86 Q226 83 228 84" stroke="#1a1a2e" strokeWidth="1.2" fill="none" />
          <path d="M221 85 Q223 82 225 83" stroke="#1a1a2e" strokeWidth="1" fill="none" />
        </g>

        {/* 眉毛（锐利，傲慢感） */}
        <path d="M174 82 Q185 78 196 82" stroke="#8B6914" strokeWidth="1.8" fill="none" opacity="0.6" />
        <path d="M204 82 Q215 78 226 82" stroke="#8B6914" strokeWidth="1.8" fill="none" opacity="0.6" />

        {/* 嘴巴（嘴角微扬，高傲轻蔑） */}
        <path d="M192 104 Q200 110 208 104" stroke="#A0522D" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* 下唇（轻微阴影） */}
        <ellipse cx="200" cy="108" rx="4" ry="1.5" fill="#8B4513" opacity="0.3" />
      </g>

      {/* 暗色能量粒子（头部周围） */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <circle key={`dark-sparkle-${i}`} r={1.5 + (i % 2)} fill={`hsl(${280 + i * 15}, 70%, ${40 + i * 8}%)`} opacity="0.5">
          <animate attributeName="cx" values={`${185 + i * 12};${192 + i * 12}`} dur={`${2 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.4}s`} />
          <animate attributeName="cy" values={`${55 - i * 5};${50 - i * 5}`} dur={`${2 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.4}s`} />
          <animate attributeName="opacity" values="0.5;0;0.5" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.4}s`} />
        </circle>
      ))}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════╗
//  中央GNN核心（两指之间的知识之火）
// ════════════════════════════════════════════════════════════╝

function CentralGnnCore() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#F4D03F" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F4D03F" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* 外光晕 */}
      <circle cx="60" cy="60" r="55" fill="url(#coreGlow)" opacity="0.3">
        <animate attributeName="r" values="50;58;50" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.5;0.3" dur="3s" repeatCount="indefinite" />
      </circle>
      {/* 六边形核心 */}
      <g>
        <animateTransform attributeName="transform" type="rotate" values="0 60 60;360 60 60" dur="20s" repeatCount="indefinite" />
        <path d={hexPath(60, 60, 28)} fill="rgba(244,208,63,0.15)" stroke="#F4D03F" strokeWidth="1.5" />
        {/* 内部节点 */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const angle = (Math.PI / 3) * i;
          const x = 60 + 16 * Math.cos(angle);
          const y = 60 + 16 * Math.sin(angle);
          return <circle key={i} cx={x} cy={y} r="4" fill="#64b4ff" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
          </circle>;
        })}
        {/* 中心节点 */}
        <circle cx="60" cy="60" r="6" fill="#FF6B6B" opacity="0.9">
          <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
        </circle>
        {/* 连接线 */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const angle = (Math.PI / 3) * i;
          const x = 60 + 16 * Math.cos(angle);
          const y = 60 + 16 * Math.sin(angle);
          return <line key={i} x1="60" y1="60" x2={x} y2={y} stroke="#64b4ff" strokeWidth="0.8" opacity="0.4" />;
        })}
      </g>
      {/* 光点沿六边形边流动 */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <circle key={i} r="2" fill="#FFD700">
          <animateMotion path={`M${60 + 28 * Math.cos((Math.PI / 3) * i)} ${60 + 28 * Math.sin((Math.PI / 3) * i)} A28,28 0 0,1 ${60 + 28 * Math.cos((Math.PI / 3) * ((i + 1) % 6))} ${60 + 28 * Math.sin((Math.PI / 3) * ((i + 1) % 6))}`} dur="3s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
        </circle>
      ))}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════╗
//  主组件
// ════════════════════════════════════════════════════════════╝

export default function JoanLearningGNN() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [orbitalPhase, setOrbitalPhase] = useState(0);

  // 轨道动画计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setOrbitalPhase(p => p + 0.005);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // 统计节点总数（用于轨道分布）
  const totalNodes = Object.values(GNN_CATEGORIES).reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="w-full">
      {/* 场景容器 - 2:1 宽屏比例（创造亚当横构图） */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ paddingTop: '50%' /* 2:1 比例 */ }}
      >
        {/* ── 场景内容绝对定位 ── */}
        <div className="absolute inset-0">

          {/* 背景 - 透明（用户要求镂空） */}
          <div className="absolute inset-0" style={{ background: 'transparent' }} />

          {/* 暗色能量场（黑贞侧） */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 75% 50%, rgba(108,52,131,0.08) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />

          {/* 圣光场（白贞德侧） */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 25% 50%, rgba(255,215,0,0.06) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />

          {/* ===== 黑贞侧粒子 ===== */}
          <ParticlesCanvas side="black" />

          {/* ===== Ruler白贞德（左侧 - 亚当位置）===== */}
          <div className="absolute" style={{
            left: '2%',
            top: '5%',
            width: '46%',
            height: '90%',
            zIndex: 20,
          }}>
            <RulerJeanneSvg />
          </div>

          {/* ===== 中央GNN核心（两指之间）===== */}
          <div className="absolute" style={{
            left: 'calc(50% - 30px)',
            top: 'calc(50% - 30px)',
            width: '60px',
            height: '60px',
            zIndex: 25,
          }}>
            <CentralGnnCore />
          </div>

          {/* ===== Avenger黑贞（右侧 - 上帝位置）===== */}
          <div className="absolute" style={{
            right: '2%',
            top: '5%',
            width: '46%',
            height: '90%',
            zIndex: 20,
          }}>
            <AvengerJeanneSvg />
          </div>

          {/* ===== 白贞德侧粒子 ===== */}
          <ParticlesCanvas side="white" />

          {/* ===== GNN知识节点（SVG覆盖层）===== */}
          <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="nodeGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* 按类别渲染节点 */}
            {Object.entries(GNN_CATEGORIES).map(([catKey, cat]) => {
              const catIdx = Object.keys(GNN_CATEGORIES).indexOf(catKey);
              // 每类节点分布在不同轨道上
              const orbitRx = 280 + catIdx * 40;
              const orbitRy = 80 + catIdx * 20;
              return cat.items.map((_, itemIdx) => (
                <GnnNodeSvg
                  key={`${catKey}-${itemIdx}`}
                  catKey={catKey as CategoryKey}
                  idx={itemIdx}
                  total={cat.items.length}
                  orbitRx={orbitRx}
                  orbitRy={orbitRy}
                  phase={orbitalPhase + catIdx * 0.5}
                />
              ));
            })}
            {/* ═══ 节点间连线 + 流动光点粒子 ═══ */}
            {/* 同类别连接：金色GNN类别 */}
            <g className="connection-group">
              <line x1="300" y1="120" x2="380" y2="150" stroke="#F4D03F" strokeWidth="1.2" opacity="0.6" strokeDasharray="3,12">
                <animate attributeName="stroke-dashoffset" values="0;15" dur="1.5s" repeatCount="indefinite" />
              </line>
              <circle r="2.5" fill="#FFD700" opacity="0.9">
                <animateMotion path="M300,120 L380,150" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <line x1="380" y1="150" x2="440" y2="130" stroke="#F4D03F" strokeWidth="1.2" opacity="0.6" strokeDasharray="3,12">
                <animate attributeName="stroke-dashoffset" values="0;15" dur="1.8s" repeatCount="indefinite" />
              </line>
              <circle r="2.5" fill="#FFD700" opacity="0.9">
                <animateMotion path="M380,150 L440,130" dur="1.8s" repeatCount="indefinite" />
              </circle>
            </g>
            {/* 损失函数连接：蓝色 */}
            <g className="connection-group">
              <line x1="520" y1="170" x2="580" y2="190" stroke="#3498DB" strokeWidth="1.2" opacity="0.6" strokeDasharray="3,12">
                <animate attributeName="stroke-dashoffset" values="0;15" dur="1.6s" repeatCount="indefinite" />
              </line>
              <circle r="2.5" fill="#85C1E9" opacity="0.9">
                <animateMotion path="M520,170 L580,190" dur="1.6s" repeatCount="indefinite" />
              </circle>
              <line x1="580" y1="190" x2="640" y2="175" stroke="#3498DB" strokeWidth="1.2" opacity="0.6" strokeDasharray="3,12">
                <animate attributeName="stroke-dashoffset" values="0;15" dur="1.4s" repeatCount="indefinite" />
              </line>
              <circle r="2.5" fill="#85C1E9" opacity="0.9">
                <animateMotion path="M580,190 L640,175" dur="1.4s" repeatCount="indefinite" />
              </circle>
            </g>
            {/* 数据集连接：绿色 */}
            <g className="connection-group">
              <line x1="460" y1="280" x2="520" y2="300" stroke="#2ECC71" strokeWidth="1.2" opacity="0.6" strokeDasharray="3,12">
                <animate attributeName="stroke-dashoffset" values="0;15" dur="1.7s" repeatCount="indefinite" />
              </line>
              <circle r="2.5" fill="#82E0AA" opacity="0.9">
                <animateMotion path="M460,280 L520,300" dur="1.7s" repeatCount="indefinite" />
              </circle>
            </g>
            {/* 基础知识连接：紫色 */}
            <g className="connection-group">
              <line x1="400" y1="250" x2="460" y2="270" stroke="#9B59B6" strokeWidth="1.2" opacity="0.6" strokeDasharray="3,12">
                <animate attributeName="stroke-dashoffset" values="0;15" dur="1.3s" repeatCount="indefinite" />
              </line>
              <circle r="2.5" fill="#D2B4DE" opacity="0.9">
                <animateMotion path="M400,250 L460,270" dur="1.3s" repeatCount="indefinite" />
              </circle>
            </g>
            {/* 跨类别连接：白色虚线（知识传递） */}
            <g className="cross-category-lines">
              <line x1="440" y1="130" x2="520" y2="170" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" strokeDasharray="2,16" opacity="0.4">
                <animate attributeName="stroke-dashoffset" values="0;18" dur="2s" repeatCount="indefinite" />
              </line>
              <circle r="2" fill="rgba(255,255,255,0.7)">
                <animateMotion path="M440,130 L520,170" dur="2s" repeatCount="indefinite" />
              </circle>
              <line x1="520" y1="170" x2="460" y2="280" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" strokeDasharray="2,16" opacity="0.4">
                <animate attributeName="stroke-dashoffset" values="0;18" dur="2.2s" repeatCount="indefinite" />
              </line>
              <circle r="2" fill="rgba(255,255,255,0.7)">
                <animateMotion path="M520,170 L460,280" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <line x1="640" y1="175" x2="460" y2="270" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" strokeDasharray="2,16" opacity="0.4">
                <animate attributeName="stroke-dashoffset" values="0;18" dur="1.9s" repeatCount="indefinite" />
              </line>
              <circle r="2" fill="rgba(255,255,255,0.7)">
                <animateMotion path="M640,175 L460,270" dur="1.9s" repeatCount="indefinite" />
              </circle>
            </g>
          </svg>

        </div>
      </div>

      {/* CSS动画关键帧 */}
      <style>{`
        /* 知识节点浮动 */
        @keyframes nodeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .gnn-node-group:hover {
          filter: url(#nodeGlow) brightness(1.3) !important;
          transform: scale(1.15) !important;
          z-index: 50;
        }

        /* 减少动画（无障碍） */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
