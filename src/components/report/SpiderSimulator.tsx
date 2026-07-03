import { motion } from "framer-motion";
import type { SpiderAffinity } from "@/types/detection";
import { Bug, Activity } from "lucide-react";

const RESULT_COLOR = {
  ok: "#00E676",
  warn: "#FFB300",
  block: "#FF3D5A",
};

const RESULT_LABEL = {
  ok: "通过",
  warn: "警告",
  block: "阻断",
};

export default function SpiderSimulator({
  affinity,
}: {
  affinity: SpiderAffinity;
}) {
  const color = affinity.score >= 65 ? "#00E676" : affinity.score >= 45 ? "#FFB300" : "#FF3D5A";

  return (
    <div className="panel panel-corner p-6">
      <div className="mb-6 flex items-center gap-2">
        <Bug className="h-5 w-5 text-radar-400" />
        <h3 className="font-display text-lg font-bold text-white">百度蜘蛛喜好度模拟</h3>
        <span className="ml-auto font-mono text-[10px] text-slate-500">
          Baiduspider Behavior Simulation
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 左侧：喜好度环 + 抓取轨迹雷达 */}
        <div className="flex flex-col items-center">
          <SpiderTrace trace={affinity.trace} color={color} score={affinity.score} level={affinity.level} />
          <div className="mt-4 grid w-full grid-cols-3 gap-2 font-mono text-[10px]">
            {[
              { label: "DNS", val: "12ms" },
              { label: "FETCH", val: "286ms" },
              { label: "PARSE", val: "94ms" },
            ].map((s) => (
              <div key={s.label} className="border border-radar-500/15 bg-void-950/50 p-2 text-center">
                <div className="text-slate-500">{s.label}</div>
                <div className="mt-0.5 text-radar-300">{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：行为序列时间轴 */}
        <div>
          <div className="mb-3 flex items-center gap-2 font-mono text-xs text-radar-300">
            <Activity className="h-4 w-4" />
            抓取行为序列
          </div>
          <div className="relative space-y-2">
            {affinity.behaviorSequence.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="flex items-start gap-3"
              >
                <div className="flex flex-col items-center">
                  <span
                    className="grid h-6 w-6 place-items-center rounded-full border font-mono text-[10px]"
                    style={{
                      borderColor: `${RESULT_COLOR[b.result]}66`,
                      color: RESULT_COLOR[b.result],
                      backgroundColor: `${RESULT_COLOR[b.result]}10`,
                    }}
                  >
                    {i + 1}
                  </span>
                  {i < affinity.behaviorSequence.length - 1 && (
                    <span className="my-0.5 h-4 w-px bg-radar-500/20" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">{b.phase}</span>
                    <span className="text-xs font-medium text-radar-100">{b.action}</span>
                    <span
                      className="chip ml-auto text-[9px]"
                      style={{
                        color: RESULT_COLOR[b.result],
                        borderColor: `${RESULT_COLOR[b.result]}55`,
                      }}
                    >
                      {RESULT_LABEL[b.result]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
                    {b.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 蜘蛛抓取轨迹雷达图 */
function SpiderTrace({
  trace,
  color,
  score,
  level,
}: {
  trace: { x: number; y: number; label: string }[];
  color: string;
  score: number;
  level: string;
}) {
  const size = 220;
  const cx = 50;
  const cy = 50;
  const path = trace
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ") + " Z";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {/* 同心圆 */}
        {[15, 30, 45].map((r) => (
          <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(31,217,255,0.12)" strokeWidth={0.4} />
        ))}
        {/* 十字线 */}
        <line x1={cx} y1={5} x2={cx} y2={95} stroke="rgba(31,217,255,0.1)" strokeWidth={0.4} />
        <line x1={5} y1={cy} x2={95} y2={cy} stroke="rgba(31,217,255,0.1)" strokeWidth={0.4} />
        {/* 扫描扇形 */}
        <motion.path
          d={`M${cx},${cy} L${cx + 45},${cy} A45,45 0 0,0 ${cx + 31.8},${cy - 31.8} Z`}
          fill={`${color}25`}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 270, opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
        {/* 抓取轨迹 */}
        <motion.path
          d={path}
          fill={`${color}15`}
          stroke={color}
          strokeWidth={0.8}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
        />
        {trace.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={1.4} fill={color} />
        ))}
        {/* 中心点 */}
        <circle cx={cx} cy={cy} r={2} fill={color} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="font-display text-3xl font-black tabular-nums"
          style={{ color, textShadow: `0 0 16px ${color}60` }}
        >
          {score}
        </motion.div>
        <div className="font-mono text-[10px]" style={{ color }}>
          {level}
        </div>
      </div>
    </div>
  );
}
