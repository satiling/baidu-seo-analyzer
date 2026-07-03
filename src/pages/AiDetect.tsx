import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanText,
  Sparkles,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Hash,
  Type,
  Link2,
  AlignLeft,
} from "lucide-react";
import { detectAiContent, type AiDetectionResult } from "@/engine/aiContentDetector";
import { CATEGORY_LABEL } from "@/data/aiTemplates";
import RadarChart from "@/components/report/RadarChart";

const SAMPLES = [
  {
    label: "AI 生成样本",
    text: `在当今数字化时代，人工智能技术的发展可谓日新月异。随着AI技术的不断进步，我们的日常生活发生了翻天覆地的变化。值得注意的是，AI不仅在科技领域发挥着重要作用，更是各行各业转型升级的关键驱动力。

首先，AI技术能够显著提升工作效率。通过自动化处理重复性任务，企业可以将更多精力投入到核心业务中。其次，AI在大数据分析方面的能力举足轻重，能够帮助企业做出更精准的决策。最后，AI还在客服、营销等环节展现出不可或缺的价值。

综上所述，AI技术既是机遇也是挑战。只有积极拥抱变化，才能在激烈的市场竞争中立于不败之地。希望本文能够帮助你更好地理解AI的价值，让我们一起迎接智能时代的到来。`,
  },
  {
    label: "人类原创样本",
    text: `上周三下午，我把跑了三年的老站日志翻出来重新看了一遍。

说真的，不看不知道，一看吓一跳。2023 年那会儿我写的文章，平均停留时长 2 分 40 秒，跳出率才 38%。去年开始用 AI 批量生成之后，停留时长直接掉到 47 秒，跳出率飙到 72%。

我当时还纳闷，明明文章更长、排版更整齐了，数据怎么反而崩了？后来用百度统计的热力图一看才明白——读者根本没往下滚。AI 写的东西开头太套路了，"在当今XX时代"一出来，人家直接关页面。

所以上个月我做了一个决定：把 AI 生成的 200 多篇文章全删了，只留 30 篇人工写的。你猜怎么着？一周后收录量反而涨了 15%，有个长尾词还冲到了百度第二页。

这事儿给我的教训很简单：百度现在真不傻，它分得清什么是人写的，什么是机器凑的。`,
  },
];

