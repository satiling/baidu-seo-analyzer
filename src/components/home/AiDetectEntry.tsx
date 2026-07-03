import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ScanText, ArrowRight, Sparkles, AlertTriangle } from "lucide-react";
import { SectionHeader } from "./CapabilityGrid";

const FEATURES = [
  { label: "套话模板匹配", desc: "80+ AI 高频套话库" },
  { label: "困惑度计算", desc: "2-gram 频率熵分析" },
  { label: "突发性分析", desc: "句长变异系数" },
  { label: "词汇多样性", desc: "TTR 词汇重复率" },
  { label: "连接词密度", desc: "AI 偏爱连接词" },
  { label: "段落同质化", desc: "段落长度方差" },
];

export default function AiDetectEntry() {
  return (
    <section className="container py-20">
      <SectionHeader
        tag="AIGC DETECTION"
        title="AI 内容专项检测器"
        subtitle="飓风算法 4.0 核心打击对象 · 粘贴文本即可一眼识别 AI 生成内容"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="panel panel-corner mt-12 overflow-hidden"
      >
        {/* 顶部色条 */}
        <div className="h-1 w-full bg-gradient-to-r from-alert-500 via-amber-glow to-radar-500" />

        <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1.2fr_1fr]">
          {/* 左侧：说明 */}
          <div>
            <div className="inline-flex items-center gap-2 border border-alert-500/30 bg-alert-500/5 px-3 py-1 font-mono text-xs text-alert-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              飓风算法 4.0 专项打击
            </div>
            <h3 className="mt-4 font-display text-2xl font-black text-white">
              对 AI 生成的文章，<span className="text-gradient-radar">一眼就可以查出来</span>
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              纯 URL 检测无法识别 AI 正文。本检测器让你粘贴正文文本，基于六大维度文本统计分析，
              精准识别 AI 生成内容。覆盖 GPT / Claude / 文心 / 通义 / 豆包等主流模型生成特征。
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.label}
                  className="border border-radar-500/15 bg-void-950/40 p-2.5"
                >
                  <div className="font-mono text-[11px] text-radar-300">{f.label}</div>
                  <div className="mt-0.5 text-[10px] text-slate-500">{f.desc}</div>
                </div>
              ))}
            </div>

            <Link to="/ai-detect" className="btn-primary mt-6 inline-flex">
              <ScanText className="h-4 w-4" />
              立即检测 AI 内容
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* 右侧：演示卡片 */}
          <div className="relative">
            <div className="absolute -right-4 -top-4 z-10 chip border-alert-500/40 bg-alert-500/10 text-alert-400">
              <Sparkles className="h-3 w-3" />
              演示效果
            </div>
            <div className="space-y-2">
              {/* AI 样本演示 */}
              <div className="border border-alert-500/30 bg-alert-500/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-alert-400">AI 生成样本</span>
                  <span className="font-display text-2xl font-black text-alert-500">87</span>
                </div>
                <div className="mt-1 h-1 w-full bg-void-700">
                  <div className="h-full bg-alert-500" style={{ width: "87%" }} />
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  "在当今数字化时代，AI 技术的发展可谓日新月异..."
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="chip text-[9px] border-alert-500/40 text-alert-400">开头套话 ×1</span>
                  <span className="chip text-[9px] border-alert-500/40 text-alert-400">结尾套话 ×2</span>
                </div>
              </div>

              {/* 人类样本演示 */}
              <div className="border border-pass-500/30 bg-pass-500/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-pass-400">人类原创样本</span>
                  <span className="font-display text-2xl font-black text-pass-500">18</span>
                </div>
                <div className="mt-1 h-1 w-full bg-void-700">
                  <div className="h-full bg-pass-500" style={{ width: "18%" }} />
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  "上周三下午，我把跑了三年的老站日志翻出来..."
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="chip text-[9px] border-pass-500/40 text-pass-400">无套话命中</span>
                  <span className="chip text-[9px] border-pass-500/40 text-pass-400">突发性高</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
