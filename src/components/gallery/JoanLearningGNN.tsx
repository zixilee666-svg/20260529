import { useEffect, useRef, useState } from 'react';

// ========================================
// JoanLearningGNN - Ruler贞德祈祷姿态 + 星球轨道知识系统
// 单人居中构图 · 椭圆轨道环绕 · 透明背景
// ========================================

const NODE_LINKS: Record<string, string> = {
  GCN: '/knowledge-graph/gnn-types/gcn',
  GAT: '/knowledge-graph/gnn-types/gat',
  GraphSAGE: '/knowledge-graph/gnn-types/graphsage',
  GIN: '/knowledge-graph/gnn-types/gin',
  'CrossEntropy': '/knowledge-graph/loss-functions/cross-entropy',
  Contrastive: '/knowledge-graph/loss-functions/contrastive',
  Triplet: '/knowledge-graph/loss-functions/triplet',
  Cora: '/knowledge-graph/datasets/cora',
  PubMed: '/knowledge-graph/datasets/pubmed',
  Reddit: '/knowledge-graph/datasets/reddit',
  'MessagePassing': '/knowledge-graph/basics/message-passing',
  Aggregation: '/knowledge-graph/basics/aggregation',
  Embedding: '/knowledge-graph/basics/node-embedding',
  Attention: '/knowledge-graph/basics/attention-mechanism',
  Spectral: '/knowledge-graph/basics/spectral-domain',
};

interface KnowledgeNode {
  id: string;
  label: string;
  labelCn?: string;
  type: 'gnn' | 'loss' | 'dataset' | 'basic';
  orbitIndex: number;      // 所属轨道（0=内圈, 1=中圈, 2=外圈）
  angleOffset: number;     // 初始角度偏移（度）
  speed: number;           // 公转速度倍率
}

// 知识节点数据 — 分布在3条椭圆轨道上
const KNOWLEDGE_NODES: KnowledgeNode[] = [
  // ===== 轨道0：内圈（紧贴角色，快速）=====
  { id: 'gnn1', label: 'GCN', type: 'gnn', orbitIndex: 0, angleOffset: 0, speed: 1.2 },
  { id: 'gnn2', label: 'GAT', type: 'gnn', orbitIndex: 0, angleOffset: 120, speed: 1.0 },
  { id: 'gnn3', label: 'GraphSAGE', type: 'gnn', orbitIndex: 0, angleOffset: 240, speed: 0.9 },

  // ===== 轨道1：中圈 =====
  { id: 'loss1', label: 'CrossEntropy', type: 'loss', orbitIndex: 1, angleOffset: 45, speed: 0.8 },
  { id: 'loss2', label: 'Contrastive', type: 'loss', orbitIndex: 1, angleOffset: 165, speed: 0.75 },
  { id: 'loss3', label: 'Triplet', type: 'loss', orbitIndex: 1, angleOffset: 285, speed: 0.7 },

  { id: 'ds1', label: 'Cora', type: 'dataset', orbitIndex: 1, angleOffset: 105, speed: 0.85 },
  { id: 'ds2', label: 'PubMed', type: 'dataset', orbitIndex: 1, angleOffset: 225, speed: 0.8 },

  // ===== 轨道2：外圈（最远，慢速）=====
  { id: 'basics1', label: 'MessagePassing', labelCn: '消息传递', type: 'basic', orbitIndex: 2, angleOffset: 15, speed: 0.5 },
  { id: 'basics2', label: 'Aggregation', labelCn: '聚合函数', type: 'basic', orbitIndex: 2, angleOffset: 87, speed: 0.55 },
  { id: 'basics3', label: 'Embedding', labelCn: '节点嵌入', type: 'basic', orbitIndex: 2, angleOffset: 159, speed: 0.5 },
  { id: 'basics4', label: 'Attention', labelCn: '注意力机制', type: 'basic', orbitIndex: 2, angleOffset: 231, speed: 0.45 },
  { id: 'basics5', label: 'Spectral', labelCn: '谱域方法', type: 'basic', orbitIndex: 2, angleOffset: 303, speed: 0.4 },
  { id: 'gnn4', label: 'GIN', type: 'gnn', orbitIndex: 2, angleOffset: 330, speed: 0.48 },
  { id: 'ds3', label: 'Reddit', type: 'dataset', orbitIndex: 2, angleOffset: 195, speed: 0.52 },
];

