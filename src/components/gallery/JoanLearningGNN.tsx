import { motion } from 'framer-motion';

/**
 * Q版贞德学习图神经网络 动态SVG组件
 * 纯SVG+CSS动画，无外部依赖
 */
export default function JoanLearningGNN() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg
        viewBox="0 0 400 320"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 渐变定义 */}
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F4D03F" />
            <stop offset="100%" stopColor="#D4AC0D" />
          </linearGradient>
          <linearGradient id="dressGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5B8DB8" />
            <stop offset="100%" stopColor="#3D5A80" />
          </linearGradient>
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFEFD5" />
            <stop offset="100%" stopColor="#FFDAB9" />
          </linearGradient>
          <radialGradient id="glowNode1">
            <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0.3" />
          </radialGradient>
          <radialGradient id="glowNode2">
            <stop offset="0%" stopColor="#4ECDC4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#4ECDC4" stopOpacity="0.3" />
          </radialGradient>
          <radialGradient id="glowNode3">
            <stop offset="0%" stopColor="#45B7D1" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#45B7D1" stopOpacity="0.3" />
          </radialGradient>
          <radialGradient id="glowNode4">
            <stop offset="0%" stopColor="#96CEB4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#96CEB4" stopOpacity="0.3" />
          </radialGradient>
          <radialGradient id="glowNode5">
            <stop offset="0%" stopColor="#FFEAA7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFEAA7" stopOpacity="0.3" />
          </radialGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 背景桌面 */}
        <ellipse cx="200" cy="295" rx="160" ry="18" fill="#E8DCC8" opacity="0.6" />
        <rect x="60" y="280" width="280" height="8" rx="4" fill="#D4C4A8" opacity="0.5" />

        {/* === GNN图网络层（在贞德身后）=== */}
        <g className="gnn-graph">
          {/* 边 - 连线 */}
          <line x1="130" y1="80" x2="180" y2="110" stroke="#B8C5D6" strokeWidth="2" opacity="0.6" />
          <line x1="180" y1="110" x2="240" y2="90" stroke="#B8C5D6" strokeWidth="2" opacity="0.6" />
          <line x1="240" y1="90" x2="290" y2="130" stroke="#B8C5D6" strokeWidth="2" opacity="0.6" />
          <line x1="180" y1="110" x2="220" y2="150" stroke="#B8C5D6" strokeWidth="2" opacity="0.6" />
          <line x1="130" y1="80" x2="160" y2="140" stroke="#B8C5D6" strokeWidth="2" opacity="0.6" />
          <line x1="160" y1="140" x2="220" y2="150" stroke="#B8C5D6" strokeWidth="2" opacity="0.6" />
          <line x1="220" y1="150" x2="290" y2="130" stroke="#B8C5D6" strokeWidth="2" opacity="0.6" />
          <line x1="240" y1="90" x2="220" y2="150" stroke="#B8C5D6" strokeWidth="2" opacity="0.6" />

          {/* 消息传递光点 - 沿着边移动 */}
          <circle r="4" fill="#FFD700" filter="url(#softGlow)">
            <animateMotion path="M130,80 L180,110" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle r="4" fill="#FF6B6B" filter="url(#softGlow)">
            <animateMotion path="M180,110 L240,90" dur="2.5s" repeatCount="indefinite" begin="0.3s" />
          </circle>
          <circle r="4" fill="#4ECDC4" filter="url(#softGlow)">
            <animateMotion path="M240,90 L290,130" dur="2.2s" repeatCount="indefinite" begin="0.6s" />
          </circle>
          <circle r="4" fill="#45B7D1" filter="url(#softGlow)">
            <animateMotion path="M160,140 L220,150" dur="1.8s" repeatCount="indefinite" begin="0.9s" />
          </circle>
          <circle r="4" fill="#96CEB4" filter="url(#softGlow)">
            <animateMotion path="M220,150 L290,130" dur="2.3s" repeatCount="indefinite" begin="1.2s" />
          </circle>
          <circle r="4" fill="#FFEAA7" filter="url(#softGlow)">
            <animateMotion path="M130,80 L160,140" dur="2.7s" repeatCount="indefinite" begin="0.5s" />
          </circle>
          <circle r="4" fill="#DDA0DD" filter="url(#softGlow)">
            <animateMotion path="M240,90 L220,150" dur="2s" repeatCount="indefinite" begin="1.5s" />
          </circle>

          {/* 节点 */}
          <g className="node-pulse">
            <circle cx="130" cy="80" r="14" fill="url(#glowNode1)" filter="url(#softGlow)">
              <animate attributeName="r" values="14;16;14" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.6;0.9" dur="3s" repeatCount="indefinite" />
            </circle>
            <text x="130" y="84" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">h₁</text>
          </g>
          <g className="node-pulse">
            <circle cx="180" cy="110" r="14" fill="url(#glowNode2)" filter="url(#softGlow)">
              <animate attributeName="r" values="14;16;14" dur="3s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            <text x="180" y="114" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">h₂</text>
          </g>
          <g className="node-pulse">
            <circle cx="240" cy="90" r="14" fill="url(#glowNode3)" filter="url(#softGlow)">
              <animate attributeName="r" values="14;16;14" dur="3s" repeatCount="indefinite" begin="1s" />
            </circle>
            <text x="240" y="94" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">h₃</text>
          </g>
          <g className="node-pulse">
            <circle cx="290" cy="130" r="14" fill="url(#glowNode4)" filter="url(#softGlow)">
              <animate attributeName="r" values="14;16;14" dur="3s" repeatCount="indefinite" begin="1.5s" />
            </circle>
            <text x="290" y="134" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">h₄</text>
          </g>
          <g className="node-pulse">
            <circle cx="160" cy="140" r="12" fill="url(#glowNode5)" filter="url(#softGlow)">
              <animate attributeName="r" values="12;14;12" dur="3s" repeatCount="indefinite" begin="0.3s" />
            </circle>
            <text x="160" y="144" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">h₅</text>
          </g>
          <g className="node-pulse">
            <circle cx="220" cy="150" r="12" fill="url(#glowNode1)" filter="url(#softGlow)">
              <animate attributeName="r" values="12;14;12" dur="3s" repeatCount="indefinite" begin="0.8s" />
            </circle>
            <text x="220" y="154" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">h₆</text>
          </g>
        </g>

        {/* === Q版贞德主体 === */}
        <g className="chibi-joan">
          {/* 身体上下浮动动画 */}
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-3; 0,0"
            dur="3s"
            repeatCount="indefinite"
          />

          {/* 后发（金色长发） */}
          <ellipse cx="200" cy="215" rx="38" ry="42" fill="url(#hairGrad)" />
          <path d="M165 200 Q155 230 160 260 Q165 275 175 270" fill="#D4AC0D" />
          <path d="M235 200 Q245 230 240 260 Q235 275 225 270" fill="#D4AC0D" />

          {/* 身体/衣服 */}
          <path d="M175 245 Q170 280 165 295 L235 295 Q230 280 225 245 Z" fill="url(#dressGrad)" />
          {/* 白色领口 */}
          <path d="M185 245 Q200 258 215 245" fill="none" stroke="white" strokeWidth="3" />
          {/* 金色装饰线 */}
          <line x1="175" y1="265" x2="225" y2="265" stroke="#C9A04D" strokeWidth="2" />
          <line x1="172" y1="280" x2="228" y2="280" stroke="#C9A04D" strokeWidth="2" />

          {/* 左手拿书 */}
          <ellipse cx="155" cy="265" rx="12" ry="22" fill="url(#dressGrad)" transform="rotate(-15 155 265)" />
          {/* 书本 */}
          <rect x="135" y="250" width="22" height="28" rx="2" fill="#8B4513" transform="rotate(-10 146 264)" />
          <rect x="137" y="252" width="18" height="24" rx="1" fill="#FFF8DC" transform="rotate(-10 146 264)" />
          <text x="142" y="268" fontSize="8" fill="#5B8DB8" transform="rotate(-10 146 264)">GNN</text>

          {/* 右手（托腮/思考状） */}
          <ellipse cx="245" cy="255" rx="10" ry="18" fill="url(#dressGrad)" transform="rotate(20 245 255)" />
          <circle cx="250" cy="240" r="7" fill="url(#skinGrad)" />

          {/* 头部 */}
          <circle cx="200" cy="205" r="35" fill="url(#skinGrad)" />

          {/* 前发/刘海 */}
          <path d="M168 190 Q175 170 200 168 Q225 170 232 190 Q228 185 220 182 Q200 178 180 182 Q172 185 168 190" fill="url(#hairGrad)" />
          {/* 呆毛 */}
          <path d="M200 170 Q205 155 212 158 Q208 162 203 170" fill="none" stroke="#F4D03F" strokeWidth="2.5" strokeLinecap="round" />

          {/* 眼睛（蓝色） */}
          <g>
            {/* 左眼 */}
            <ellipse cx="188" cy="208" rx="7" ry="9" fill="white" />
            <ellipse cx="188" cy="208" rx="5" ry="7" fill="#3D5A80" />
            <circle cx="189" cy="206" r="2.5" fill="white" />
            {/* 右眼 */}
            <ellipse cx="212" cy="208" rx="7" ry="9" fill="white" />
            <ellipse cx="212" cy="208" rx="5" ry="7" fill="#3D5A80" />
            <circle cx="213" cy="206" r="2.5" fill="white" />
            {/* 眨眼动画 */}
            <animate attributeName="opacity" values="1;1;0;1;1" dur="4s" repeatCount="indefinite" begin="1s" />
          </g>

          {/* 腮红 */}
          <ellipse cx="178" cy="220" rx="5" ry="3" fill="#FFB6C1" opacity="0.5" />
          <ellipse cx="222" cy="220" rx="5" ry="3" fill="#FFB6C1" opacity="0.5" />

          {/* 嘴巴（微笑） */}
          <path d="M194 225 Q200 230 206 225" fill="none" stroke="#CD853F" strokeWidth="1.5" strokeLinecap="round" />

          {/* 思考气泡 */}
          <g opacity="0.85">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-4; 0,0"
              dur="2.5s"
              repeatCount="indefinite"
            />
            <ellipse cx="265" cy="90" rx="42" ry="28" fill="white" stroke="#B8C5D6" strokeWidth="1.5" />
            <circle cx="250" cy="120" r="4" fill="white" stroke="#B8C5D6" strokeWidth="1" />
            <circle cx="245" cy="128" r="2.5" fill="white" stroke="#B8C5D6" strokeWidth="1" />
            <text x="265" y="85" textAnchor="middle" fontSize="11" fill="#3D5A80" fontWeight="600">
              <tspan x="265" dy="0">hᵥ⁽ˡ⁺¹⁾ = σ(</tspan>
              <tspan x="265" dy="14">∑ W·hᵤ⁽ˡ⁾)</tspan>
            </text>
          </g>
        </g>

        {/* 漂浮的装饰符号 */}
        <g opacity="0.4">
          <text x="80" y="120" fontSize="14" fill="#5B8DB8">
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="3.5s" repeatCount="indefinite" />
            ∑
          </text>
          <text x="330" y="80" fontSize="12" fill="#4ECDC4">
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,6; 0,0" dur="4s" repeatCount="indefinite" begin="0.5s" />
            σ
          </text>
          <text x="90" y="180" fontSize="10" fill="#FF6B6B">
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,-5; 0,0" dur="3s" repeatCount="indefinite" begin="1s" />
            ReLU
          </text>
          <text x="340" y="170" fontSize="11" fill="#96CEB4">
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,7; 0,0" dur="3.8s" repeatCount="indefinite" begin="1.5s" />
            ∂L/∂W
          </text>
        </g>

        {/* 底部文字标签 */}
        <text x="200" y="315" textAnchor="middle" fontSize="11" fill="#8FA3B8" fontWeight="500">
          贞德正在学习图神经网络的消息传递机制...
        </text>
      </svg>
    </div>
  );
}
