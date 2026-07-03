import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ALGORITHM_META } from "@/data/algorithms";
import { SectionHeader } from "./CapabilityGrid";
import * as LucideIcons from "lucide-react";

export default function AlgorithmMatrix() {
  return (
    <section className="container py-20">
      <SectionHeader
        tag="ALGORITHM MATRIX"
        title="八大算法 / 机制矩阵"
        subtitle="覆盖 2026 年百度搜索全量算法与底层排序逻辑，点击查看详细规则与合规建议"
      />

      <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ALGORITHM_META.map((algo, i) => {
          const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[
            algo.icon
          ] || LucideIcons.Shield;
          return (
            <motion.div
              key={algo.id}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                to={`/algorithms#${algo.id}`}
                className="panel panel-corner group relative block h-full overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:border-radar-500/40"
              >
                <span
                  className="absolute left-0 top-0 h-full w-0.5 transition-all group-hover:w-1"
                  style={{ background: algo.color }}
                />
                <div className="flex items-start justify-between">
                  <span
                    className="grid h-10 w-10 place-items-center border"
                    style={{
                      borderColor: `${algo.color}55`,
                      color: algo.color,
                      backgroundColor: `${algo.color}10`,
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-600 transition-colors group-hover:text-radar-300" />
                </div>
                <div className="mt-4">
                  <div className="font-mono text-[10px] tracking-wider text-slate-500">
                    {algo.category.toUpperCase()} · 权重 {algo.weight}
                  </div>
                  <h3 className="mt-1 font-display text-base font-bold text-white">
                    {algo.name}
                  </h3>
                  <div className="mt-1 font-mono text-xs text-radar-400">
                    v{algo.version}
                  </div>
                  <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-400">
                    {algo.coreUpgrade}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
