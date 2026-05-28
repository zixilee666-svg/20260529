import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 学术贞德画廊 - 《创造亚当》式GNN学习动态场景
 * 零依赖 | 背景透明 | AI角色图+SVG知识节点+Canvas粒子 | 响应式
 *
 * 构图：
 *  左侧 - Ruler白贞德（亚当位，半躺斜卧伸手）- AI生成图片
 *  右侧 - Avenger黑贞（上帝位，悬浮伸手）- AI生成图片
 *  中央 - 两指间GNN核心
 *  环绕 - 精简GNN知识节点（12核心节点）
 */

// ════════════════════════════════════════════════════════════╗
//  精简GNN知识图谱数据（每类3个核心节点）
// ════════════════════════════════════════════════════════════╝

interface GnnNodeItem {
  id: string;
  label: string;
  sub: string;
  link: string;
  category: string;
  shape: 'hexagon' | 'circle' | 'square' | 'diamond';
  color: string;
  bg: string;
  border: string;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  size: number;
}

const ALL_NODES: GnnNodeItem[] = [
  // GNN模型（金色六边形）
  { id: 'gnn-0', label: 'GCN', sub: 'Graph Convolutional', link: '/knowledge-graph/gnn-types/gcn', category: 'gnn', shape: 'hexagon', color: '#F4D03F', bg: 'rgba(244,208,63,0.18)', border: '#F4D03F', orbitRadius: 260, orbitAngle: 0.2, orbitSpeed: 0.12, size: 16 },
  { id: 'gnn-1', label: 'GAT', sub: 'Graph Attention', link: '/knowledge-graph/gnn-types/gat', category: 'gnn', shape: 'hexagon', color: '#F4D03F', bg: 'rgba(244,208,63,0.18)', border: '#F4D03F', orbitRadius: 280, orbitAngle: 1.0, orbitSpeed: 0.10, size: 16 },
  { id: 'gnn-2', label: 'GraphSAGE', sub: 'Sample & Aggregate', link: '/knowledge-graph/gnn-types/graphsage', category: 'gnn', shape: 'hexagon', color: '#F4D03F', bg: 'rgba(244,208,63,0.18)', border: '#F4D03F', orbitRadius: 250, orbitAngle: 1.8, orbitSpeed: 0.14, size: 14 },
  // 损失函数（蓝色圆形）
  { id: 'loss-0', label: 'CrossEntropy', sub: '交叉熵损失', link: '/knowledge-graph/loss-functions/cross-entropy', category: 'loss', shape: 'circle', color: '#3498DB', bg: 'rgba(52,152,219,0.18)', border: '#3498DB', orbitRadius: 300, orbitAngle: 2.8, orbitSpeed: 0.11, size: 15 },
  { id: 'loss-1', label: 'Contrastive', sub: '对比损失', link: '/knowledge-graph/loss-functions/contrastive', category: 'loss', shape: 'circle', color: '#3498DB', bg: 'rgba(52,152,219,0.18)', border: '#3498DB', orbitRadius: 320, orbitAngle: 3.6, orbitSpeed: 0.13, size: 14 },
  { id: 'loss-2', label: 'Triplet', sub: '三元组损失', link: '/knowledge-graph/loss-functions/triplet', category: 'loss', shape: 'circle', color: '#3498DB', bg: 'rgba(52,152,219,0.18)', border: '#3498DB', orbitRadius: 290, orbitAngle: 4.4, orbitSpeed: 0.09, size: 13 },
  // 数据集（绿色方形）
  { id: 'data-0', label: 'Cora', sub: '2,708 nodes', link: '/knowledge-graph/datasets/cora', category: 'dataset', shape: 'square', color: '#2ECC71', bg: 'rgba(46,204,113,0.18)', border: '#2ECC71', orbitRadius: 270, orbitAngle: 5.2, orbitSpeed: 0.15, size: 16 },
  { id: 'data-1', label: 'PubMed', sub: '19,717 nodes', link: '/knowledge-graph/datasets/pubmed', category: 'dataset', shape: 'square', color: '#2ECC71', bg: 'rgba(46,204,113,0.18)', border: '#2ECC71', orbitRadius: 310, orbitAngle: 6.0, orbitSpeed: 0.08, size: 18 },
  { id: 'data-2', label: 'Reddit', sub: 'Large-scale', link: '/knowledge-graph/datasets/reddit', category: 'dataset', shape: 'square', color: '#2ECC71', bg: 'rgba(46,204,113,0.18)', border: '#2ECC71', orbitRadius: 290, orbitAngle: 0.8, orbitSpeed: 0.12, size: 17 },
  // 基础知识（紫色菱形）
  { id: 'base-0', label: 'Message Passing', sub: '消息传递', link: '/knowledge-graph/basics/message-passing', category: 'basics', shape: 'diamond', color: '#9B59B6', bg: 'rgba(155,89,182,0.18)', border: '#9B59B6', orbitRadius: 340, orbitAngle: 1.6, orbitSpeed: 0.10, size: 15 },
  { id: 'base-1', label: 'Attention', sub: '注意力机制', link: '/knowledge-graph/basics/attention-mechanism', category: 'basics', shape: 'diamond', color: '#9B59B6', bg: 'rgba(155,89,182,0.18)', border: '#9B59B6', orbitRadius: 330, orbitAngle: 3.0, orbitSpeed: 0.11, size: 14 },
  { id: 'base-2', label: 'Embedding', sub: '节点嵌入', link: '/knowledge-graph/basics/node-embedding', category: 'basics', shape: 'diamond', color: '#9B59B6', bg: 'rgba(155,89,182,0.18)', border: '#9B59B6', orbitRadius: 350, orbitAngle: 4.8, orbitSpeed: 0.13, size: 14 },
];

