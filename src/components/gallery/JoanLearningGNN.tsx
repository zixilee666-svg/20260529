import { useEffect, useRef } from 'react';

// ========================================
// JoanLearningGNN - 《创造亚当》式交互组件
// FGO贞德GIF嵌入 + 优化知识节点布局
// ========================================

const NODE_LINKS: Record<string, string> = {
  GCN: '/knowledge-graph/gnn-types/gcn',
  GAT: '/knowledge-graph/gnn-types/gat',
  GraphSAGE: '/knowledge-graph/gnn-types/graphsage',
  'CrossEntropy': '/knowledge-graph/loss-functions/cross-entropy',
  Contrastive: '/knowledge-graph/loss-functions/contrastive',
  Cora: '/knowledge-graph/datasets/cora',
  PubMed: '/knowledge-graph/datasets/pubmed',
  Reddit: '/knowledge-graph/datasets/reddit',
  'MessagePassing': '/knowledge-graph/basics/message-passing',
  Aggregation: '/knowledge-graph/basics/aggregation',
  Embedding: '/knowledge-graph/basics/node-embedding',
  Spectral: '/knowledge-graph/basics/spectral-domain',
  Spatial: '/knowledge-graph/basics/spatial-domain',
};

// 优化后的节点布局 - 大尺寸、均匀分布、环绕GIF
type NodeDef = { x: number; y: number; shape: 'hex' | 'circle' | 'rect' | 'diamond'; fill: string; filter: string; label: string };
const NODES: NodeDef[] = [
  // === 左侧群：GNN类别 (x:40-200, y:100-600) ===
  { x: 60, y: 140, shape: 'hex', fill: '#F4D03F', filter: 'glow-gold', label: 'GCN' },
  { x: 180, y: 240, shape: 'hex', fill: '#F4D03F', filter: 'glow-gold', label: 'GAT' },
  { x: 60, y: 520, shape: 'hex', fill: '#F4D03F', filter: 'glow-gold', label: 'GraphSAGE' },

  // === 上方群：基础知识 (x:250-850, y:80-150) ===
  { x: 320, y: 60, shape: 'diamond', fill: '#9B59B6', filter: 'glow-purple', label: 'MessagePassing' },
  { x: 530, y: 50, shape: 'diamond', fill: '#9B59B6', filter: 'glow-purple', label: 'Aggregation' },
  { x: 740, y: 60, shape: 'diamond', fill: '#9B59B6', filter: 'glow-purple', label: 'Embedding' },

  // === 右侧群：数据集 (x:900-1100, y:100-600) ===
  { x: 1050, y: 140, shape: 'rect', fill: '#2ECC71', filter: 'glow-green', label: 'Cora' },
  { x: 1100, y: 300, shape: 'rect', fill: '#2ECC71', filter: 'glow-green', label: 'PubMed' },
  { x: 1050, y: 520, shape: 'rect', fill: '#2ECC71', filter: 'glow-green', label: 'Reddit' },

  // === 下方群：损失函数 + 基础知识 (x:250-850, y:580-650) ===
  { x: 320, y: 640, shape: 'circle', fill: '#3498DB', filter: 'glow-blue', label: 'CrossEntropy' },
  { x: 530, y: 650, shape: 'circle', fill: '#3498DB', filter: 'glow-blue', label: 'Contrastive' },
  { x: 740, y: 640, shape: 'diamond', fill: '#9B59B6', filter: 'glow-purple', label: 'Spectral' },
  { x: 440, y: 640, shape: 'diamond', fill: '#9B59B6', filter: 'glow-purple', label: 'Spatial' },
  { x: 630, y: 640, shape: 'diamond', fill: '#9B59B6', filter: 'glow-purple', label: 'Spatial' },
];

