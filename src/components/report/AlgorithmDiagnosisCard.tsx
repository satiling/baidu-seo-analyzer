import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import type { AlgorithmDiagnosis } from "@/types/detection";
import { getAlgorithm } from "@/data/algorithms";

export default function AlgorithmDiagnosisCard({
  diagnosis,
  index,
}: {
  diagnosis: AlgorithmDiagnosis;
  index: number;
}) {
  const [open, setOpen] = useState(diagnosis.status !== "pass");
  const meta = getAlgorithm(diagnosis.algorithmId);
  const statusConfig = {
    pass: {
      icon: CheckCircle2,
      color: "#00E676",
      label: "合规",
      ring: "border-pass-500/30",
    },
    warn: {
      icon: AlertCircle,
      color: "#FFB300",
      label: "警告",
      ring: "border-amber-glow/40",
    },
    fail: {
      icon: AlertTriangle,
      color: "#FF3D5A",
      label: "违规",
      ring: "border-alert-500/40",
    },
  }[diagnosis.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`panel panel-corner border ${statusConfig.ring}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        {/* 状态灯 */}
        <span
          className="relative grid h-10 w-10 shrink-0 place-items-center border"
          style={{
            borderColor: `${statusConfig.color}55`,
            color: statusConfig.color,
            backgroundColor: `${statusConfig.color}10`,
          }}
        >
          <statusConfig.icon className="h-5 w-5" />
          <span
            className="absolute inset-0 animate-pulse-ring rounded-sm border"
            style={{ borderColor: statusConfig.color }}
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold text-white">
              {diagnosis.algorithmName}
            </h3>
            <span
              className="chip"
              style={{
                color: statusConfig.color,
                borderColor: `${statusConfig.color}55`,
              }}
            >
              {statusConfig.label}
            </span>
          </div>
          {meta && (
            <p className="mt-1 truncate text-xs text-slate-400">
              {meta.category.toUpperCase()} · 权重 {meta.weight}
            </p>
          )}
        </div>

        {/* 评分 */}
        <div className="text-right">
          <div
            className="font-display text-2xl font-black tabular-nums"
            style={{ color: statusConfig.color }}
          >
            {diagnosis.score}
          </div>
          <div className="font-mono text-[10px] text-slate-500">/100</div>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && diagnosis.hits.length > 0 && (
        <div className="border-t border-radar-500/10 p-4">
          <div className="mb-3 font-mono text-[10px] tracking-wider text-slate-500">
            命中规则 · 扣分明细
          </div>
          <div className="space-y-3">
            {diagnosis.hits.map((hit) => (
              <div
                key={hit.ruleId}
                className="border-l-2 pl-3"
                style={{
                  borderColor:
                    hit.severity === "high"
                      ? "#FF3D5A"
                      : hit.severity === "mid"
                        ? "#FFB300"
                        : "#5DECFF",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500">
                        {hit.ruleId}
                      </span>
                      <span className="text-sm font-medium text-radar-100">
                        {hit.ruleName}
                      </span>
                      <span
                        className="chip text-[10px]"
                        style={{
                          color:
                            hit.severity === "high"
                              ? "#FF6B81"
                              : hit.severity === "mid"
                                ? "#FFB300"
                                : "#5DECFF",
                          borderColor: "currentColor",
                        }}
                      >
                        {hit.severity === "high" ? "高危" : hit.severity === "mid" ? "中危" : "低危"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{hit.evidence}</p>
                    <p className="mt-1 text-xs text-pass-400">
                      <span className="text-slate-500">建议：</span>
                      {hit.suggestion}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-lg font-bold text-alert-400">
                      -{Math.round(hit.deduct)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {open && diagnosis.hits.length === 0 && (
        <div className="border-t border-radar-500/10 p-4">
          <p className="text-xs text-pass-400">该算法未命中任何违规规则，状态合规。</p>
        </div>
      )}
    </motion.div>
  );
}