// ════════════════════════════════════════════════════════════╗
//  Canvas粒子系统
// ════════════════════════════════════════════════════════════╝

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'holy' | 'dark' | 'core';
}

function ParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnParticle = (type: 'holy' | 'dark' | 'core') => {
      const w = canvas.width;
      const h = canvas.height;
      let p: Particle;
      if (type === 'holy') {
        p = {
          x: w * 0.15 + Math.random() * 60,
          y: h * 0.5 + Math.random() * 80,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.4 - Math.random() * 0.8,
          life: 0,
          maxLife: 120 + Math.random() * 60,
          size: 1 + Math.random() * 2,
          color: `rgba(255,${215 + Math.random() * 40 | 0},${Math.random() * 80 | 0},`,
          type,
        };
      } else if (type === 'dark') {
        p = {
          x: w * 0.85 + Math.random() * 60,
          y: h * 0.3 + Math.random() * 80,
          vx: (Math.random() - 0.5) * 0.3,
          vy: 0.3 + Math.random() * 0.6,
          life: 0,
          maxLife: 120 + Math.random() * 60,
          size: 1 + Math.random() * 2.5,
          color: `rgba(${180 + Math.random() * 60 | 0},${Math.random() * 20 | 0},${Math.random() * 40 | 0},`,
          type,
        };
      } else {
        p = {
          x: w * 0.5 + (Math.random() - 0.5) * 50,
          y: h * 0.45 + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          life: 0,
          maxLife: 80 + Math.random() * 50,
          size: 1.5 + Math.random() * 2,
          color: `rgba(${200 + Math.random() * 55 | 0},${200 + Math.random() * 55 | 0},${255},`,
          type,
        };
      }
      particlesRef.current.push(p);
    };

    let frameCount = 0;
    const animate = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (frameCount % 4 === 0) spawnParticle('holy');
      if (frameCount % 4 === 0) spawnParticle('dark');
      if (frameCount % 6 === 0) spawnParticle('core');

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + alpha.toFixed(2) + ')';
        ctx.fill();

        if (p.size > 2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = p.color + (alpha * 0.12).toFixed(2) + ')';
          ctx.fill();
        }
        return true;
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
}

// ════════════════════════════════════════════════════════════╗
//  中央GNN核心
// ════════════════════════════════════════════════════════════╝

