'use client';

import { useId } from 'react';

type AreaChartProps = {
  data: number[];
  labels?: string[];
  darkMode?: boolean;
  height?: number;
};

export function AreaChart({ data, labels = [], darkMode = false, height = 220 }: AreaChartProps) {
  const gradientId = useId();
  const width = 640;
  const padding = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y, value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const strokeColor = darkMode ? '#22d3ee' : '#2563eb';
  const gridColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  const labelColor = darkMode ? '#94a3b8' : '#64748b';

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full min-w-[480px]" role="img" aria-label="Revenue trend chart">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={padding}
            x2={width - padding}
            y1={padding + fraction * (height - padding * 2)}
            y2={padding + fraction * (height - padding * 2)}
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={strokeColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, index) => (
          <circle
            key={index}
            cx={p.x}
            cy={p.y}
            r={index === points.length - 1 ? 5 : 3}
            fill={strokeColor}
            stroke={darkMode ? '#0f172a' : '#ffffff'}
            strokeWidth={2}
          />
        ))}

        {labels.map((label, index) => {
          if (labels.length > 8 && index % 2 !== 0) return null;
          const x = padding + (index / (data.length - 1)) * (width - padding * 2);
          return (
            <text key={label} x={x} y={height + 18} fontSize={11} fill={labelColor} textAnchor="middle">
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
