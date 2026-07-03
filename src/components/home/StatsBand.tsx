import { motion } from "framer-motion";
import Counter from "@/components/ui/Counter";

const STATS = [
  { value: 128640, suffix: "+", label: "累计检测页面", decimals: 0 },
  { value: 8, suffix: " 套", label: "算法体系覆盖", decimals: 0 },
  { value: 32, suffix: "%", label: "平均合规提分", decimals: 0 },
  { value: 4, suffix: " 维", label: "EEAT 评估维度", decimals: 0 },
];

export default function StatsBand() {
  return (
    <section className="border-y border-radar-500/15 bg-void-900/60">
      <div className="container py-12">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center"
            >
              <div className="stat-num text-3xl text-gradient-radar md:text-5xl">
                <Counter value={s.value} suffix={s.suffix} decimals={s.decimals} />
              </div>
              <div className="mt-2 font-mono text-xs tracking-wider text-slate-400">
                {s.label}
              </div>
              <div className="mx-auto mt-3 h-0.5 w-12 bg-gradient-to-r from-transparent via-radar-500/60 to-transparent" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