function CentralGnnCore() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <radialGradient id="coreGlow2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
          <stop offset="40%" stopColor="rgba(200,200,255,0.4)" />
          <stop offset="100%" stopColor="rgba(100,100,255,0)" />
        </radialGradient>
        <linearGradient id="coreLineGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#C0392B" />
          <stop offset="100%" stopColor="#9B59B6" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="45" fill="url(#coreGlow2)" className="core-pulse2" />

      <g className="core-rotate-slow2">
        <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="none" stroke="url(#coreLineGrad2)" strokeWidth="1.5" opacity="0.6" />
      </g>

      <g className="core-rotate-fast2">
        <polygon points="50,30 72,42 72,66 50,78 28,66 28,42" fill="none" stroke="url(#coreLineGrad2)" strokeWidth="1" opacity="0.4" />
      </g>

      <circle cx="50" cy="50" r="7" fill="url(#coreLineGrad2)" opacity="0.9" />
      <circle cx="50" cy="50" r="3" fill="white" opacity="0.8" />

      <g opacity="0.5">
        <line x1="50" y1="50" x2="50" y2="10" stroke="url(#coreLineGrad2)" strokeWidth="0.8" />
        <line x1="50" y1="50" x2="85" y2="30" stroke="url(#coreLineGrad2)" strokeWidth="0.8" />
        <line x1="50" y1="50" x2="85" y2="70" stroke="url(#coreLineGrad2)" strokeWidth="0.8" />
        <line x1="50" y1="50" x2="50" y2="90" stroke="url(#coreLineGrad2)" strokeWidth="0.8" />
        <line x1="50" y1="50" x2="15" y2="70" stroke="url(#coreLineGrad2)" strokeWidth="0.8" />
        <line x1="50" y1="50" x2="15" y2="30" stroke="url(#coreLineGrad2)" strokeWidth="0.8" />
      </g>

      <g className="core-vertex-glow2">
        <circle cx="50" cy="10" r="2.5" fill="#FFD700" />
        <circle cx="85" cy="30" r="2.5" fill="#C0392B" />
        <circle cx="85" cy="70" r="2.5" fill="#9B59B6" />
        <circle cx="50" cy="90" r="2.5" fill="#FFD700" />
        <circle cx="15" cy="70" r="2.5" fill="#C0392B" />
        <circle cx="15" cy="30" r="2.5" fill="#9B59B6" />
      </g>
    </svg>
  );
}

// ════════════════════════════════════════════════════════════╗
//  主组件
// ════════════════════════════════════════════════════════════╝

