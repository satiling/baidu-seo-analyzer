import { useId } from "react";

interface RadarDatum {
  label: string;
  value: number; // 0-100
}

/** 自研 SVG 雷达图：避免重型图表库，保证动效统一 */
export default function RadarChart({
  data,
  size = 260,
  max = 100,
  color = "#00E5FF",
  fillOpacity = 0.18,
  showLabels = true,
}: {
  data: RadarDatum[];
  size?: number;
  max?: number;
  color?: string;
  fillOpacity?: number;
  showLabels?: boolean;
}) {
  const id = useId();
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - (showLabels ? 36 : 14);
  const n = data.length;

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, r: number) => ({
    x: cx + Math.cos(angle(i)) * r,
    y: cy + Math.sin(angle(i)) * r,
  });

  const rings = [0.25, 0.5, 0.75, 1];

  const dataPoints = data.map((d, i) => point(i, (Math.min(d.value, max) / max) * radius));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="overflow-visible"
    >
      <defs>
        <radialGradient id={`grad-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity + 0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={fillOpacity} />
        </radialGradient>
      </defs>

      {/* 同心网格 */}
      {rings.map((r, idx) => (
        <polygon
          key={idx}
          points={data.map((_, i) => {
            const p = point(i, radius * r);
            return `${p.x},${p.y}`;
          }).join(" ")}
          fill="none"
          stroke="rgba(31,217,255,0.12)"
          strokeWidth={1}
        />
      ))}

      {/* 轴线 */}
      {data.map((_, i) => {
        const p = point(i, radius);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgba(31,217,255,0.1)"
            strokeWidth={1}
          />
        );
      })}

      {/* 数据多边形 */}
      <path d={dataPath} fill={`url(#grad-${id})`} stroke={color} strokeWidth={2} />

      {/* 数据点 */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}

      {/* 标签 */}
      {showLabels &&
        data.map((d, i) => {
          const p = point(i, radius + 18);
          const isRight = p.x > cx + 4;
          const isLeft = p.x < cx - 4;
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor={isRight ? "start" : isLeft ? "end" : "middle"}
              dominantBaseline="middle"
              className="font-mono"
              fontSize={11}
              fill="rgba(184,210,232,0.85)"
            >
              {d.label}
              <tspan x={p.x} dy={14} fontSize={10} fill={color}>
                {Math.round(d.value)}
              </tspan>
            </text>
          );
        })}
    </svg>
  );
}