export default function JoanLearningGNN() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const coreRef = useRef<SVGGElement>(null);

  // 生成粒子
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const layer = svg.querySelector('#particles-layer');
    if (!layer) return;
    while (layer.firstChild) layer.removeChild(layer.firstChild);

    const ns = 'http://www.w3.org/2000/svg';

    // 金色粒子(左侧)
    for (let i = 0; i < 14; i++) {
      const c = document.createElementNS(ns, 'circle');
      const r = 1.5 + Math.random() * 2;
      c.setAttribute('r', String(r));
      c.setAttribute('fill', i % 3 === 0 ? '#FFD700' : '#FFF8DC');
      const sx = 80 + Math.random() * 350;
      const sy = 150 + Math.random() * 400;
      c.setAttribute('cx', String(sx));
      c.setAttribute('cy', String(sy));

      const a1 = document.createElementNS(ns, 'animate');
      a1.setAttribute('attributeName', 'cy');
      a1.setAttribute('values', `${sy};${sy - 50 - Math.random() * 60}`);
      a1.setAttribute('dur', `${3 + Math.random() * 3}s`);
      a1.setAttribute('repeatCount', 'indefinite');
      c.appendChild(a1);

      const a2 = document.createElementNS(ns, 'animate');
      a2.setAttribute('attributeName', 'opacity');
      a2.setAttribute('values', '0.7;0;0.7');
      a2.setAttribute('dur', `${3 + Math.random() * 3}s`);
      a2.setAttribute('repeatCount', 'indefinite');
      c.appendChild(a2);

      layer.appendChild(c);
    }

    // 暗红粒子(右侧)
    for (let i = 0; i < 14; i++) {
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('r', String(1.5 + Math.random() * 2));
      c.setAttribute('fill', i % 3 === 0 ? '#C0392B' : '#FF6347');
      const sx = 770 + Math.random() * 350;
      const sy = 150 + Math.random() * 400;
      c.setAttribute('cx', String(sx));
      c.setAttribute('cy', String(sy));

      const a1 = document.createElementNS(ns, 'animate');
      a1.setAttribute('attributeName', 'cy');
      a1.setAttribute('values', `${sy};${sy + 50 + Math.random() * 60}`);
      a1.setAttribute('dur', `${3 + Math.random() * 3}s`);
      a1.setAttribute('repeatCount', 'indefinite');
      c.appendChild(a1);

      const a2 = document.createElementNS(ns, 'animate');
      a2.setAttribute('attributeName', 'opacity');
      a2.setAttribute('values', '0.7;0;0.7');
      a2.setAttribute('dur', `${3 + Math.random() * 3}s`);
      a2.setAttribute('repeatCount', 'indefinite');
      c.appendChild(a2);

      layer.appendChild(c);
    }
  }, []);

  // 节点交互
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const nodes = svg.querySelectorAll('.knode');
    const tooltipGroup = svg.querySelector('#tooltip-layer');
    const ns = 'http://www.w3.org/2000/svg';

    const handleEnter = (e: Event) => {
      const node = e.currentTarget as SVGGElement;
      const label = node.getAttribute('data-label') || '';
      if (!label || !tooltipGroup) return;
      const bbox = node.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      const tx = bbox.left - svgRect.left + bbox.width / 2;
      const ty = bbox.top - svgRect.top - 18;

      const g = document.createElementNS(ns, 'g');
      g.id = 'active-tip';
      const r = document.createElementNS(ns, 'rect');
      const tw = label.length * 8 + 20;
      r.setAttribute('x', String(-tw / 2));
      r.setAttribute('y', '-24');
      r.setAttribute('width', String(tw));
      r.setAttribute('height', '22');
      r.setAttribute('rx', '6');
      r.setAttribute('fill', 'rgba(10,10,30,0.92)');
      r.setAttribute('stroke', 'rgba(255,215,0,0.5)');
      r.setAttribute('stroke-width', '1');
      g.appendChild(r);

      const t = document.createElementNS(ns, 'text');
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('y', '-8');
      t.setAttribute('fill', '#FFD700');
      t.setAttribute('font-size', '13');
      t.setAttribute('font-weight', 'bold');
      t.textContent = label;
      g.appendChild(t);

      g.setAttribute('transform', `translate(${tx},${ty})`);
      tooltipGroup.appendChild(g);

      node.setAttribute('filter', 'url(#glow-bright)');
    };

    const handleLeave = (e: Event) => {
      const node = e.currentTarget as SVGGElement;
      const tip = svg.querySelector('#active-tip');
      if (tip) tip.remove();
      const df = node.getAttribute('data-filter');
      node.setAttribute('filter', df ? `url(#${df})` : '');
    };

    const handleClick = (e: Event) => {
      const label = (e.currentTarget as SVGGElement).getAttribute('data-label');
      if (label && NODE_LINKS[label]) {
        window.location.href = NODE_LINKS[label];
      }
    };

    nodes.forEach((n) => {
      n.addEventListener('mouseenter', handleEnter);
      n.addEventListener('mouseleave', handleLeave);
      n.addEventListener('click', handleClick);
    });
    return () => {
      nodes.forEach((n) => {
        n.removeEventListener('mouseenter', handleEnter);
        n.removeEventListener('mouseleave', handleLeave);
        n.removeEventListener('click', handleClick);
      });
    };
  }, []);

  // GNN核心旋转动画
  useEffect(() => {
    const core = coreRef.current;
    if (!core) return;
    let angle = 0;
    const animate = () => {
      angle += 0.3;
      const outer = core.querySelector('#gnn-outer');
      const inner = core.querySelector('#gnn-inner');
      if (outer) outer.setAttribute('transform', `rotate(${angle}, 0, 0)`);
      if (inner) inner.setAttribute('transform', `rotate(${-angle * 1.3}, 0, 0)`);
      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '700px',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      <svg
        ref={svgRef}
        id="main-svg"
        viewBox="0 0 1200 700"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {/* ========== 1. 滤镜和渐变 ========== */}
        <defs>
          <filter id="glow-gold"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="glow-red"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="glow-blue"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="glow-green"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="glow-purple"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="glow-bright"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>

          <radialGradient id="core-grad">
            <stop offset="0%" stopColor="#FFD700"/>
            <stop offset="40%" stopColor="#FF8C00"/>
            <stop offset="100%" stopColor="#C0392B" stopOpacity="0.3"/>
          </radialGradient>
        </defs>

        {/* ========== 2. 粒子层 ========== */}
        <g id="particles-layer"/>

        {/* ========== 3. 连线层 ========== */}
        <g id="connections-layer">
          {/* 左侧节点 → GIF中心 */}
          <line x1="60" y1="140" x2="380" y2="350" stroke="rgba(244,208,63,0.4)" strokeWidth="1.5" strokeDasharray="6,6">
            <animate attributeName="stroke-dashoffset" values="0;-24" dur="2s" repeatCount="indefinite"/>
          </line>
          <line x1="180" y1="240" x2="380" y2="380" stroke="rgba(244,208,63,0.4)" strokeWidth="1.5" strokeDasharray="6,6">
            <animate attributeName="stroke-dashoffset" values="0;-24" dur="2.5s" repeatCount="indefinite"/>
          </line>
          <line x1="60" y1="520" x2="400" y2="420" stroke="rgba(244,208,63,0.4)" strokeWidth="1.5" strokeDasharray="6,6">
            <animate attributeName="stroke-dashoffset" values="0;-24" dur="2.2s" repeatCount="indefinite"/>
          </line>

          {/* 右侧节点 → GIF中心 */}
          <line x1="1050" y1="140" x2="820" y2="350" stroke="rgba(46,204,113,0.4)" strokeWidth="1.5" strokeDasharray="6,6">
            <animate attributeName="stroke-dashoffset" values="0;24" dur="2s" repeatCount="indefinite"/>
          </line>
          <line x1="1100" y1="300" x2="820" y2="370" stroke="rgba(46,204,113,0.4)" strokeWidth="1.5" strokeDasharray="6,6">
            <animate attributeName="stroke-dashoffset" values="0;24" dur="2.3s" repeatCount="indefinite"/>
          </line>
          <line x1="1050" y1="520" x2="810" y2="420" stroke="rgba(46,204,113,0.4)" strokeWidth="1.5" strokeDasharray="6,6">
            <animate attributeName="stroke-dashoffset" values="0;24" dur="2.8s" repeatCount="indefinite"/>
          </line>

          {/* 上方节点 → GNN核心 */}
          <line x1="320" y1="60" x2="530" y2="320" stroke="rgba(155,89,182,0.35)" strokeWidth="1.5" strokeDasharray="6,6">
            <animate attributeName="stroke-dashoffset" values="0;-24" dur="3s" repeatCount="indefinite"/>
          </line>
          <line x1="530" y1="50" x2="600" y2="300" stroke="rgba(155,89,182,0.35)" strokeWidth="1.5" strokeDasharray="6,6">
            <animate attributeName="stroke-dashoffset" values="0;-24" dur="2.7s" repeatCount="indefinite"/>
          </line>
          <line x1="740" y1="60" x2="670" y2="320" stroke="rgba(155,89,182,0.35)" strokeWidth="1.5" strokeDasharray="6,6">
            <animate attributeName="stroke-dashoffset" values="0;-24" dur="3.3s" repeatCount="indefinite"/>
          </line>

          {/* 下方节点 → GNN核心 */}
          <line x1="320" y1="640" x2="520" y2="410" stroke="rgba(52,152,219,0.4)" strokeWidth="1.5" strokeDasharray="6,6">
            <animate attributeName="stroke-dashoffset" values="0;24" dur="2.5s" repeatCount="indefinite"/>
          </line>
          <line x1="530" y1="650" x2="600" y2="410" stroke="rgba(52,152,219,0.4)" strokeWidth="1.5" strokeDasharray="6,6">
            <animate attributeName="stroke-dashoffset" values="0;24" dur="2.8s" repeatCount="indefinite"/>
          </line>

          {/* CGI连接两主角方向 */}
          <line x1="450" y1="350" x2="600" y2="350" stroke="rgba(255,215,0,0.5)" strokeWidth="2">
            <animate attributeName="stroke-width" values="2;3;2" dur="2s" repeatCount="indefinite"/>
          </line>
          <line x1="750" y1="350" x2="600" y2="350" stroke="rgba(192,57,43,0.5)" strokeWidth="2">
            <animate attributeName="stroke-width" values="2;3;2" dur="2s" repeatCount="indefinite"/>
          </line>
        </g>

        {/* ========== 4. GNN核心 (中央) ========== */}
        <g id="gnn-core" ref={coreRef} transform="translate(600, 350)">
          <g id="gnn-outer">
            <polygon points="0,-55 48,-28 48,28 0,55 -48,28 -48,-28" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.7"/>
          </g>
          <g id="gnn-inner">
            <polygon points="0,-33 29,-16 29,16 0,33 -29,16 -29,-16" fill="none" stroke="#C0392B" strokeWidth="1.5" opacity="0.5"/>
          </g>
          <circle r="14" fill="url(#core-grad)" filter="url(#glow-gold)">
            <animate attributeName="r" values="14;18;14" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
          </circle>
          {[
            [0,-55], [48,-28], [48,28], [0,55], [-48,28], [-48,-28]
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="5" fill={i >= 4 ? '#C0392B' : '#FFD700'}>
              <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin={`${i * 0.2}s`} repeatCount="indefinite"/>
            </circle>
          ))}
        </g>

        {/* ========== 5. 知识节点层 ========== */}
        <g id="knowledge-nodes-layer">
          {NODES.map((node, i) => (
            <g
              key={i}
              className="knode"
              data-label={node.label}
              data-filter={node.filter}
              transform={`translate(${node.x}, ${node.y})`}
              style={{ cursor: 'pointer' }}
            >
              {node.shape === 'hex' && (
                <polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" fill={node.fill} filter={`url(#${node.filter})`}>
                  <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin={`${i * 0.15}s`} repeatCount="indefinite"/>
                </polygon>
              )}
              {node.shape === 'circle' && (
                <circle r="28" fill={node.fill} filter={`url(#${node.filter})`}>
                  <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin={`${i * 0.15}s`} repeatCount="indefinite"/>
                </circle>
              )}
              {node.shape === 'rect' && (
                <rect x="-32" y="-20" width="64" height="40" rx="5" fill={node.fill} filter={`url(#${node.filter})`}>
                  <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin={`${i * 0.15}s`} repeatCount="indefinite"/>
                </rect>
              )}
              {node.shape === 'diamond' && (
                <polygon points="0,-28 28,0 0,28 -28,0" fill={node.fill} filter={`url(#${node.filter})`}>
                  <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin={`${i * 0.15}s`} repeatCount="indefinite"/>
                </polygon>
              )}
              <text
                textAnchor="middle"
                y="5"
                fill={['hex', 'diamond'].includes(node.shape) ? '#1A1A2E' : '#FFFFFF'}
                fontSize={node.label.length > 10 ? 11 : 13}
                fontWeight="bold"
              >
                {node.label}
              </text>
            </g>
          ))}
        </g>

        {/* ========== 6. Tooltip层 ========== */}
        <g id="tooltip-layer"/>
      </svg>

      {/* ========== 7. GIF角色层 (HTML overlay) ========== */}
      <img
        src="/images/jeanne-duo.gif"
        alt="Jeanne d'Arc FGO - Creation of Adam"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '620px',
          height: 'auto',
          background: 'transparent',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />

      {/* ========== 8. CSS补充 ========== */}
      <style>{`
        @keyframes float-gif {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-6px); }
        }
        img[alt="Jeanne d'Arc FGO - Creation of Adam"] {
          animation: float-gif 5s ease-in-out infinite;
          filter: drop-shadow(0 0 20px rgba(255,215,0,0.3));
        }
        .knode {
          transition: transform 0.3s ease;
        }
        .knode:hover {
          transform: scale(1.2);
        }
        #jeanne-gnn-container {
          --bg: transparent;
        }
        @media (prefers-reduced-motion: reduce) {
          img[alt="Jeanne d'Arc FGO - Creation of Adam"],
          .knode {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
