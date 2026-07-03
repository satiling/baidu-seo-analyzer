import { motion } from "framer-motion";
import type { KeywordPrediction } from "@/types/detection";
import { KeyRound, Search } from "lucide-react";

const COMPETITION_CONFIG = {
  low: { label: "低竞争", color: "#00E676" },
  mid: { label: "中竞争", color: "#FFB300" },
  high: { label: "高竞争", color: "#FF6B81" },
};

export default function KeywordPrediction({
  keywords,
}: {
  keywords: KeywordPrediction[];
}) {
  return (
    <div className="panel panel-corner p-6">
      <div className="mb-6 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-radar-400" />
        <h3 className="font-display text-lg font-bold text-white">关键词产出预测</h3>
        <span className="ml-auto font-mono text-[10px] text-slate-500">
          Keyword Prediction · 共 {keywords.length} 个候选词
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-radar-500/20 text-left text-[10px] tracking-wider text-slate-500">
              <th className="py-2 pr-3 font-medium">关键词</th>
              <th className="px-3 py-2 font-medium">意图</th>
              <th className="px-3 py-2 font-medium">竞争度</th>
              <th className="px-3 py-2 font-medium">预估排名</th>
              <th className="px-3 py-2 font-medium">流量预估</th>
              <th className="py-2 pl-3 font-medium">难度</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((kw, i) => {
              const comp = COMPETITION_CONFIG[kw.competition];
              return (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="border-b border-radar-500/8 transition-colors hover:bg-radar-500/5"
                >
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <Search className="h-3 w-3 text-radar-500" />
                      <span className="text-radar-100">{kw.keyword}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-400">{kw.intent}</td>
                  <td className="px-3 py-3">
                    <span
                      className="chip text-[10px]"
                      style={{ color: comp.color, borderColor: `${comp.color}55` }}
                    >
                      {comp.label}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-radar-300">
                      TOP {kw.rankRange[0]}-{kw.rankRange[1]}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-pass-400">{kw.trafficEstimate}/月</span>
                  </td>
                  <td className="py-3 pl-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-void-700">
                        <div
                          className="h-full"
                          style={{
                            width: `${kw.difficulty}%`,
                            background: comp.color,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">{kw.difficulty}</span>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-radar-500/10 pt-4 font-mono text-[10px] text-slate-500">
        <span>* 排名区间基于综合评分与竞争度估算，实际排名受内容质量与外链持续影响</span>
      </div>
    </div>
  );
}
