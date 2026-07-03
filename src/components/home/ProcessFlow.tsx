import { motion } from "framer-motion";
import { LinkIcon, Download, Activity, FileText } from "lucide-react";
import { SectionHeader } from "./CapabilityGrid";

const STEPS = [
  {
    icon: LinkIcon,
    label: "输入 URL",
    desc: "粘贴网页地址，启动雷达扫描",
    color: "#00E5FF",
  },
  {
    icon: Download,
    label: "模拟抓取",
    desc: "Baiduspider 解析页面结构与特征",
    color: "#5DECFF",
  },
  {
    icon: Activity,
    label: "算法诊断",
    desc: "八大算法规则匹配 + EEAT 评估",
    color: "#FFB300",
  },
  {
    icon: FileText,
    label: "生成报告",
    desc: "评分 + 整改 + 收录 + 关键词预测",
    color: "#00E676",
  },
];

export default function ProcessFlow() {
  return (
    <section className="container py-20">
      <SectionHeader
        tag="WORKFLOW"
        title="四步检测流程"
        subtitle="从输入到报告，全流程透明可视，每一步都有终端日志可追溯"
      />

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-4">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.12 }}
            className="relative"
          >
            <div className="panel panel-corner h-full p-6">
              <div className="flex items-center justify-between">
                <span
                  className="grid h-10 w-10 place-items-center border font-mono text-sm font-bold"
                  style={{
                    borderColor: `${step.color}55`,
                    color: step.color,
                  }}
                >
                  0{i + 1}
                </span>
                <step.icon className="h-5 w-5" style={{ color: step.color }} />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-white">
                {step.label}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                {step.desc}
              </p>
            </div>

            {/* 连接线 */}
            {i < STEPS.length - 1 && (
              <div className="absolute -right-2 top-1/2 z-10 hidden h-px w-4 md:block">
                <div className="relative h-full w-full bg-radar-500/20">
                  <div className="absolute left-0 top-1/2 h-1 w-1 -translate-y-1/2 animate-pulse rounded-full bg-radar-400" />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
