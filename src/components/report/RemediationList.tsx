import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RemediationItem } from "@/types/detection";
import { Wrench, ChevronRight, Check, Code2 } from "lucide-react";
import { getAlgorithm } from "@/data/algorithms";

const PRIORITY_CONFIG: Record<
  RemediationItem["priority"],
  { color: string; label: string; desc: string }
> = {
  P0: { color: "#FF3D5A", label: "P0", desc: "立即处理·降权风险" },
  P1: { color: "#FFB300", label: "P1", desc: "高优先级·尽快处理" },
  P2: { color: "#5DECFF", label: "P2", desc: "中优先级·建议处理" },
  P3: { color: "#00E676", label: "P3", desc: "低优先级·持续优化" },
};

export default function RemediationList({
  items,
}: {
  items: RemediationItem[];
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <div className="panel panel-corner p-8 text-center">
        <Wrench className="mx-auto h-10 w-10 text-pass-500" />
        <h3 className="mt-4 font-display text-lg font-bold text-pass-400">
          恭喜！未发现需要整改的项
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          当前页面合规状态良好，建议持续监控算法更新并定期复检。
        </p>
      </div>
    );
  }

  const doneCount = checked.size;
  const progress = Math.round((doneCount / items.length) * 100);

  return (
    <div className="panel panel-corner p-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Wrench className="h-5 w-5 text-radar-400" />
        <h3 className="font-display text-lg font-bold text-white">整改清单</h3>
        <span className="chip border-radar-500/40 text-radar-300">
          {items.length} 项
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-xs text-slate-500">
            已完成 {doneCount}/{items.length}
          </span>
          <div className="h-1.5 w-24 bg-void-700">
            <div
              className="h-full bg-gradient-to-r from-pass-600 to-pass-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <RemediationCard
            key={item.id}
            item={item}
            index={i}
            checked={checked.has(item.id)}
            onToggle={() => toggle(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function RemediationCard({
  item,
  index,
  checked,
  onToggle,
}: {
  item: RemediationItem;
  index: number;
  checked: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = PRIORITY_CONFIG[item.priority];
  const algo = getAlgorithm(item.algorithmId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={`relative border-l-2 bg-void-950/40 transition-opacity ${checked ? "opacity-50" : ""}`}
      style={{ borderColor: config.color }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* 复选框 */}
          <button
            onClick={onToggle}
            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center border transition-colors ${
              checked
                ? "border-pass-500 bg-pass-500 text-void-950"
                : "border-slate-600 hover:border-radar-400"
            }`}
          >
            {checked && <Check className="h-3.5 w-3.5" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="chip text-[10px] font-bold"
                style={{ color: config.color, borderColor: config.color }}
              >
                {config.label}
              </span>
              <span className="font-mono text-[10px] text-slate-500">{config.desc}</span>
              {algo && (
                <span className="font-mono text-[10px] text-radar-500">
                  · {algo.name}
                </span>
              )}
            </div>
            <h4 className={`mt-2 font-display text-base font-bold ${checked ? "line-through text-slate-500" : "text-white"}`}>
              {item.title}
            </h4>
            <p className="mt-1 text-xs text-alert-400">
              <span className="text-slate-500">问题：</span>
              {item.problem}
            </p>

            <div className="mt-2 rounded-sm border border-pass-500/20 bg-pass-500/5 p-2.5">
              <div className="font-mono text-[10px] text-pass-400">解决方案</div>
              <p className="mt-1 text-xs text-slate-300">{item.solution}</p>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-slate-500">预期影响：</span>
              <span className="text-radar-300">{item.impact}</span>
            </div>

            {item.codeSample && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-radar-400 hover:text-radar-300"
              >
                <Code2 className="h-3.5 w-3.5" />
                {expanded ? "收起代码示例" : "查看代码示例"}
                <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
              </button>
            )}

            <AnimatePresence>
              {expanded && item.codeSample && (
                <motion.pre
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-2 overflow-x-auto border border-radar-500/15 bg-void-950 p-3 font-mono text-[11px] leading-relaxed text-radar-200 scanline-overlay"
                >
                  <code>{item.codeSample}</code>
                </motion.pre>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
