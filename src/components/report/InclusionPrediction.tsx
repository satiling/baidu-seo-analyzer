import { motion } from "framer-motion";
import type { InclusionPrediction } from "@/types/detection";
import { Database, ShieldCheck, Hourglass, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Counter from "@/components/ui/Counter";

export default function InclusionPrediction({
  prediction,
}: {
  prediction: InclusionPrediction;
}) {
  const probPct = Math.round(prediction.probability * 100);
  const probColor = probPct >= 60 ? "#00E676" : probPct >= 35 ? "#FFB300" : "#FF3D5A";
  const sandboxConfig = {
    none: { label: "暂不收录", color: "#FF3D5A", desc: "综合评分过低，建议先整改后再提交收录" },
    active: { label: "沙盒考核中", color: "#FFB300", desc: "已进入动态沙盒，需通过点击率/停留/跳出率考核" },
    released: { label: "已出沙盒", color: "#00E676", desc: "沙盒考核达标，正常参与排名" },
  }[prediction.sandbox];

  return (
    <div className="panel panel-corner p-6">
      <div className="mb-6 flex items-center gap-2">
        <Database className="h-5 w-5 text-radar-400" />
        <h3 className="font-display text-lg font-bold text-white">百度收录预测</h3>
        <span className="ml-auto font-mono text-[10px] text-slate-500">
          Inclusion Prediction
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* 收录概率 */}
        <div className="flex flex-col items-center justify-center border border-radar-500/15 bg-void-950/50 p-5">
          <div className="font-mono text-xs text-slate-500">收录概率</div>
          <div
            className="stat-num text-4xl"
            style={{ color: probColor, textShadow: `0 0 16px ${probColor}50` }}
          >
            <Counter value={probPct} suffix="%" />
          </div>
          <div className="mt-3 h-1.5 w-full bg-void-700">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${probPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full"
              style={{ background: probColor }}
            />
          </div>
        </div>

        {/* 预计周期 */}
        <div className="border border-radar-500/15 bg-void-950/50 p-5">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
            <Hourglass className="h-3.5 w-3.5" /> 预计收录周期
          </div>
          <div className="mt-3 font-display text-2xl font-black text-radar-200">
            {prediction.estimatedDays[0]}-{prediction.estimatedDays[1]}
            <span className="ml-1 text-sm font-mono text-slate-500">天</span>
          </div>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 12 }).map((_, i) => {
              const filled = i < Math.ceil((prediction.estimatedDays[1] / 120) * 12);
              return (
                <span
                  key={i}
                  className="h-2 flex-1"
                  style={{
                    background: filled ? probColor : "rgba(31,217,255,0.1)",
                  }}
                />
              );
            })}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-600">
            <span>1天</span>
            <span>120天</span>
          </div>
        </div>

        {/* 沙盒状态 */}
        <div className="border border-radar-500/15 bg-void-950/50 p-5">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5" /> 沙盒状态
          </div>
          <div
            className="mt-3 inline-flex items-center gap-2 border px-3 py-1 font-display text-sm font-bold"
            style={{
              color: sandboxConfig.color,
              borderColor: `${sandboxConfig.color}55`,
              backgroundColor: `${sandboxConfig.color}10`,
            }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: sandboxConfig.color }} />
            {sandboxConfig.label}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            {sandboxConfig.desc}
          </p>
        </div>
      </div>

      {/* 备案影响 */}
      <div className="mt-5 flex items-start gap-3 border border-radar-500/15 bg-radar-500/5 p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-radar-400" />
        <div>
          <div className="font-mono text-xs text-radar-300">备案影响</div>
          <p className="mt-1 text-xs text-slate-300">{prediction.registrationImpact}</p>
        </div>
      </div>

      {/* 影响因素 */}
      <div className="mt-5">
        <div className="mb-3 font-mono text-xs tracking-wider text-radar-300">影响因素分析</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {prediction.factors.map((f, i) => {
            const Icon = f.impact === "positive" ? TrendingUp : f.impact === "negative" ? TrendingDown : Minus;
            const color = f.impact === "positive" ? "#00E676" : f.impact === "negative" ? "#FF6B81" : "#5DECFF";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-start gap-2 border-l-2 p-2"
                style={{ borderColor: color }}
              >
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color }} />
                <div>
                  <div className="text-xs font-medium text-radar-100">{f.label}</div>
                  <div className="text-[11px] text-slate-400">{f.detail}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
