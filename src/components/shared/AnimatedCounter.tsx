// ========================================
// AnimatedCounter — 数字滚动动画组件
// 使用 requestAnimationFrame 实现平滑的数字滚动效果
// ========================================

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  /** 目标数值 */
  value: number;
  /** 动画持续时间（秒） */
  duration?: number;
  /** 动画缓动函数 */
  easing?: (t: number) => number;
  /** 格式化函数（如添加千分位、单位等） */
  formatter?: (value: number) => string;
  /** 自定义类名 */
  className?: string;
  /** 是否启用动画（默认 true） */
  enabled?: boolean;
}

// 默认缓动函数：easeOutCubic
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedCounter({
  value,
  duration = 1,
  easing = easeOutCubic,
  formatter = (v) => String(Math.round(v)),
  className,
  enabled = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDisplayValue(value);
      return;
    }

    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = performance.now();
    const endTime = startTime + duration * 1000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const easedProgress = easing(progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    // 取消之前的动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, easing, enabled]);

  return (
    <span className={cn('tabular-nums', className)}>
      {formatter(displayValue)}
    </span>
  );
}

// ---- 预设格式化函数 ----

export function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN');
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDecimal(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export function addUnit(value: number, unit: string): string {
  return `${value}${unit}`;
}
