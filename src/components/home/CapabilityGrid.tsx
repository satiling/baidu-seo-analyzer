import { motion } from "framer-motion";
import {
  FileSearch,
  Wrench,
  Bug,
  Database,
  KeyRound,
  type LucideIcon,
} from "lucide-react";

interface Capability {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  color: string;
}

const CAPABILITIES: Capability[] = [
  {
    id: "detect",
    title: "网页页面检测",
    desc: "输入 URL 即可一键扫描，五大算法 + EEAT + 沙盒机制全量规则匹配，输出违规清单与扣分明细。",
    icon: FileSearch,
    color: "#00E5FF",
  },
  {
    id: "solution",
    title: "提供解决办法",
    desc: "针对每条违规项生成可操作的整改清单，含代码示例与影响评估，按 P0-P3 优先级排序。",
    icon: Wrench,
    color: "#00E676",
  },
  {
    id: "spider",
    title: "模拟百度蜘蛛",
    desc: "还原 Baiduspider 抓取行为序列，从 DNS 解析到回访调度，算出蜘蛛对你页面的喜好度。",
    icon: Bug,
    color: "#FFB300",
  },
  {
    id: "inclusion",
    title: "预测百度收录",
    desc: "基于备案状态、内容质量、行为数据，推演收录概率、预计周期与动态沙盒状态。",
    icon: Database,
    color: "#5DECFF",
  },
  {
    id: "keyword",
    title: "预测关键词产出",
    desc: "围绕页面主题派生可产出关键词，预测竞争度、预估排名区间与流量潜力。",
    icon: KeyRound,
    color: "#FF6B81",
  },
];

export default function CapabilityGrid() {
  return (
    <section className="container py-20">
      <SectionHeader
        tag="CAPABILITIES"
        title="五大核心能力"
        subtitle="从检测到优化，从蜘蛛模拟到收录预测，全链路帮助站长提升权重与排名"
      />

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {CAPABILITIES.map((cap, i) => (
          <motion.article
            key={cap.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="panel panel-corner group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-radar-500/40"
          >
            <div
              className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-30"
              style={{ background: cap.color }}
            />
            <div className="relative">
              <span
                className="grid h-12 w-12 place-items-center border transition-colors"
                style={{
                  borderColor: `${cap.color}55`,
                  color: cap.color,
                  backgroundColor: `${cap.color}10`,
                }}
              >
                <cap.icon className="h-6 w-6" />
              </span>
              <div className="mt-5 font-mono text-[10px] tracking-widest text-slate-500">
                0{i + 1}
              </div>
              <h3 className="mt-1 font-display text-lg font-bold text-white">
                {cap.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {cap.desc}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

export function SectionHeader({
  tag,
  title,
  subtitle,
}: {
  tag: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mb-3 inline-flex items-center gap-2 font-mono text-xs tracking-[0.3em] text-radar-500">
        <span className="h-px w-8 bg-radar-500/50" />
        {tag}
        <span className="h-px w-8 bg-radar-500/50" />
      </div>
      <h2 className="font-display text-3xl font-black text-white md:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm text-slate-400 md:text-base">{subtitle}</p>
      )}
    </div>
  );
}