export default function JoanLearningGNN() {
  const [time, setTime] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const animRef = useRef<number>(0);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reducedMotion) return;
    let start = performance.now();
    const animate = (now: number) => {
      setTime(now - start);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [reducedMotion]);

  const handleNodeClick = useCallback((link: string) => {
    window.location.href = link;
  }, []);

  // 计算节点位置
  const getNodePos = (node: GnnNodeItem, t: number) => {
    const angle = node.orbitAngle + t * node.orbitSpeed * 0.001;
    const cx = 500;
    const cy = 320;
    return {
      x: cx + Math.cos(angle) * node.orbitRadius,
      y: cy + Math.sin(angle) * node.orbitRadius * 0.5,
    };
  };

  // 简化连线：同类节点只连相邻两个
  const getConnections = () => {
    const cats = ['gnn', 'loss', 'dataset', 'basics'];
    const lines: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];

    cats.forEach((cat) => {
      const catNodes = ALL_NODES.filter((n) => n.category === cat);
      for (let i = 0; i < catNodes.length - 1; i++) {
        const p1 = getNodePos(catNodes[i], time);
        const p2 = getNodePos(catNodes[i + 1], time);
        lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, color: catNodes[i].color });
      }
    });

    return lines;
  };

  return (
    <div
      className="joan-learning-gnn"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '650px',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* CSS动画 */}
      <style>{`
        @keyframes rulerFloat2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes avengerFloat2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes rulerGlow2 {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 15px rgba(255,215,0,0.3)); }
          50% { filter: brightness(1.1) drop-shadow(0 0 25px rgba(255,215,0,0.5)); }
        }
        @keyframes avengerGlow2 {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 15px rgba(192,57,43,0.3)); }
          50% { filter: brightness(1.1) drop-shadow(0 0 25px rgba(192,57,43,0.5)); }
        }
        @keyframes corePulse2 {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
        @keyframes coreRotateSlow2 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes coreRotateFast2 {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes vertexGlow2 {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes nodePulse2 {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .joan-learning-gnn .ruler-img {
          animation: rulerFloat2 6s ease-in-out infinite, rulerGlow2 4s ease-in-out infinite;
        }
        .joan-learning-gnn .avenger-img {
          animation: avengerFloat2 5s ease-in-out infinite, avengerGlow2 4s ease-in-out infinite;
        }
        .joan-learning-gnn .core-pulse2 {
          animation: corePulse2 2s ease-in-out infinite;
          transform-origin: center;
        }
        .joan-learning-gnn .core-rotate-slow2 {
          animation: coreRotateSlow2 10s linear infinite;
          transform-origin: 50px 50px;
        }
        .joan-learning-gnn .core-rotate-fast2 {
          animation: coreRotateFast2 6s linear infinite;
          transform-origin: 50px 50px;
        }
        .joan-learning-gnn .core-vertex-glow2 circle {
          animation: vertexGlow2 1.5s ease-in-out infinite alternate;
        }
        .joan-learning-gnn .gnn-node-item {
          animation: nodePulse2 3s ease-in-out infinite;
          animation-delay: var(--node-delay, 0s);
        }
        .joan-learning-gnn .gnn-node-item:hover {
          animation: none;
          transform: scale(1.25);
        }

        @media (prefers-reduced-motion: reduce) {
          .joan-learning-gnn * {
            animation: none !important;
          }
        }
      `}</style>

      {/* Canvas粒子层 */}
      <ParticlesCanvas />

      {/* AI角色图 - 左侧Ruler白贞德 */}
      <img
        src="/images/ruler-jeanne-v2.png"
        alt="Ruler Jeanne"
        className="ruler-img"
        style={{
          position: 'absolute',
          left: '2%',
          bottom: '5%',
          width: '300px',
          height: 'auto',
          maxHeight: '450px',
          objectFit: 'contain',
          zIndex: 20,
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
      />

      {/* AI角色图 - 右侧Avenger黑贞 */}
      <img
        src="/images/avenger-jeanne-v2.png"
        alt="Avenger Jeanne Alter"
        className="avenger-img"
        style={{
          position: 'absolute',
          right: '2%',
          top: '5%',
          width: '300px',
          height: 'auto',
          maxHeight: '450px',
          objectFit: 'contain',
          zIndex: 20,
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
      />

      {/* 中央GNN核心 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '45%',
          transform: 'translate(-50%, -50%)',
          width: '90px',
          height: '90px',
          zIndex: 25,
        }}
      >
        <CentralGnnCore />
      </div>

      {/* SVG知识节点层 */}
      <svg
        viewBox="0 0 1000 650"
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 15,
          pointerEvents: 'none',
        }}
      >
        {/* 简化连线 */}
        {getConnections().map((line, i) => (
          <line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.color}
            strokeWidth="1"
            opacity="0.35"
            strokeDasharray="4,4"
          />
        ))}

        {/* 节点 */}
        {ALL_NODES.map((node, idx) => {
          const pos = getNodePos(node, time);
          const isHovered = hoveredNode === node.id;
          const scale = isHovered ? 1.3 : 1;
          const pulseDelay = idx * 0.3;

          return (
            <g
              key={node.id}
              transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`}
              style={{
                cursor: 'pointer',
                pointerEvents: 'auto',
                transition: 'transform 0.25s ease',
                '--node-delay': `${pulseDelay}s`,
              } as React.CSSProperties}
              className="gnn-node-item"
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(node.link)}
            >
              {/* 发光外圈 */}
              <circle r={node.size + 5} fill={node.bg} opacity={isHovered ? 0.5 : 0.25} />

              {/* 形状 */}
              {node.shape === 'hexagon' && (
                <polygon
                  points={Array.from({ length: 6 }, (_, i) => {
                    const a = (Math.PI / 3) * i - Math.PI / 6;
                    return `${Math.cos(a) * node.size},${Math.sin(a) * node.size}`;
                  }).join(' ')}
                  fill={node.bg}
                  stroke={node.border}
                  strokeWidth="1.5"
                />
              )}
              {node.shape === 'circle' && (
                <circle r={node.size} fill={node.bg} stroke={node.border} strokeWidth="1.5" />
              )}
              {node.shape === 'square' && (
                <rect x={-node.size} y={-node.size} width={node.size * 2} height={node.size * 2} rx="3" fill={node.bg} stroke={node.border} strokeWidth="1.5" />
              )}
              {node.shape === 'diamond' && (
                <polygon points={`0,-${node.size} ${node.size},0 0,${node.size} -${node.size},0`} fill={node.bg} stroke={node.border} strokeWidth="1.5" />
              )}

              {/* 标签 */}
              <text
                y={node.size + 13}
                textAnchor="middle"
                fill={node.color}
                fontSize="8"
                fontWeight="600"
                style={{ pointerEvents: 'none' }}
              >
                {node.label}
              </text>

              {/* Tooltip */}
              {isHovered && (
                <g transform={`translate(0, ${-node.size - 28})`}>
                  <rect x="-48" y="-14" width="96" height="20" rx="4" fill="rgba(0,0,0,0.8)" />
                  <text y="0" textAnchor="middle" fill="white" fontSize="8">
                    {node.sub}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
