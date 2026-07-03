import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RefreshCw,
} from "lucide-react";
// CheckCircle2 已在上方导入
import { detectAiContent, type AiDetectionResult } from "@/engine/aiContentDetector";
import { CATEGORY_LABEL } from "@/data/aiTemplates";

interface Props {
  /** 初始 AIGC 检测结果（URL 检测时已粘贴过正文则传入） */
  initialResult?: AiDetectionResult;
  /** 初始正文 */
  initialContent?: string;
  /** 是否自动抓取的正文 */
  autoFetched?: boolean;
  /** 回调：检测完成后通知父组件更新整体报告 */
  onReDetect?: (content: string, aiResult: AiDetectionResult) => void;
}

/**
 * 正文深度检测组件
 * 让用户粘贴页面正文，触发飓风算法 AIGC 精确检测
 */
export default function ContentDeepScan({ initialResult, initialContent, autoFetched, onReDetect }: Props) {
  const [text, setText] = useState(initialContent || "");
  const [result, setResult] = useState<AiDetectionResult | undefined>(initialResult);
  const [analyzing, setAnalyzing] = useState(false);

  const charCount = text.length;
  const canAnalyze = charCount >= 50;

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    setAnalyzing(true);
    setTimeout(() => {
      const r = detectAiContent(text);
      setResult(r);
      setAnalyzing(false);
      onReDetect?.(text, r);
    }, 600);
  };

  return (
    <div className="panel panel-corner overflow-hidden">
      {/* 头部 */}
      <div className="border-b border-alert-500/20 bg-alert-500/5 p-4">
        <div className="flex items-center gap-2">
          <ScanText className="h-5 w-5 text-alert-400" />
          <h3 className="font-display text-lg font-bold text-white">
            飓风算法 · 正文深度检测
          </h3>
          <span className="chip border-alert-500/40 text-alert-400">AIGC 精确检测</span>
          {autoFetched && initialResult && (
            <span className="chip border-pass-500/40 text-pass-400">
              <CheckCircle2 className="h-3 w-3" /> 已自动抓取
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {autoFetched && initialResult
            ? "已通过 Baiduspider 自动抓取页面正文并完成 AIGC 检测。可在左侧修改正文后重新检测。"
            : "粘贴页面正文，基于六大维度文本统计精确识别 AI 生成内容，结果将实时更新飓风算法诊断。"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_1.1fr]">
        {/* 左：输入区 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-radar-400">粘贴页面正文</span>
            <span className="font-mono text-[10px] text-slate-500">{charCount} 字</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="粘贴网页正文内容（建议 200 字以上）&#10;检测维度：套话模板 / 困惑度 / 突发性 / 词汇多样性 / 连接词密度 / 段落同质化"
            className="h-64 w-full resize-none border border-radar-500/15 bg-void-950/60 p-3 font-sans text-xs leading-relaxed text-radar-100 placeholder:text-slate-600 focus:border-radar-500/40 focus:outline-none"
            spellCheck={false}
          />
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze || analyzing}
            className={`btn-primary mt-2 w-full ${(!canAnalyze || analyzing) ? "cursor-not-allowed opacity-40" : ""}`}
          >
            {analyzing ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" /> 分析中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> 启动 AIGC 检测并更新飓风算法
              </>
            )}
          </button>
          {!canAnalyze && (
            <p className="mt-1 text-center font-mono text-[10px] text-slate-500">
              至少需要 50 字才能进行分析
            </p>
          )}
        </div>

        {/* 右：结果区 */}
        <div>
          <AnimatePresence mode="wait">
            {!result && !analyzing && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-64 flex-col items-center justify-center border border-dashed border-radar-500/15 p-4 text-center"
              >
                <FileText className="h-8 w-8 text-slate-600" />
                <p className="mt-3 text-xs text-slate-500">
                  粘贴正文后点击检测，AIGC 结果将在此显示并同步更新飓风算法诊断
                </p>
              </motion.div>
            )}

            {analyzing && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-64 flex-col items-center justify-center border border-radar-500/15 p-4 text-center"
              >
                <Sparkles className="h-8 w-8 animate-pulse text-radar-400" />
                <p className="mt-3 font-mono text-xs text-radar-300">六维文本分析中...</p>
              </motion.div>
            )}

            {result && !analyzing && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {/* 评分卡 */}
                <AiScoreCard result={result} />

                {/* 套话命中 */}
                {result.matchedTemplates.length > 0 && (
                  <div className="border border-alert-500/20 bg-void-950/40 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-alert-400" />
                      <span className="font-mono text-[10px] text-alert-400">
                        AI 套话命中 {result.stats.templateCount} 处
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.matchedTemplates.slice(0, 6).map((m, i) => {
                        const cfg = CATEGORY_LABEL[m.category];
                        return (
                          <span
                            key={i}
                            className="chip text-[9px]"
                            style={{ color: cfg.color, borderColor: `${cfg.color}55` }}
                          >
                            {cfg.label} ×{m.occurrence}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 关键指标 */}
                <div className="grid grid-cols-3 gap-2">
                  <Metric label="套话率" value={result.metrics.templateRate} />
                  <Metric label="困惑度" value={result.metrics.perplexity} />
                  <Metric label="突发性" value={result.metrics.burstiness} />
                  <Metric label="TTR" value={result.metrics.ttr} />
                  <Metric label="连接词" value={result.metrics.connectorRate} />
                  <Metric label="同质化" value={result.metrics.paragraphHomogeneity} />
                </div>

                {/* 更新提示 */}
                <div className="flex items-center gap-2 border border-pass-500/20 bg-pass-500/5 p-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-pass-400" />
                  <span className="text-[10px] text-pass-400">
                    飓风算法诊断已基于正文检测结果实时更新
                  </span>
                  <RefreshCw className="ml-auto h-3 w-3 text-pass-400" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function AiScoreCard({ result }: { result: AiDetectionResult }) {
  const color =
    result.aiScore >= 80 ? "#FF3D5A" :
    result.aiScore >= 60 ? "#FFB300" :
    result.aiScore >= 40 ? "#5DECFF" : "#00E676";
  const Icon =
    result.aiScore >= 60 ? AlertTriangle :
    result.aiScore >= 40 ? Sparkles : CheckCircle2;

  return (
    <div className="flex items-center gap-3 border p-3" style={{ borderColor: `${color}40`, background: `${color}08` }}>
      <div className="relative grid h-16 w-16 shrink-0 place-items-center">
        <svg width={64} height={64} className="-rotate-90">
          <circle cx={32} cy={32} r={26} fill="none" stroke="rgba(31,217,255,0.1)" strokeWidth={5} />
          <motion.circle
            cx={32} cy={32} r={26} fill="none" stroke={color} strokeWidth={5}
            strokeLinecap="round" strokeDasharray={2 * Math.PI * 26}
            initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - result.aiScore / 100) }}
            transition={{ duration: 1 }}
            style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
          />
        </svg>
        <span className="absolute font-display text-base font-black" style={{ color }}>
          {result.aiScore}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Icon className="h-4 w-4" style={{ color }} />
          <span className="font-display text-sm font-bold" style={{ color }}>
            {result.verdictLabel}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-slate-400">
          套话 {result.stats.templateCount} 处 · 连接词 {result.stats.connectorCount} 处 · {result.stats.sentenceCount} 句
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  const color = value >= 60 ? "#FF3D5A" : value >= 35 ? "#FFB300" : "#00E676";
  return (
    <div className="border border-radar-500/10 bg-void-950/40 p-2 text-center">
      <div className="font-mono text-[9px] text-slate-500">{label}</div>
      <div className="font-display text-sm font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
