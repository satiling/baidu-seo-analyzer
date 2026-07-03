import { motion } from "framer-motion";
import { ALGORITHM_META } from "@/data/algorithms";
import * as LucideIcons from "lucide-react";
import { SectionHeader } from "@/components/home/CapabilityGrid";

const TIMELINE = [
  { date: "2026.01", title: "飓风算法 4.0", desc: "新增 AI 批量生成低质内容专项打击" },
  { date: "2026.02", title: "清风算法 5.0", desc: "扩展至全页面关键词作弊 + AI 文不对题治理" },
  { date: "2026.03", title: "蓝天算法 3.0", desc: "升级外链质量评估，付费软文权重清零" },
  { date: "2026.04", title: "双 Agent 引擎", desc: "搜索从「找信息」向「完成任务」进化" },
  { date: "2026.05", title: "闪电算法 3.0", desc: "移动端全链路交互流畅度考核" },
  { date: "2026.06", title: "搜索结果回调", desc: "网页链接优先级回升，AI 答案框下移第二屏" },
];

const BOTTOM_LOGIC = [
  {
    icon: "BrainCircuit",
    title: "ERNIE 语义模型全面替代关键词匹配",
    desc: "百度全面应用 ERNIE 深度语义模型，排名核心从「关键词匹配度」转向用户意图识别 + 实体关系匹配。同义词、相关语义统一识别，单纯堆砌关键词不再有排名优势。内容是否完整准确地解决用户需求，成为排名第一优先级。",
    points: ["语义替代关键词", "意图识别驱动", "实体关系匹配"],
    color: "#00E5FF",
  },
  {
    icon: "ShieldCheck",
    title: "EEAT 正式成为硬性排名门槛",
    desc: "经验、专业度、权威性、可信度四大维度正式纳入评分体系。医疗、金融、法律等专业领域，无权威资质、无真实经验支撑的内容直接降权。有明确作者身份、专业背书、引用权威来源的内容，排名权重显著提升。",
    points: ["Experience 经验", "Expertise 专业度", "Authoritativeness 权威", "Trustworthiness 可信"],
    color: "#00E676",
  },
  {
    icon: "Hourglass",
    title: "动态沙盒机制上线",
    desc: "收录门槛大幅收紧，新站收录周期从 1-2 周拉长至 1-3 个月，未备案域名收录难度陡增。新页面收录后进入动态沙盒：通过真实用户的点击率、停留时长、跳出率等行为数据考核，数据不达标的页面会被移出索引，不再参与排名。",
    points: ["收录周期 1-3 个月", "行为数据考核", "不达标移出索引"],
    color: "#B0F7FF",
  },
  {
    icon: "Link2",
    title: "搜索结果权重回调",
    desc: "2026 年 6 月百度完成全量调整：自然网页链接的展示优先级显著提升，AI 生成的综合答案框从首屏核心位置下移至第二屏。对正规原创站点是利好，优质网页能获得更多曝光；对纯 AI 聚合站是利空，AI 生成内容的流量入口收窄。",
    points: ["网页链接优先级回升", "AI 答案框下移", "原创站点利好"],
    color: "#FFB300",
  },
];

