import { useEffect, useRef, useState } from 'react';

/**
 * 学术贞德画廊 - 《创造亚当》式GNN学习动态场景
 * 零依赖 | 背景透明 | AI生成图片+CSS动画 | 响应式
 *
 * 场景布局（主提示词方案，不含辅助形态）：
 *  左侧 - Ruler白贞德（亚当位置，半躺斜卧）- AI生成图片
 *  右侧 - Avenger黑贞（上帝位置，悬浮，暗色能量光环）- AI生成图片
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
//  GNN核心（两指之间的知识之火）
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
          <div className="absolute ruler-jeanne-container" style={{
            left: '2%',
            top: '5%',
            width: '46%',
            height: '90%',
            zIndex: 20,
          }}>
            <img 
              src="/images/ruler-jeanne.png" 
              alt="Ruler Jeanne d'Arc" 
              className="w-full h-full object-contain ruler-jeanne-img"
              style={{ filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.3))' }}
            />
            {/* 白贞德光晕效果 */}
            <div className="absolute inset-0 ruler-jeanne-glow" style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
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
          <div className="absolute avenger-jeanne-container" style={{
            right: '2%',
            top: '5%',
            width: '46%',
            height: '90%',
            zIndex: 20,
          }}>
            <img 
              src="/images/avenger-jeanne.png" 
              alt="Avenger Jeanne d'Arc Alter" 
              className="w-full h-full object-contain avenger-jeanne-img"
              style={{ filter: 'drop-shadow(0 0 20px rgba(108,52,131,0.3))' }}
            />
            {/* 黑贞德暗能量光晕 */}
            <div className="absolute inset-0 avenger-jeanne-glow" style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(108,52,131,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
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
        /* 白贞德图片浮动动画 */
        .ruler-jeanne-img {
          animation: rulerFloat 6s ease-in-out infinite;
          transition: filter 0.3s ease;
        }
        .ruler-jeanne-container:hover .ruler-jeanne-img {
          filter: drop-shadow(0 0 30px rgba(255,215,0,0.5)) brightness(1.1) !important;
        }
        @keyframes rulerFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-6px) rotate(0.5deg); }
          50% { transform: translateY(-10px) rotate(0deg); }
          75% { transform: translateY(-6px) rotate(-0.5deg); }
        }
        
        /* 白贞德光晕脉冲 */
        .ruler-jeanne-glow {
          animation: rulerGlow 4s ease-in-out infinite;
        }
        @keyframes rulerGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        
        /* 黑贞德图片浮动动画 */
        .avenger-jeanne-img {
          animation: avengerFloat 5s ease-in-out infinite;
          transition: filter 0.3s ease;
        }
        .avenger-jeanne-container:hover .avenger-jeanne-img {
          filter: drop-shadow(0 0 30px rgba(108,52,131,0.5)) brightness(1.1) !important;
        }
        @keyframes avengerFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(-0.3deg); }
          50% { transform: translateY(-8px) rotate(0deg); }
          75% { transform: translateY(-4px) rotate(0.3deg); }
        }
        
        /* 黑贞德暗能量光晕脉冲 */
        .avenger-jeanne-glow {
          animation: avengerGlow 4s ease-in-out infinite;
        }
        @keyframes avengerGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
        
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