// 颜色配置
const TYPE_CONFIG = {
  gnn:    { fill: '#F4D03F', stroke: '#D4AC0D', glow: 'rgba(244,208,63,0.4)', text: '#4A4000', shape: 'hex' as const },
  loss:   { fill: '#3498DB', stroke: '#2980B9', glow: 'rgba(52,152,219,0.4)', text: '#FFF', shape: 'circle' as const },
  dataset:{ fill: '#2ECC71', stroke: '#27AE60', glow: 'rgba(46,204,113,0.4)', text: '#FFF', shape: 'rect' as const },
  basic:  { fill: '#9B59B6', stroke: '#8E44AD', glow: 'rgba(155,89,182,0.4)', text: '#FFF', shape: 'diamond' as const },
};

// 椭圆轨道参数 (相对于中心点)
const ORBITS = [
  { rx: 200, ry: 130 },   // 内圈
  { rx: 320, ry: 200 },   // 中圈
  { rx: 470, ry: 290 },   // 外圈
];

export default function JoanLearningGNN() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  // JS驱动轨道运动
  useEffect(() => {
    if (reducedMotion) return;
    const svg = svgRef.current;
    if (!svg) return;

    const nodeGroups = svg.querySelectorAll('[data-orbit-node]');
    const startTime = Date.now();

    let animId: number;
    function tick() {
      const elapsed = (Date.now() - startTime) / 1000; // 秒

      nodeGroups.forEach((g) => {
        const el = g as SVGGElement;
        const orbitIdx = parseInt(el.dataset.orbitIndex || '0');
        const offset = parseFloat(el.dataset.angleOffset || '0');
        const spd = parseFloat(el.dataset.speed || '1');

        const orbit = ORBITS[orbitIdx] || ORBITS[0];
        const angle = ((offset + elapsed * spd * 15) % 360) * (Math.PI / 180);

        const cx = 600 + orbit.rx * Math.cos(angle);
        const cy = 340 + orbit.ry * Math.sin(angle);

        el.setAttribute('transform', `translate(${cx}, ${cy})`);
      });

      animId = requestAnimationFrame(tick);
    }
    tick();

    return () => cancelAnimationFrame(animId);
  }, [reducedMotion]);

  // 渲染节点形状
  const renderNodeShape = (type: KnowledgeNode['type'], size: number) => {
    const config = TYPE_CONFIG[type];
    switch (config.shape) {
      case 'hex':
        return <polygon points={`0,-${size} ${size*0.866},-${size*0.5} ${size*0.866},${size*0.5} 0,${size} -${size*0.866},${size*0.5} -${size*0.866},-${size*0.5}`} />;
      case 'circle':
        return <circle r={size} />;
      case 'rect':
        return <rect x={-size} y={-size * 0.65} width={size * 2} height={size * 1.3} rx={5} />;
      case 'diamond':
        return <polygon points={`0,-${size} ${size},0 0,${size} -${size},0`} />;
    }
  };

  return (
    <div ref={containerRef} style={{
      position: 'relative',
      width: '100%',
      height: 700,
      background: 'transparent',
      overflow: 'visible',
    }}>
      <svg
        ref={svgRef}
        viewBox="0 0 1200 700"
        style={{ width: '100%', height: '100%' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* ===== 发光滤镜 ===== */}
          <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* ===== 角色渐变 ===== */}
          <linearGradient id="hair-gold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#DAA520" />
          </linearGradient>
          <linearGradient id="armor-silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5F5F5" />
            <stop offset="40%" stopColor="#E0E0E0" />
            <stop offset="80%" stopColor="#BEBEBE" />
            <stop offset="100%" stopColor="#A0A0A0" />
          </linearGradient>
          <linearGradient id="cape-purple" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9B59B6" />
            <stop offset="50%" stopColor="#7D3C98" />
            <stop offset="100%" stopColor="#5B2C6F" />
          </linearGradient>
          <linearGradient id="skin-tone" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE8D8" />
            <stop offset="100%" stopColor="#F0D5BE" />
          </linearGradient>
          <radialGradient id="holy-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,215,0,0.18)" stopOpacity="1" />
            <stop offset="50%" stopColor="rgba(255,215,0,0.08)" stopOpacity="1" />
            <stop offset="100%" stopColor="rgba(255,215,0,0)" stopOpacity="1" />
          </radialGradient>

          {/* ===== 圣光光晕动画渐变 ===== */}
          <radialGradient id="aura-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%">
              <animate attributeName="stop-color" values="#FFD700;#FFF8DC;#FFD700" dur="4s" repeatCount="indefinite" />
              <animate attributeName="stop-opacity" values="0.25;0.12;0.25" dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* ===== 节点发光滤镜映射 ===== */}
          <filter id="node-glow-gnn" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feFlood floodColor="#F4D03F" floodOpacity="0.5" result="c" />
            <feComposite in="c" in2="b" operator="in" result="d" />
            <feMerge><feMergeNode in="d" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="node-glow-loss" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feFlood floodColor="#3498DB" floodOpacity="0.45" result="c" />
            <feComposite in="c" in2="b" operator="in" result="d" />
            <feMerge><feMergeNode in="d" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="node-glow-dataset" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feFlood floodColor="#2ECC71" floodOpacity="0.45" result="c" />
            <feComposite in="c" in2="b" operator="in" result="d" />
            <feMerge><feMergeNode in="d" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="node-glow-basic" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feFlood floodColor="#9B59B6" floodOpacity="0.45" result="c" />
            <feComposite in="c" in2="b" operator="in" result="d" />
            <feMerge><feMergeNode in="d" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ======================================== */}
        {/* 第1层：圣光光晕背景（最底层）         */}
        {/* ======================================== */}
        <ellipse cx="600" cy="350" rx="180" ry="220" fill="url(#aura-glow)" />

        {/* ======================================== */}
        {/* 第2层：椭圆轨道线                      */}
        {/* ======================================== */}
        {ORBITS.map((orbit, i) => (
          <ellipse
            key={`orbit-${i}`}
            cx="600" cy="340"
            rx={orbit.rx}
            ry={orbit.ry}
            fill="none"
            stroke={['rgba(244,208,63,0.2)', 'rgba(52,152,219,0.15)', 'rgba(155,89,182,0.12)'][i]}
            strokeWidth={[1.5, 1, 0.8][i]}
            strokeDasharray={[null, '8 4', '4 6'][i] as unknown as undefined}
          />
        ))}

        {/* ======================================== */}
        {/* 第3层：Ruler贞德 SVG角色（居中）       */}
        {/* ======================================== */}
        <g id="ruler-jeanne-prayer" transform="translate(600, 370)">
          {/* 呼吸动画组 */}
          <g style={{ transformOrigin: 'center bottom' }}>
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1,1; 1.012,1.018; 1,1"
              dur="3.5s"
              repeatCount="indefinite"
            />

            {/* --- 披风（后层）--- */}
            <path
              d="M-95,10 Q-140,80 -120,170 Q-90,240 -30,230 Q20,215 30,150 Q35,85 95,10 Q110,-20 95,-45 Q60,-75 0,-70 Q-60,-75 -95,-45Z"
              fill="url(#cape-purple)"
              opacity="0.88"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-1.5 0 80; 1.5 0 80; -1.5 0 80"
                dur="5s"
                repeatCount="indefinite"
              />
            </path>
            {/* 披风内衬白色十字 */}
            <g opacity="0.7">
              <rect x="-14" y="60" width="28" height="38" rx="1" fill="none" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.5"/>
              <rect x="-3" y="48" width="6" height="62" rx="1" fill="none" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.5"/>
            </g>

            {/* --- 身体/铠甲 --- */}
            <path
              d="M-52,-55 L52,-55 L64,30 L42,115 L-42,115 L-64,30Z"
              fill="url(#armor-silver)"
              stroke="#999"
              strokeWidth="1"
            />

            {/* 铠甲中央装饰线 */}
            <line x1="0" y1="-55" x2="0" y2="112" stroke="#CCC" strokeWidth="1.5" opacity="0.6"/>
            {/* 胸甲高光 */}
            <path d="M-38,-35 Q0,-22 38,-35 L32,28 Q0,44 -32,28Z" fill="#F0EEF8" opacity="0.5"/>
            {/* 胸甲紫宝石 */}
            <circle cx="0" cy="-5" r="11" fill="#6B3FA0" stroke="#9B59B6" strokeWidth="2">
              <animate attributeName="opacity" values="0.85;1;0.85" dur="2.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="-2" cy="-8" r="3" fill="#E0D0FF" opacity="0.7"/>

            {/* 铠甲肩甲 */}
            <path d="M-56,-48 Q-72,-38 -68,-18 Q-58,-8 -50,-20Z" fill="url(#armor-silver)" stroke="#AAA" strokeWidth="1"/>
            <path d="M56,-48 Q72,-38 68,-18 Q58,-8 50,-20Z" fill="url(#armor-silver)" stroke="#AAA" strokeWidth="1"/>

            {/* 腰带 */}
            <rect x="-44" y="78" width="88" height="12" rx="3" fill="#5B3A6E" stroke="#7D4E96" strokeWidth="1"/>

            {/* --- 头部 --- */}
            <g transform="translate(0, -108)">
              {/* 脖子 */}
              <rect x="-14" y="25" width="28" height="26" rx="5" fill="url(#skin-tone)"/>

              {/* 脸型（FGO风格：稍长鹅蛋脸）*/}
              <ellipse cx="0" cy="-5" rx="40" ry="50" fill="url(#skin-tone)"/>

              {/* 刘海 */}
              <path d="M-36,-42 Q-20,-58 0,-54 Q20,-58 36,-42 Q30,-34 20,-38 Q10,-42 0,-40 Q-10,-42 -20,-38 Q-30,-34 -36,-42Z"
                    fill="url(#hair-gold)"/>
              {/* 刘海发丝细节 */}
              <path d="M-20,-46 Q-12,-54 -4,-48 M4,-48 Q12,-54 20,-46" stroke="#DAA520" strokeWidth="0.8" fill="none" opacity="0.6"/>

              {/* === 闭眼（祈祷表情）=== */}
              {/* 左眼 — 闭着，睫毛弧线 */}
              <path d="M-24,-8 Q-16,-4 -8,-8" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              {/* 右眼 — 闭着 */}
              <path d="M8,-8 Q16,-4 24,-8" stroke="#4A3728" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              {/* 睫毛 */}
              <path d="M-23,-9 Q-16,-13 -9,-9" stroke="#4A3728" strokeWidth="1" fill="none" opacity="0.5"/>
              <path d="M9,-9 Q16,-13 23,-9" stroke="#4A3728" strokeWidth="1" fill="none" opacity="0.5"/>

              {/* 眉毛（放松） */}
              <path d="M-28,-22 Q-16,-28 -6,-23" stroke="#B8977A" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M6,-23 Q16,-28 28,-22" stroke="#B8977A" strokeWidth="2" fill="none" strokeLinecap="round"/>

              {/* 鼻子 */}
              <path d="M0,-4 L1,10" stroke="#DDBBA8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              {/* 鼻尖高光 */}
              <circle cx="1.5" cy="10" r="1.5" fill="#F0D5BE" opacity="0.5"/>

              {/* 嘴唇（温柔微笑） */}
              <path d="M-10,22 Q0,28 10,21" stroke="#D4867A" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
              {/* 嘴唇下沿 */}
              <path d="M-7,25 Q0,29 7,24" stroke="#C47868" strokeWidth="1" fill="none" opacity="0.4"/>

              {/* 腮红 */}
              <ellipse cx="-22" cy="12" rx="10" ry="6" fill="#FFB6A3" opacity="0.25"/>
              <ellipse cx="22" cy="12" rx="10" ry="6" fill="#FFB6A3" opacity="0.25"/>
            </g>

            {/* --- 金色长发（两侧垂落）--- */}
            <g id="ruler-hair-main">
              {/* 左侧主辫 */}
              <path d="M-38,-145 Q-70,-120 -78,-70 Q-85,-20 -75,30 Q-68,70 -50,110 Q-40,135 -28,155
                        Q-20,165 -12,155 Q-18,130 -25,100 Q-35,60 -40,20 Q-45,-25 -38,-70 Q-32,-110 -38,-145Z"
                    fill="url(#hair-gold)" stroke="#DAA520" strokeWidth="0.8">
                <animateTransform attributeName="transform" type="rotate"
                  values="0 -45 0; 2.5 -45 0; 0 -45 0" dur="4s" repeatCount="indefinite"/>
              </path>
              {/* 左侧发丝纹理 */}
              <path d="M-55,0 Q-50,40 -40,90 M-65,-20 Q-58,20 -48,70" stroke="#DAA520" strokeWidth="0.6" fill="none" opacity="0.4"/>

              {/* 右侧主辫 */}
              <path d="M38,-145 Q70,-120 78,-70 Q85,-20 75,30 Q68,70 50,110 Q40,135 28,155
                        Q20,165 12,155 Q18,130 25,100 Q35,60 40,20 Q45,-25 38,-70 Q32,-110 38,-145Z"
                    fill="url(#hair-gold)" stroke="#DAA520" strokeWidth="0.8">
                <animateTransform attributeName="transform" type="rotate"
                  values="0 45 0; -2.5 45 0; 0 45 0" dur="4s" repeatCount="indefinite"/>
              </path>
              {/* 右侧发丝纹理 */}
              <path d="M55,0 Q50,40 40 90 M65,-20 Q58,20 48 70" stroke="#DAA520" strokeWidth="0.6" fill="none" opacity="0.4"/>

              {/* 后方长发 */}
              <path d="M0,-150 Q-15,-130 -18,-90 Q-20,-50 -10,0 Q0,30 -5,60 Q-10,90 0,110"
                    fill="none" stroke="url(#hair-gold)" strokeWidth="18" opacity="0.5" strokeLinecap="round"/>
              <path d="M0,-148 Q15,-128 18,-88 Q20,-48 10,0 Q0,30 5,60 Q10,90 0,108"
                    fill="none" stroke="url(#hair-gold)" strokeWidth="18" opacity="0.5" strokeLinecap="round"/>

              {/* 发尾黑色丝带 — 左 */}
              <g transform="translate(-20, 158)">
                <rect x="-10" y="-5" width="20" height="10" rx="2" fill="#1A1A2E">
                  <animateTransform attributeName="transform" type="rotate"
                    values="0; 8; 0" dur="3s" repeatCount="indefinite"/>
                </rect>
              </g>
              {/* 发尾黑色丝带 — 右 */}
              <g transform="translate(20, 158)">
                <rect x="-10" y="-5" width="20" height="10" rx="2" fill="#1A1A2E">
                  <animateTransform attributeName="transform" type="rotate"
                    values="0; -8; 0" dur="3s" repeatCount="indefinite"/>
                </rect>
              </g>
            </g>

            {/* --- 两手合十祈祷（核心姿态）--- */}
            <g id="prayer-hands" transform="translate(0, 45)">
              {/* 左臂 */}
              <path d="M-38,0 Q-52,-15 -48,-45 Q-44,-70 -28,-92 Q-18,-106 -6,-110"
                    fill="none" stroke="url(#armor-silver)" strokeWidth="18" strokeLinecap="round"/>
              <path d="M-38,0 Q-52,-15 -48,-45 Q-44,-70 -28,-92 Q-18,-106 -6,-110"
                    fill="none" stroke="#DDD" strokeWidth="14" strokeLinecap="round" opacity="0.3"/>

              {/* 右臂 */}
              <path d="M38,0 Q52,-15 48,-45 Q44,-70 28,-92 Q18,-106 6,-110"
                    fill="none" stroke="url(#armor-silver)" strokeWidth="18" strokeLinecap="round"/>
              <path d="M38,0 Q52,-15 48,-45 Q44,-70 28,-92 Q18,-106 6,-110"
                    fill="none" stroke="#DDD" strokeWidth="14" strokeLinecap="round" opacity="0.3"/>

              {/* 手掌合十主体 */}
              <ellipse cx="0" cy="-108" rx="16" ry="24" fill="url(#skin-tone)" stroke="#E8C4A8" strokeWidth="1"/>

              {/* 手指线条（合十细节） */}
              <line x1="0" y1="-130" x2="0" y2="-86" stroke="#E0B89A" strokeWidth="1.2" opacity="0.5"/>
              <line x1="-7" y1="-127" x2="-6" y2="-89" stroke="#E0B89A" strokeWidth="0.8" opacity="0.4"/>
              <line x1="7" y1="-127" x2="6" y2="-89" stroke="#E0B89A" strokeWidth="0.8" opacity="0.4"/>

              {/* 指尖微光（祈祷神圣感） */}
              <circle cx="0" cy="-131" r="3" fill="#FFD700" opacity="0.6">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite"/>
              </circle>
            </g>
          </g>
        </g>

        {/* ======================================== */}
        {/* 第4层：知识节点（轨道运动）             */}
        {/* ======================================== */}
        {KNOWLEDGE_NODES.map((node) => {
          const cfg = TYPE_CONFIG[node.type];
          const size = [20, 17, 15][node.orbitIndex]; // 内大外小
          const fontSize = [11, 10, 9][node.orbitIndex];
          const filterId = `node-glow-${node.type}`;

          // 计算静态位置（用于 reduced-motion 或初始渲染）
          const orbit = ORBITS[node.orbitIndex];
          const rad = (node.angleOffset * Math.PI) / 180;
          const staticX = 600 + orbit.rx * Math.cos(rad);
          const staticY = 340 + orbit.ry * Math.sin(rad);

          return (
            <g
              key={node.id}
              data-orbit-node
              data-orbit-index={node.orbitIndex}
              data-angle-offset={node.angleOffset}
              data-speed={node.speed}
              transform={`translate(${staticX}, ${staticY})`}
              className="knowledge-node-group"
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => {
                const link = NODE_LINKS[node.label];
                if (link) window.location.href = link;
              }}
              style={{ cursor: 'pointer' }}
            >
              {/* 节点发光底 */}
              <g filter={`url(#${filterId})`}>
                {renderNodeShape(node.type, size)}
              </g>
              {/* 节点本体（再画一次确保清晰度） */}
              <g>{renderNodeShape(node.type, size)}</g>
              {/* 描边 */}
              <g fill="none" stroke={cfg.stroke} strokeWidth="1.2">
                {renderNodeShape(node.type, size)}
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

              {/* Hover放大效果 */}
              <g style={{
                transform: hoveredNode === node.id ? 'scale(1.25)' : 'scale(1)',
                transformOrigin: 'center',
                transition: 'transform 0.25s ease',
                pointerEvents: 'none',
              }} />

              {/* Tooltip（hover时显示） */}
              {hoveredNode === node.id && (
                <g transform={`translate(0, ${-size - 18})`}>
                  <rect
                    x={-55} y="-16"
                    width={110} height="22"
                    rx="4"
                    fill="rgba(20,20,30,0.9)"
                    stroke={cfg.fill}
                    strokeWidth="1"
                  />
                  <text
                    textAnchor="middle"
                    y="0"
                    fill="white"
                    fontSize="10"
                    fontFamily="'Inter', sans-serif"
                  >
                    {node.labelCn ? `${node.labelCn} (${node.label})` : node.label}
                  </text>
                  {/* 小三角 */}
                  <polygon points="-5,6 5,6 0,12" fill="rgba(20,20,30,0.9)"/>
                </g>
              )}
            </g>
          );
        })}

        {/* ======================================== */}
        {/* 第5层：粒子效果                       */}
        {/* ======================================== */}
        {!reducedMotion && (
          <>
            {/* 金色圣光粒子（向上飘散）— 左侧区域 */}
            {[...Array(12)].map((_, i) => {
              const sx = 380 + Math.random() * 160;
              const sy = 420 + Math.random() * 120;
              const dur = 3 + Math.random() * 3;
              const delay = Math.random() * 4;
              return (
                <circle key={`gp-${i}`} cx={sx} cy={sy} r={1.5 + Math.random() * 1.5}
                  fill="#FFD700" opacity={0.4 + Math.random() * 0.4}>
                  <animate attributeName="cy" from={sy} to={sy - 100 - Math.random() * 80}
                    dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0;0.7;0" dur={`${dur}s`}
                    begin={`${delay}s`} repeatCount="indefinite"/>
                  <animate attributeName="cx" from={sx} to={sx + 20 + Math.random() * 30}
                    dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite"/>
                </circle>
              );
            })}
            {/* 金色圣光粒子（向上飘散）— 右侧区域 */}
            {[...Array(12)].map((_, i) => {
              const sx = 660 + Math.random() * 160;
              const sy = 420 + Math.random() * 120;
              const dur = 3 + Math.random() * 3;
              const delay = Math.random() * 4;
              return (
                <circle key={`gp-r-${i}`} cx={sx} cy={sy} r={1.5 + Math.random() * 1.5}
                  fill="#FFD700" opacity={0.4 + Math.random() * 0.4}>
                  <animate attributeName="cy" from={sy} to={sy - 100 - Math.random() * 80}
                    dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0;0.7;0" dur={`${dur}s`}
                    begin={`${delay}s`} repeatCount="indefinite"/>
                  <animate attributeName="cx" from={sx} to={sx - 20 - Math.random() * 30}
                    dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite"/>
                </circle>
              );
            })}
          </>
        )}

        {/* ======================================== */}
        {/* 第6层：指尖上方微光汇聚               */}
        {/* ======================================== */}
        <g transform="translate(600, 260)">
          <circle r="6" fill="#FFD700" opacity="0.5" filter="url(#glow-gold)">
            <animate attributeName="r" values="4;10;4" dur="2.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          {/* 汇聚光线 */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
            <line
              key={`ray-${angle}`}
              x1="0" y1="0"
              x2={Math.cos(angle * Math.PI / 180) * 35}
              y2={Math.sin(angle * Math.PI / 180) * 35}
              stroke="rgba(255,215,0,0.3)"
              strokeWidth="1"
              opacity="0">
              <animate attributeName="opacity" values="0;0.6;0" dur="2.5s"
                begin={`${angle * 0.007}s`} repeatCount="indefinite"/>
            </line>
          ))}
        </g>

        {/* 角色名称标签（悬浮时显示） */}
        <g transform="translate(600, 595)" opacity="0" style={{ transition: 'opacity 0.3s' }}
           onMouseEnter={() => { /* keep visible */ }}
           className="jeanne-label-group">
          <text textAnchor="middle" y="0" fill="#9B59B6" fontSize="14" fontWeight="bold"
                fontFamily="'Inter','Noto Sans SC',sans-serif" letterSpacing="3">
            RULER JEANNE D'ARC
          </text>
          <text textAnchor="middle" y="18" fill="#888" fontSize="11"
                fontFamily="'Noto Sans SC',sans-serif">
            圣女贞德 · 学术守护者
          </text>
        </g>
      </svg>

      {/* CSS 样式注入 */}
      <style>{`
        .knowledge-node-group {
          transition: filter 0.3s ease;
        }
        .knowledge-node-group:hover {
          filter: brightness(1.3);
        }
        @media (prefers-reduced-motion: reduce) {
          .knowledge-node-group,
          [data-orbit-node] {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
