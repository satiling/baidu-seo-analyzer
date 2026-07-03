import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Copy,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
  Gauge,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { optimizeContent, type OptimizeResult } from "@/engine/contentOptimizer";
import { detectAiContent, type AiDetectionResult } from "@/engine/aiContentDetector";
import { matchAllRules } from "@/engine/ruleMatcher";
import { applyAiToFeatures } from "@/engine";
import type { PageFeatures } from "@/types/detection";

interface Props {
  /** 当前正文 */
  content: string;
  /** 当前 AI 检测结果 */
  aiResult: AiDetectionResult;
  /** 当前特征 */
  features: PageFeatures;
  /** 优化后重新检测的回调（更新整体报告） */
  onOptimized?: (content: string, aiResult: AiDetectionResult) => void;
}

export default function ContentOptimizer({ content, aiResult, features, onOptimized }: Props) {
  const [optimized, setOptimized] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showChanges, setShowChanges] = useState(false);

  const handleOptimize = () => {
    setLoading(true);
    // 模拟异步（实际是同步的，但给用户感知）
    setTimeout(() => {
      const result = optimizeContent(content, aiResult);
      setOptimized(result);
      setExpanded(true);
      setLoading(false);
    }, 600);
  };

  const handleCopy = async () => {
    if (!optimized) return;
    await navigator.clipboard.writeText(optimized.optimized);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReDetect = () => {
    if (!optimized || !onOptimized) return;
    const newAi = detectAiContent(optimized.optimized);
    // 先更新特征再调用回调
    const newFeatures = { ...features };
    applyAiToFeatures(newFeatures, newAi);
    onOptimized(optimized.optimized, newAi);
  };

  // 计算优化后的预期评分变化
  const scoreChange = useMemo(() => {
    if (!optimized) return null;
    const newAi = detectAiContent(optimized.optimized);
    const newFeatures = { ...features };
    applyAiToFeatures(newFeatures, newAi);
    const newDiagnoses = matchAllRules(newFeatures, newAi);
    const newHurricane = newDiagnoses.find((d) => d.algorithmId === "hurricane");
    return {
      aiScore: newAi.aiScore,
      aiLabel: newAi.verdictLabel,
      keywordDensity: newAi.keywordDensity,
      hurricaneScore: newHurricane?.score ?? 100,
      hurricaneStatus: newHurricane?.status ?? "pass",
    };
  }, [optimized, features]);

  return (
    <div className="border border-radar-500/20 bg-void-800/40">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-radar-500/10 p-4">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-radar-400" />
          <h3 className="font-display text-sm font-bold text-white">内容智能优化</h3>
          <span className="chip border-radar-500/40 text-radar-300">一键修复</span>
        </div>
        {!optimized && (
          <button
            onClick={handleOptimize}
            disabled={loading}
            className={`btn-primary ${loading ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> 优化中...
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5" /> 开始优化
              </>
            )}
          </button>
        )}
        {optimized && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="btn-ghost flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-pass-400" /> 已复制
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> 复制
                </>
              )}
            </button>
            <button
              onClick={handleReDetect}
              className="btn-primary flex items-center gap-1"
            >
              <Gauge className="h-3.5 w-3.5" /> 应用并重检
            </button>
          </div>
        )}
      </div>

      {/* 优化说明 */}
      <div className="border-b border-radar-500/10 px-4 py-2">
        <p className="text-xs leading-relaxed text-slate-400">
          基于飓风算法检测结果，自动优化正文：去 AI 套话、降关键词密度、删营销话术、破模板化结构。优化后点击「应用并重检」重新评估页面得分。
        </p>
      </div>

      {/* 预期评分变化 */}
      <AnimatePresence>
        {scoreChange && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-b border-radar-500/10 bg-radar-500/5 px-4 py-3"
          >
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="font-mono text-[10px] text-slate-500">AI 概率</div>
                <div className={`font-mono text-sm font-bold ${scoreChange.aiScore >= 60 ? "text-alert-400" : scoreChange.aiScore >= 40 ? "text-amber-glow" : "text-pass-400"}`}>
                  {scoreChange.aiScore}/100
                </div>
                <div className="font-mono text-[10px] text-slate-500">{scoreChange.aiLabel}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-slate-500">关键词密度</div>
                <div className={`font-mono text-sm font-bold ${scoreChange.keywordDensity > 0.08 ? "text-alert-400" : "text-pass-400"}`}>
                  {Math.round(scoreChange.keywordDensity * 100)}%
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-slate-500">飓风算法</div>
                <div className={`font-mono text-sm font-bold ${scoreChange.hurricaneStatus === "fail" ? "text-alert-400" : scoreChange.hurricaneStatus === "warn" ? "text-amber-glow" : "text-pass-400"}`}>
                  {scoreChange.hurricaneScore} 分
                </div>
                <div className="font-mono text-[10px] text-slate-500">
                  {scoreChange.hurricaneStatus === "pass" ? "通过" : scoreChange.hurricaneStatus === "warn" ? "警告" : "未通过"}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 优化后正文 */}
      <AnimatePresence>
        {optimized && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-b border-radar-500/10"
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-radar-400" />
                <span className="font-mono text-[10px] tracking-wider text-slate-500">
                  优化后正文（{optimized.stats.optimizedLen} 字）
                </span>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="text-slate-500 hover:text-radar-300"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto px-4 pb-3">
              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-radar-100">
                {optimized.optimized}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 折叠状态 */}
      <AnimatePresence>
        {optimized && !expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-radar-500/5"
            onClick={() => setExpanded(true)}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-radar-400" />
              <span className="font-mono text-xs text-radar-300">
                优化后正文（{optimized.stats.optimizedLen} 字）— 点击展开
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 变更详情 */}
      <AnimatePresence>
        {optimized && optimized.changes.length > 0 && (
          <div className="border-t border-radar-500/10 px-4 py-3">
            <button
              onClick={() => setShowChanges(!showChanges)}
              className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 hover:text-radar-300"
            >
              {showChanges ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              变更详情（{optimized.changes.length} 条）
            </button>
            <AnimatePresence>
              {showChanges && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 space-y-1"
                >
                  {optimized.changes.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 font-mono text-[11px] leading-relaxed text-slate-400"
                    >
                      <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-radar-500" />
                      {c}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}