export default function Algorithms() {
  return (
    <>
      {/* 头部 */}
      <section className="relative overflow-hidden border-b border-radar-500/10">
        <div className="container py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-3 inline-flex items-center gap-2 font-mono text-xs tracking-[0.3em] text-radar-500">
              <span className="h-px w-8 bg-radar-500/50" />
              ALGORITHM CENTER
              <span className="h-px w-8 bg-radar-500/50" />
            </div>
            <h1 className="font-display text-4xl font-black text-white md:text-5xl">
              <span className="text-gradient-radar">2026 百度算法</span> 全景中心
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400">
              八大算法与底层排序机制详解，包含核心升级、管控重点、违规示例与合规建议，帮助站长精准规避降权风险
            </p>
          </motion.div>
        </div>
      </section>

      {/* 时间轴 */}
      <section className="container py-16">
        <SectionHeader tag="TIMELINE" title="2026 算法演进时间线" />
        <div className="relative mt-12">
          <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-radar-500/40 via-radar-500/20 to-transparent md:left-1/2" />
          <div className="space-y-8">
            {TIMELINE.map((item, i) => (
              <motion.div
                key={item.date}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`relative flex items-start gap-6 md:w-1/2 ${
                  i % 2 === 0 ? "md:ml-auto md:flex-row-reverse md:pl-8" : "md:pr-8"
                } pl-12 md:pl-0`}
              >
                <span className="absolute left-4 top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-radar-400 bg-void-950 shadow-glow-sm md:left-auto md:right-auto md:-translate-x-1/2"
                  style={i % 2 === 0 ? { right: "-4px", left: "auto" } : { left: "-4px" }}
                />
                <div className="panel panel-corner flex-1 p-4">
                  <div className="font-mono text-xs text-radar-400">{item.date}</div>
                  <h3 className="mt-1 font-display text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 算法详情 */}
      <section className="container py-16">
        <SectionHeader tag="ALGORITHMS" title="八大算法 / 机制详解" subtitle="点击查看每个算法的核心升级、管控重点、违规示例与合规建议" />
        <div className="mt-12 space-y-6">
          {ALGORITHM_META.map((algo, i) => {
            const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[algo.icon] || LucideIcons.Shield;
            return (
              <motion.article
                key={algo.id}
                id={algo.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.04 }}
                className="panel panel-corner scroll-mt-24 overflow-hidden"
              >
                <div className="h-1 w-full" style={{ background: algo.color }} />
                <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[280px_1fr]">
                  {/* 左侧标题区 */}
                  <div className="border-r border-radar-500/10 pr-0 lg:pr-6">
                    <span
                      className="grid h-14 w-14 place-items-center border"
                      style={{
                        borderColor: `${algo.color}55`,
                        color: algo.color,
                        backgroundColor: `${algo.color}10`,
                      }}
                    >
                      <Icon className="h-7 w-7" />
                    </span>
                    <h3 className="mt-4 font-display text-2xl font-black text-white">
                      {algo.name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs">
                      <span className="chip" style={{ color: algo.color, borderColor: `${algo.color}55` }}>
                        v{algo.version}
                      </span>
                      <span className="text-slate-500">{algo.category.toUpperCase()}</span>
                      <span className="text-slate-500">· 权重 {algo.weight}</span>
                    </div>
                  </div>

                  {/* 右侧详情 */}
                  <div className="space-y-4">
                    <div>
                      <div className="mb-1.5 font-mono text-[10px] tracking-wider text-radar-500">
                        核心升级
                      </div>
                      <p className="text-sm leading-relaxed text-slate-300">{algo.coreUpgrade}</p>
                    </div>

                    <div>
                      <div className="mb-1.5 font-mono text-[10px] tracking-wider text-radar-500">
                        管控重点
                      </div>
                      <ul className="space-y-1.5">
                        {algo.controlPoints.map((p, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="mt-1.5 h-1 w-1 shrink-0" style={{ background: algo.color }} />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="border border-alert-500/20 bg-alert-500/5 p-3">
                        <div className="mb-1.5 font-mono text-[10px] tracking-wider text-alert-400">
                          违规示例
                        </div>
                        <p className="text-xs leading-relaxed text-slate-300">{algo.violationExample}</p>
                      </div>
                      <div className="border border-pass-500/20 bg-pass-500/5 p-3">
                        <div className="mb-1.5 font-mono text-[10px] tracking-wider text-pass-400">
                          合规建议
                        </div>
                        <p className="text-xs leading-relaxed text-slate-300">{algo.complianceAdvice}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* 底层逻辑 */}
      <section className="container py-16">
        <SectionHeader
          tag="BOTTOM LOGIC"
          title="底层排序逻辑升级"
          subtitle="2026 年百度算法最核心的变化，影响远大于单个算法迭代"
        />
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          {BOTTOM_LOGIC.map((item, i) => {
            const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[item.icon] || LucideIcons.Cpu;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="panel panel-corner relative overflow-hidden p-6"
              >
                <div
                  className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 blur-3xl"
                  style={{ background: item.color }}
                />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-10 w-10 place-items-center border"
                      style={{ borderColor: `${item.color}55`, color: item.color, backgroundColor: `${item.color}10` }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-lg font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.points.map((p) => (
                      <span
                        key={p}
                        className="chip text-[10px]"
                        style={{ color: item.color, borderColor: `${item.color}40` }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </>
  );
}