export default function AiContentDetector() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AiDetectionResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const charCount = text.length;
  const canAnalyze = charCount >= 50;

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    setAnalyzing(true);
    // 模拟短暂分析延迟以展示动效
    setTimeout(() => {
      const r = detectAiContent(text);
      setResult(r);
      setAnalyzing(false);
    }, 600);
  };

  const handleClear = () => {
    setText("");
    setResult(null);
  };

  const handleSample = (sampleText: string) => {
    setText(sampleText);
    setResult(null);
  };

  return (
    <div className="container py-10">
      {/* 头部 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="mb-3 inline-flex items-center gap-2 border border-radar-500/30 bg-radar-500/5 px-3 py-1 font-mono text-xs tracking-wider text-radar-300">
          <span className="h-1.5 w-1.5 animate-pulse bg-amber-glow" />
          飓风算法 4.0 · AI 内容专项检测
        </div>
        <h1 className="font-display text-4xl font-black text-white md:text-5xl">
          <span className="text-gradient-radar">AIGC</span> 内容检测器
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400">
          粘贴正文文本，基于困惑度、突发性、套话模板、词汇多样性、连接词密度、段落同质化六大维度，一眼识别 AI 生成内容
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* 左侧：输入区 */}
        <div className="space-y-4">
          <div className="panel panel-corner overflow-hidden">
            <div className="flex items-center justify-between border-b border-radar-500/15 bg-void-950/60 px-4 py-2.5">
              <div className="flex items-center gap-2 font-mono text-xs text-radar-300">
                <ScanText className="h-4 w-4" />
                粘贴正文文本
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-slate-500">
                  {charCount} 字
                </span>
                {text && (
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1 font-mono text-[10px] text-slate-500 hover:text-alert-400"
                  >
                    <Trash2 className="h-3 w-3" /> 清空
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="在此粘贴网页正文内容进行 AI 痕迹检测...&#10;&#10;支持中文长文本，建议至少 200 字以上以获得更准确的分析结果。&#10;检测维度：套话模板 / 困惑度 / 突发性 / 词汇多样性 / 连接词密度 / 段落同质化"
              className="h-80 w-full resize-none bg-transparent p-4 font-sans text-sm leading-relaxed text-radar-100 placeholder:text-slate-600 focus:outline-none"
              spellCheck={false}
            />
            <div className="border-t border-radar-500/15 p-3">
              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze || analyzing}
                className={`btn-primary w-full ${(!canAnalyze || analyzing) ? "cursor-not-allowed opacity-40" : ""}`}
              >
                {analyzing ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    启动 AI 痕迹检测
                  </>
                )}
              </button>
              {!canAnalyze && (
                <p className="mt-2 text-center font-mono text-[10px] text-slate-500">
                  至少需要 50 字才能进行分析
                </p>
              )}
            </div>
          </div>

          {/* 示例样本 */}
          <div className="panel panel-corner p-4">
            <div className="mb-3 flex items-center gap-2 font-mono text-xs text-radar-300">
              <FileText className="h-3.5 w-3.5" />
              示例样本（点击载入对比）
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSample(s.text)}
                  className="border border-radar-500/20 bg-void-950/40 p-3 text-left transition-colors hover:border-radar-500/40 hover:bg-radar-500/5"
                >
                  <div className="font-mono text-[10px] text-radar-400">{s.label}</div>
                  <div className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                    {s.text.slice(0, 50)}...
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：检测结果 */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!result && !analyzing && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="panel panel-corner flex h-96 flex-col items-center justify-center p-8 text-center"
              >
                <ScanText className="h-12 w-12 text-slate-600" />
                <h3 className="mt-4 font-display text-lg font-bold text-slate-400">
                  等待检测
                </h3>
                <p className="mt-2 max-w-xs text-sm text-slate-500">
                  粘贴正文文本并点击检测按钮，结果将在此显示。可先点击左侧"AI 生成样本"体验效果。
                </p>
              </motion.div>
            )}

            {analyzing && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="panel panel-corner flex h-96 flex-col items-center justify-center p-8 text-center"
              >
                <Sparkles className="h-12 w-12 animate-pulse text-radar-400" />
                <h3 className="mt-4 font-display text-lg font-bold text-radar-300">
                  正在分析 AI 痕迹
                </h3>
                <p className="mt-2 font-mono text-xs text-slate-500">
                  六维文本特征分析中...
                </p>
                <div className="mt-4 w-48 space-y-1.5">
                  {["套话模板匹配", "困惑度计算", "突发性分析", "词汇多样性", "连接词密度", "段落同质化"].map((s, i) => (
                    <motion.div
                      key={s}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 font-mono text-[10px] text-radar-400"
                    >
                      <span className="h-1 w-1 animate-pulse rounded-full bg-pass-500" />
                      {s}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {result && !analyzing && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <AiScoreCard result={result} />
                <AiRadarCard result={result} />
                <AiTemplateCard result={result} />
                <AiSentenceCard result={result} />
                <AiEvidenceCard result={result} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ============ AI 评分卡 ============

function AiScoreCard({ result }: { result: AiDetectionResult }) {
  const color =
    result.aiScore >= 80 ? "#FF3D5A" :
    result.aiScore >= 60 ? "#FFB300" :
    result.aiScore >= 40 ? "#5DECFF" : "#00E676";
  const Icon =
    result.aiScore >= 60 ? AlertTriangle :
    result.aiScore >= 40 ? Sparkles : CheckCircle2;

  return (
    <div className="panel panel-corner p-6">
      <div className="flex items-center gap-5">
        {/* 大分数环 */}
        <ScoreRing score={result.aiScore} color={color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" style={{ color }} />
            <h3 className="font-display text-xl font-black" style={{ color }}>
              {result.verdictLabel}
            </h3>
          </div>
          <div className="mt-1 font-mono text-xs text-slate-500">
            AI 生成概率评估
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px]">
            <Stat label="总字数" value={`${result.stats.charCount}`} />
            <Stat label="句子数" value={`${result.stats.sentenceCount}`} />
            <Stat label="段落数" value={`${result.stats.paragraphCount}`} />
            <Stat label="套话命中" value={`${result.stats.templateCount} 处`} />
            <Stat label="连接词" value={`${result.stats.connectorCount} 处`} />
            <Stat label="平均句长" value={`${result.stats.avgSentenceLen} 字`} />
          </div>
        </div>
      </div>
      {result.stats.titleMatch && (
        <div className="mt-4 flex items-start gap-2 border border-alert-500/30 bg-alert-500/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-alert-400" />
          <div className="text-xs text-slate-300">
            <span className="font-bold text-alert-400">标题命中 AI 模板：</span>
            匹配模式 "{result.stats.titlePattern}"，疑似 AI 引流标题。
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 140;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(31,217,255,0.1)" strokeWidth={stroke} />
        <motion.circle
          cx={cx} cy={cx} r={r} fill="none" stroke="url(#ai-grad)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="font-display text-3xl font-black tabular-nums"
          style={{ color, textShadow: `0 0 16px ${color}60` }}
        >
          {score}
        </motion.div>
        <div className="font-mono text-[9px] text-slate-500">AI 概率</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border border-radar-500/10 bg-void-950/40 px-2 py-1">
      <span className="text-slate-500">{label}</span>
      <span className="text-radar-300">{value}</span>
    </div>
  );
}

// ============ 六维雷达图 ============

function AiRadarCard({ result }: { result: AiDetectionResult }) {
  const m = result.metrics;
  // 统一转换成"AI 特征强度"（越高越像 AI）
  const data = [
    { label: "套话率", value: m.templateRate },
    { label: "困惑度低", value: 100 - m.perplexity },
    { label: "突发性低", value: 100 - m.burstiness },
    { label: "词汇重复", value: 100 - m.ttr },
    { label: "连接词密", value: m.connectorRate },
    { label: "段落同质", value: m.paragraphHomogeneity },
  ];
  const color = result.aiScore >= 60 ? "#FF3D5A" : result.aiScore >= 40 ? "#FFB300" : "#00E676";

  return (
    <div className="panel panel-corner p-6">
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="h-5 w-5 text-radar-400" />
        <h3 className="font-display text-lg font-bold text-white">六维 AI 特征雷达</h3>
      </div>
      <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-around">
        <RadarChart data={data} size={260} color={color} />
        <div className="grid w-full max-w-xs grid-cols-1 gap-2">
          <MetricBar label="套话模板率" value={m.templateRate} icon={Type} color="#FF3D5A" desc="越高越像 AI" />
          <MetricBar label="连接词密度" value={m.connectorRate} icon={Link2} color="#FFB300" desc="越高越像 AI" />
          <MetricBar label="段落同质化" value={m.paragraphHomogeneity} icon={AlignLeft} color="#FF6B81" desc="越高越像 AI" />
          <MetricBar label="困惑度低" value={100 - m.perplexity} icon={Hash} color="#5DECFF" desc="越高越像 AI" />
          <MetricBar label="突发性低" value={100 - m.burstiness} icon={Hash} color="#5DECFF" desc="越高越像 AI" />
          <MetricBar label="词汇重复" value={100 - m.ttr} icon={Type} color="#FFB300" desc="越高越像 AI" />
        </div>
      </div>
    </div>
  );
}

function MetricBar({
  label, value, icon: Icon, color, desc,
}: {
  label: string; value: number; icon: typeof Type; color: string; desc: string;
}) {
  return (
    <div className="border-l-2 pl-2" style={{ borderColor: color }}>
      <div className="flex items-center gap-2">
        <Icon className="h-3 w-3" style={{ color }} />
        <span className="text-xs text-slate-300">{label}</span>
        <span className="ml-auto font-mono text-xs font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="mt-1 h-1 w-full bg-void-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full"
          style={{ background: color }}
        />
      </div>
      <div className="mt-0.5 font-mono text-[9px] text-slate-600">{desc}</div>
    </div>
  );
}

// ============ 套话命中详情 ============

function AiTemplateCard({ result }: { result: AiDetectionResult }) {
  if (result.matchedTemplates.length === 0) {
    return (
      <div className="panel panel-corner p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-pass-500" />
          <h3 className="font-display text-lg font-bold text-pass-400">未命中 AI 套话模板</h3>
        </div>
        <p className="mt-2 text-sm text-slate-400">文本未出现 AI 高频套话，套话维度合规。</p>
      </div>
    );
  }

  return (
    <div className="panel panel-corner p-6">
      <div className="mb-4 flex items-center gap-2">
        <Type className="h-5 w-5 text-alert-400" />
        <h3 className="font-display text-lg font-bold text-white">AI 套话命中详情</h3>
        <span className="chip border-alert-500/40 text-alert-400">
          {result.matchedTemplates.length} 类 · {result.stats.templateCount} 处
        </span>
      </div>

      {/* 类别统计 */}
      {result.templateStats.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {result.templateStats.map((s) => {
            const cfg = CATEGORY_LABEL[s.category];
            return (
              <span
                key={s.category}
                className="chip text-[10px]"
                style={{ color: cfg.color, borderColor: `${cfg.color}55` }}
              >
                {cfg.label} × {s.count}
              </span>
            );
          })}
        </div>
      )}

      {/* 命中列表 */}
      <div className="max-h-72 space-y-2 overflow-y-auto">
        {result.matchedTemplates.map((m, i) => {
          const cfg = CATEGORY_LABEL[m.category];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 border-l-2 p-2"
              style={{ borderColor: cfg.color }}
            >
              <span
                className="chip shrink-0 text-[10px]"
                style={{ color: cfg.color, borderColor: `${cfg.color}55` }}
              >
                {cfg.label}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs text-radar-100">/{m.pattern}/</code>
                  <span className="font-mono text-[10px] text-alert-400">× {m.occurrence}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">{m.note}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============ 逐句分析 ============

function AiSentenceCard({ result }: { result: AiDetectionResult }) {
  if (result.sentences.length === 0) return null;
  const templateSentences = result.sentences.filter((s) => s.isTemplate);

  return (
    <div className="panel panel-corner p-6">
      <div className="mb-4 flex items-center gap-2">
        <AlignLeft className="h-5 w-5 text-radar-400" />
        <h3 className="font-display text-lg font-bold text-white">逐句 AI 痕迹分析</h3>
        <span className="ml-auto font-mono text-[10px] text-slate-500">
          {templateSentences.length}/{result.sentences.length} 句命中模板
        </span>
      </div>
      <div className="max-h-96 space-y-1.5 overflow-y-auto">
        {result.sentences.map((s, i) => {
          const color =
            s.aiLikelihood >= 60 ? "#FF3D5A" :
            s.aiLikelihood >= 35 ? "#FFB300" : "#00E676";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-start gap-2 border-l-2 p-2"
              style={{ borderColor: s.isTemplate ? color : "rgba(31,217,255,0.1)" }}
            >
              <span className="mt-0.5 shrink-0 font-mono text-[10px] text-slate-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="min-w-0 flex-1 text-xs leading-relaxed text-slate-300">
                {s.text}
              </p>
              {s.isTemplate && (
                <span
                  className="chip shrink-0 text-[9px]"
                  style={{ color, borderColor: `${color}55` }}
                >
                  AI {s.aiLikelihood}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============ 证据列表 ============

function AiEvidenceCard({ result }: { result: AiDetectionResult }) {
  return (
    <div className="panel panel-corner p-6">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-glow" />
        <h3 className="font-display text-lg font-bold text-white">检测证据</h3>
      </div>
      <div className="space-y-2">
        {result.evidence.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-2 text-xs text-slate-300"
          >
            <span className="mt-0.5 font-mono text-[10px] text-radar-500">
              [{String(i + 1).padStart(2, "0")}]
            </span>
            <span className="leading-relaxed">{e}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 border-t border-radar-500/10 pt-3 font-mono text-[10px] text-slate-500">
        * 本检测基于文本统计分析，AI 概率仅供参考。建议结合人工复核与百度搜索资源平台数据综合判断。
      </div>
    </div>
  );
}
