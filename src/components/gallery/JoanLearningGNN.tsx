import { memo, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ========================================
// JoanLearningGNN - Ruler贞德祈祷姿态 + 星球轨道知识系统
// 单人居中构图 · 椭圆轨道环绕 · 透明背景 · FGO原形像精细重绘
// ========================================

const NODE_LINKS: Record<string, string> = {
  GCN: '/knowledge?topic=GCN',
  GAT: '/knowledge?topic=GAT',
  GraphSAGE: '/knowledge?topic=GraphSAGE',
  GIN: '/knowledge?topic=GIN',
  'CrossEntropy': '/knowledge?topic=CrossEntropy',
  Contrastive: '/knowledge?topic=ContrastiveLoss',
  Triplet: '/knowledge?topic=TripletLoss',
  Cora: '/knowledge?topic=CoraDataset',
  PubMed: '/knowledge?topic=PubMedDataset',
  Reddit: '/knowledge?topic=RedditDataset',
  'MessagePassing': '/knowledge?topic=MessagePassing',
  Aggregation: '/knowledge?topic=Aggregation',
  Embedding: '/knowledge?topic=NodeEmbedding',
  Attention: '/knowledge?topic=AttentionMechanism',
  Spectral: '/knowledge?topic=SpectralGraph',
};

interface KnowledgeNode {
  id: string;
  label: string;
  labelCn?: string;
  type: 'gnn' | 'loss' | 'dataset' | 'basic';
  orbitIndex: number;
  angleOffset: number;
  speed: number;
}

const KNOWLEDGE_NODES: KnowledgeNode[] = [
  // 轨道0：内圈（紧贴角色，快速）
  { id: 'gnn1', label: 'GCN', type: 'gnn', orbitIndex: 0, angleOffset: 0, speed: 1.2 },
  { id: 'gnn2', label: 'GAT', type: 'gnn', orbitIndex: 0, angleOffset: 120, speed: 1.0 },
  { id: 'gnn3', label: 'GraphSAGE', type: 'gnn', orbitIndex: 0, angleOffset: 240, speed: 0.9 },

  // 轨道1：中圈
  { id: 'loss1', label: 'CrossEntropy', type: 'loss', orbitIndex: 1, angleOffset: 45, speed: 0.8 },
  { id: 'loss2', label: 'Contrastive', type: 'loss', orbitIndex: 1, angleOffset: 165, speed: 0.75 },
  { id: 'loss3', label: 'Triplet', type: 'loss', orbitIndex: 1, angleOffset: 285, speed: 0.7 },
  { id: 'ds1', label: 'Cora', type: 'dataset', orbitIndex: 1, angleOffset: 105, speed: 0.85 },
  { id: 'ds2', label: 'PubMed', type: 'dataset', orbitIndex: 1, angleOffset: 225, speed: 0.8 },

  // 轨道2：外圈（最远，慢速）
  { id: 'basics1', label: 'MessagePassing', labelCn: '消息传递', type: 'basic', orbitIndex: 2, angleOffset: 15, speed: 0.5 },
  { id: 'basics2', label: 'Aggregation', labelCn: '聚合函数', type: 'basic', orbitIndex: 2, angleOffset: 87, speed: 0.55 },
  { id: 'basics3', label: 'Embedding', labelCn: '节点嵌入', type: 'basic', orbitIndex: 2, angleOffset: 159, speed: 0.5 },
  { id: 'basics4', label: 'Attention', labelCn: '注意力机制', type: 'basic', orbitIndex: 2, angleOffset: 231, speed: 0.45 },
  { id: 'basics5', label: 'Spectral', labelCn: '谱域方法', type: 'basic', orbitIndex: 2, angleOffset: 303, speed: 0.4 },
  { id: 'gnn4', label: 'GIN', type: 'gnn', orbitIndex: 2, angleOffset: 330, speed: 0.48 },
  { id: 'ds3', label: 'Reddit', type: 'dataset', orbitIndex: 2, angleOffset: 195, speed: 0.52 },
];

const TYPE_CONFIG = {
  gnn:    { fill: '#4DA6FF', stroke: '#2178C7', glow: 'rgba(77,166,255,0.5)', text: '#FFFFFF', shape: 'hex' as const },
  loss:   { fill: '#FF7F50', stroke: '#E55B3B', glow: 'rgba(255,127,80,0.5)', text: '#FFFFFF', shape: 'circle' as const },
  dataset:{ fill: '#00C9A7', stroke: '#01A084', glow: 'rgba(0,201,167,0.5)', text: '#FFFFFF', shape: 'rect' as const },
  basic:  { fill: '#A78BFA', stroke: '#8B5CF6', glow: 'rgba(167,139,250,0.5)', text: '#FFFFFF', shape: 'diamond' as const },
};

// 椭圆轨道参数 — 整体上移
const ORBITS = [
  { rx: 200, ry: 120 },   // 内圈
  { rx: 320, ry: 185 },   // 中圈
  { rx: 470, ry: 270 },   // 外圈
];

// 角色中心Y坐标（从370上移到260）
const CHAR_CENTER_Y = 260;
const ORBIT_CENTER_Y = 220;

// ========================================
// OrbitNode — React.memo 包裹，阻止 hover 状态变化时全体重渲染
// 仅被 hover 的单个节点会重渲染（显示 tooltip），其余节点不受影响
// ========================================
const OrbitNode = memo(
  function OrbitNode({
    node,
    size,
    fontSize,
    isHovered,
    onHover,
    onClick,
  }: {
    node: KnowledgeNode;
    size: number;
    fontSize: number;
    isHovered: boolean;
    onHover: (id: string | null) => void;
    onClick: () => void;
  }) {
    const cfg = TYPE_CONFIG[node.type];
    const filterId = `node-glow-${node.type}`;

    const renderShape = (t: KnowledgeNode['type'], s: number) => {
      switch (TYPE_CONFIG[t].shape) {
        case 'hex':
          return <polygon points={`0,-${s} ${s*0.866},-${s*0.5} ${s*0.866},${s*0.5} 0,${s} -${s*0.866},${s*0.5} -${s*0.866},-${s*0.5}`} />;
        case 'circle':
          return <circle r={s} />;
        case 'rect':
          return <rect x={-s} y={-s * 0.65} width={s * 2} height={s * 1.3} rx={5} />;
        case 'diamond':
          return <polygon points={`0,-${s} ${s},0 0,${s} -${s},0`} />;
      }
    };

    return (
      <g
        data-orbit-node
        data-orbit-index={node.orbitIndex}
        data-angle-offset={node.angleOffset}
        data-speed={node.speed}
        className="knowledge-node-group"
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      >
        <g className="node-visual">
          {/* 发光底层 */}
          <g filter={`url(#${filterId})`}>{renderShape(node.type, size)}</g>
          {/* 本体 */}
          <g>{renderShape(node.type, size)}</g>
          {/* 描边 */}
          <g fill="none" stroke={cfg.stroke} strokeWidth="1.8">
            {renderShape(node.type, size)}
          </g>
          {/* 文字标签 */}
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill={cfg.text}
            fontSize={fontSize}
            fontWeight="bold"
            fontFamily="'Inter', 'Noto Sans SC', sans-serif"
            pointerEvents="none"
            y={node.type === 'rect' ? 1 : 0}
          >
            {node.label.length > 10 ? node.labelCn || node.label : node.label}
          </text>
        </g>
        {/* Tooltip — 仅当前节点被 hover 时渲染 */}
        {isHovered && (
          <g transform={`translate(0, ${-size - 22})`}>
            <rect x={-65} y="-19" width={130} height="26" rx="5"
              fill="rgba(20,20,30,0.93)" stroke={cfg.fill} strokeWidth="1.2"/>
            <text textAnchor="middle" y="2" fill="white" fontSize="12"
              fontFamily="'Inter', sans-serif" fontWeight="500">
              {node.labelCn ? `${node.labelCn} (${node.label})` : node.label}
            </text>
            <polygon points="-5,8 5,8 0,15" fill="rgba(20,20,30,0.93)"/>
          </g>
        )}
      </g>
    );
  },
  // 自定义比较：仅当 isHovered 或 node.id 变化时才重渲染
  (prev, next) => prev.node.id === next.node.id && prev.isHovered === next.isHovered,
);

export default function JoanLearningGNN() {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  // 一次性设置节点初始位置（避免 React 控制 transform 导致 hover 跳动）
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const nodeGroups = svg.querySelectorAll('[data-orbit-node]');
    nodeGroups.forEach((g) => {
      const el = g as SVGGElement;
      // 避免覆盖动画已设置的位置
      if (el.getAttribute('data-init')) return;
      const orbitIdx = parseInt(el.dataset.orbitIndex || '0');
      const offset = parseFloat(el.dataset.angleOffset || '0');
      const orbit = ORBITS[orbitIdx] || ORBITS[0];
      const rad = (offset * Math.PI) / 180;
      const cx = 600 + orbit.rx * Math.cos(rad);
      const cy = ORBIT_CENTER_Y + orbit.ry * Math.sin(rad);
      el.setAttribute('transform', `translate(${cx}, ${cy})`);
      el.setAttribute('data-init', 'true');
    });
  }, []);

  // JS驱动轨道运动
  useEffect(() => {
    if (reducedMotion) return;
    const svg = svgRef.current;
    if (!svg) return;

    const nodeGroups = svg.querySelectorAll('[data-orbit-node]');
    const startTime = Date.now();

    let animId: number;
    function tick() {
      const elapsed = (Date.now() - startTime) / 1000;

      nodeGroups.forEach((g) => {
        const el = g as SVGGElement;
        const orbitIdx = parseInt(el.dataset.orbitIndex || '0');
        const offset = parseFloat(el.dataset.angleOffset || '0');
        const spd = parseFloat(el.dataset.speed || '1');

        const orbit = ORBITS[orbitIdx] || ORBITS[0];
        const angle = ((offset + elapsed * spd * 15) % 360) * (Math.PI / 180);

        const cx = 600 + orbit.rx * Math.cos(angle);
        const cy = ORBIT_CENTER_Y + orbit.ry * Math.sin(angle);

        el.setAttribute('transform', `translate(${cx}, ${cy})`);
      });

      animId = requestAnimationFrame(tick);
    }
    tick();

    return () => cancelAnimationFrame(animId);
  }, [reducedMotion]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 560,
      background: 'transparent',
      overflow: 'visible',
    }}>
      <svg
        ref={svgRef}
        viewBox="0 0 1200 560"
        style={{ width: '100%', height: '100%' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 发光滤镜 */}
          <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="holy-glow-filter" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="16" result="b" />
            <feFlood floodColor="#FFD700" floodOpacity="0.15" result="c" />
            <feComposite in="c" in2="b" operator="in" result="d" />
            <feMerge><feMergeNode in="d" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* ===== 渐变定义 ===== */}
          <linearGradient id="hair-gold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE570" />
            <stop offset="30%" stopColor="#FFDD38" />
            <stop offset="65%" stopColor="#E8B81A" />
            <stop offset="100%" stopColor="#C9960C" />
          </linearGradient>
          <linearGradient id="hair-highlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFF3B8" />
            <stop offset="50%" stopColor="#FFE066" />
            <stop offset="100%" stopColor="#DAA520" />
          </linearGradient>

          <linearGradient id="armor-main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FAFAFA" />
            <stop offset="25%" stopColor="#F0F0F0" />
            <stop offset="60%" stopColor="#E2E2E2" />
            <stop offset="100%" stopColor="#C8C8C8" />
          </linearGradient>
          <linearGradient id="armor-dark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D8D8D8" />
            <stop offset="100%" stopColor="#A8A8A8" />
          </linearGradient>
          <linearGradient id="armor-gold-trim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE55E" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#B8962E" />
          </linearGradient>

          <linearGradient id="cape-purple" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8E44AD" />
            <stop offset="40%" stopColor="#71368A" />
            <stop offset="100%" stopColor="#4A235A" />
          </linearGradient>
          <linearGradient id="cape-inner" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A569BD" />
            <stop offset="100%" stopColor="#6C3483" />
          </linearGradient>

          <linearGradient id="skin-tone" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFECD8" />
            <stop offset="60%" stopColor="#F5DEC0" />
            <stop offset="100%" stopColor="#EDCBA8" />
          </linearGradient>
          <linearGradient id="skin-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0D5BE" />
            <stop offset="100%" stopColor="#E0BCA0" />
          </linearGradient>

          <radialGradient id="holy-glow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="rgba(255,223,100,0.22)" />
            <stop offset="40%" stopColor="rgba(255,215,0,0.10)" />
            <stop offset="100%" stopColor="rgba(255,215,0,0)" />
          </radialGradient>

          <radialGradient id="aura-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%">
              <animate attributeName="stop-color" values="#FFD700;#FFECB3;#FFD700" dur="4s" repeatCount="indefinite" />
              <animate attributeName="stop-opacity" values="0.28;0.14;0.28" dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="cross-white" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E8E0F0" />
          </linearGradient>

          <linearGradient id="crown-gold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE566" />
            <stop offset="40%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#DAA520" />
          </linearGradient>
          <linearGradient id="gem-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9B59B6" />
            <stop offset="50%" stopColor="#7D3C98" />
            <stop offset="100%" stopColor="#5B2C6F" />
          </linearGradient>

          {/* 节点发光滤镜 */}
          <filter id="node-glow-gnn" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feFlood floodColor="#4DA6FF" floodOpacity="0.5" result="c" />
            <feComposite in="c" in2="b" operator="in" result="d" />
            <feMerge><feMergeNode in="d" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="node-glow-loss" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feFlood floodColor="#FF7F50" floodOpacity="0.5" result="c" />
            <feComposite in="c" in2="b" operator="in" result="d" />
            <feMerge><feMergeNode in="d" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="node-glow-dataset" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feFlood floodColor="#00C9A7" floodOpacity="0.5" result="c" />
            <feComposite in="c" in2="b" operator="in" result="d" />
            <feMerge><feMergeNode in="d" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="node-glow-basic" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feFlood floodColor="#A78BFA" floodOpacity="0.5" result="c" />
            <feComposite in="c" in2="b" operator="in" result="d" />
            <feMerge><feMergeNode in="d" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ════════ 第1层：圣光光晕背景 ════════ */}
        <ellipse cx="600" cy={CHAR_CENTER_Y - 20} rx="200" ry="240" fill="url(#aura-glow)" />

        {/* ════════ 第2层：椭圆轨道线 ════════ */}
        {ORBITS.map((orbit, i) => (
          <ellipse
            key={`orbit-${i}`}
            cx="600" cy={ORBIT_CENTER_Y}
            rx={orbit.rx}
            ry={orbit.ry}
            fill="none"
            stroke={['rgba(77,166,255,0.25)', 'rgba(255,127,80,0.18)', 'rgba(167,139,250,0.15)'][i]}
            strokeWidth={[1.5, 1, 0.8][i]}
            strokeDasharray={[null, '8 4', '4 6'][i] as unknown as undefined}
          />
        ))}

        {/* ======== 第3层：Q版贞德（chibi风格图像） ======== */}
        <g id="ruler-jeanne-prayer" transform={`translate(600, ${CHAR_CENTER_Y})`}>
          <image
            href="/images/jeanne_chibi.jpg"
            x={-95}
            y={-230}
            width={190}
            height={380}
            preserveAspectRatio="xMidYMid meet"
            style={{ filter: 'drop-shadow(0 0 30px rgba(200,180,140,0.35))' }}
          />
          <text textAnchor="middle" y={170} fill="#C9A04D" fontSize="11"
            fontWeight="bold" fontFamily="'Inter','Noto Sans SC',sans-serif"
            letterSpacing="4" opacity="0.7">
            RULER JEANNE D'ARC
          </text>
          <text textAnchor="middle" y={187} fill="#999" fontSize="10"
            fontFamily="'Noto Sans SC',sans-serif" opacity="0.5">
            圣女贞德 · 学术守护者
          </text>
        </g>

      </svg>

      {/* CSS样式注入 */}
      <style>{`
        .knowledge-node-group {
          transition: filter 0.3s ease;
        }
        .node-visual {
          transition: transform 0.25s ease, filter 0.3s ease;
          transform-origin: center;
        }
        .knowledge-node-group:hover .node-visual {
          transform: scale(1.15);
          filter: brightness(1.2) drop-shadow(0 0 12px rgba(255,215,0,0.5));
        }
        @media (prefers-reduced-motion: reduce) {
          .knowledge-node-group,
          [data-orbit-node] {
            animation: none !important;
            transition: none !important;
          }
          .node-visual {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
