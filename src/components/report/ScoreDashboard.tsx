import { motion } from "framer-motion";
import type { DetectionResult } from "@/types/detection";
import { buildRadarDimensions } from "@/engine/scorer";
import RadarChart from "./RadarChart";

const GRADE_COLOR: Record<string, string> = {
  A: "#00E676",
  B: "#5DECFF",
  C: "#FFB300",
  D: "#FF6B81",
  F: "#FF3D5A",
};

export default function ScoreDashboard({
  result,
}: {
  result: DetectionResult;
}) {
  const score = result.overallScore;
  const color = scoreColor(score);
  const radarData = buildRadarDimensions(result.diagnoses).map((d) => ({
    label: d.label,
    value: d.value,
  }));

  return (
    <div className="panel panel-corner grid grid-cols-1 gap-6 p-6 lg:grid-cols-2 lg:items-center">
      {/* 环形仪表 */}
      <div className="flex flex-col items-center">
        <ScoreGauge score={score} color={color} grade={result.grade} />
        <div className="mt-4 text-center">
          <div
            className="font-display text-2xl font-black"
            style={{ color }}
          >
            {result.gradeLabel}
          </div>
          <div className="mt-1 font-mono text-xs text-slate-500">
            检测时间 {new Date(result.timestamp).toLocaleString("zh-CN")}
          </div>
        </div>
      </div>

      {/* 雷达图 */}
      <div className="flex flex-col items-center">
        <div className="mb-2 font-mono text-xs tracking-wider text-radar-300">
          六维算法雷达
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <RadarChart data={radarData} size={280} color={color} />
        </motion.div>
        <div className="mt-2 flex flex-wrap justify-center gap-3 font-mono text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2" style={{ background: GRADE_COLOR.A }} /> 优秀
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2" style={{ background: GRADE_COLOR.C }} /> 警告
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2" style={{ background: GRADE_COLOR.F }} /> 违规
          </span>
        </div>
      </div>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 90) return "#00E676";
  if (score >= 75) return "#5DECFF";
  if (score >= 60) return "#FFB300";
  if (score >= 40) return "#FF6B81";
  return "#FF3D5A";
}

function ScoreGauge({
  score,
  color,
  grade,
}: {
  score: number;
  color: string;
  grade: string;
}) {
  const size = 220;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
        </defs>
        {/* 背景环 */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(31,217,255,0.1)"
          strokeWidth={stroke}
        />
        {/* 进度环 */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="font-mono text-xs tracking-widest text-slate-500"
        >
          综合评分
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: "spring" }}
          className="font-display text-6xl font-black tabular-nums"
          style={{ color, textShadow: `0 0 24px ${color}60` }}
        >
          {score}
        </motion.div>
        <div
          className="mt-1 grid h-7 w-7 place-items-center font-display text-sm font-black"
          style={{ color, border: `1px solid ${color}` }}
        >
          {grade}
        </div>
      </div>
    </div>
  );
}
