import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Gauge,
  Bug,
  Database,
  KeyRound,
  Wrench,
  Search,
  Radar,
  RefreshCw,
  ShieldAlert,
  ScanLine,
  Info,
  ScanText,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { detectPage, applyAiToFeatures, parseUrl } from "@/engine";
import type { DetectionResult } from "@/types/detection";
import type { AiDetectionResult } from "@/engine/aiContentDetector";
import { matchAllRules } from "@/engine/ruleMatcher";
import { calculateOverallScore } from "@/engine/scorer";
import { simulateSpider } from "@/engine/spiderSimulator";
import { predictInclusion } from "@/engine/inclusionPredictor";
import { predictKeywords } from "@/engine/keywordPredictor";
import { generateRemediation } from "@/engine/remediationGenerator";
import ScanTerminal from "@/components/report/ScanTerminal";
import ScoreDashboard from "@/components/report/ScoreDashboard";
import AlgorithmDiagnosisCard from "@/components/report/AlgorithmDiagnosisCard";
import SpiderSimulator from "@/components/report/SpiderSimulator";
import InclusionPrediction from "@/components/report/InclusionPrediction";
import KeywordPrediction from "@/components/report/KeywordPrediction";
import RemediationList from "@/components/report/RemediationList";
import ContentDeepScan from "@/components/report/ContentDeepScan";
import ContentOptimizer from "@/components/report/ContentOptimizer";

const SECTIONS = [
  { id: "score", label: "综合评分", icon: Gauge },
  { id: "deepscan", label: "正文深度检测", icon: ScanText },
  { id: "diagnosis", label: "算法诊断", icon: ShieldAlert },
  { id: "spider", label: "蜘蛛模拟", icon: Bug },
  { id: "inclusion", label: "收录预测", icon: Database },
  { id: "keyword", label: "关键词预测", icon: KeyRound },
  { id: "remediation", label: "整改清单", icon: Wrench },
];

export default function Report() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const url = params.get("u") || "";

  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("准备中");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualAnalyzing, setManualAnalyzing] = useState(false);
  const [manualError, setManualError] = useState("");

  useEffect(() => {
    if (!url) {
      setError("缺少检测 URL，请返回首页输入");
      return;
    }
    let cancelled = false;
    setResult(null);
    setProgress(0);
    setError("");
    setManualContent("");
    setManualError("");
    detectPage(url, {
      onProgress: (pct, stageText) => {
        if (cancelled) return;
        setProgress(pct);
        setStage(stageText);
      },
    })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "检测失败");
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  /** 抓取失败后，用户手动粘贴正文重新检测 */
  const handleManualDetect = useCallback(async () => {
    const trimmed = manualContent.trim();
    if (trimmed.length < 50) {
      setManualError("正文过短，至少需要 50 字才能进行真实检测");
      return;
    }
    setManualAnalyzing(true);
    setManualError("");
    setProgress(0);
    try {
      const res = await detectPage(url, {
        pageContent: trimmed,
        autoFetch: false,
        onProgress: (pct, stageText) => {
          setProgress(pct);
          setStage(stageText);
        },
      });
      setResult(res);
      setError("");
    } catch (err) {
      setManualError((err as Error).message || "检测失败");
    } finally {
      setManualAnalyzing(false);
    }
  }, [manualContent, url]);

  /** 正文深度检测后重新计算整体报告 */
  const handleReDetect = useCallback(
    (content: string, aiResult: AiDetectionResult) => {
      if (!result) return;
      // 用真实检测结果覆盖特征（复用引擎单一数据源，保持与首次检测一致）
      const features = { ...result.features };
      applyAiToFeatures(features, aiResult);
      // 重算所有指标
      const diagnoses = matchAllRules(features, aiResult);
      const { score, grade, gradeLabel } = calculateOverallScore(diagnoses, features);
      const spiderAffinity = simulateSpider(features, score);
      const inclusionPrediction = predictInclusion(features, score);
      const keywordPrediction = predictKeywords(features, score);
      const remediation = generateRemediation(diagnoses);
      setResult({
        ...result,
        features,
        diagnoses,
        overallScore: score,
        grade,
        gradeLabel,
        spiderAffinity,
        inclusionPrediction,
        keywordPrediction,
        remediation,
        pageContent: content,
        aiDetection: aiResult,
      });
    },
    [result],
  );

  if (!url) {
    return (
      <div className="container py-20 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-amber-glow" />
        <h2 className="mt-4 font-display text-xl font-bold text-white">
          缺少检测目标
        </h2>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          <ArrowLeft className="h-4 w-4" /> 返回首页
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-2xl">
          {/* 错误提示 */}
          <div className="text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-alert-500" />
            <h2 className="mt-4 font-display text-xl font-bold text-white">无法自动抓取页面正文</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{error}</p>
          </div>

          {/* 手动粘贴正文入口 */}
          <div className="mt-8 border border-radar-500/20 bg-void-800/40 p-5">
            <div className="mb-3 flex items-center gap-2">
              <ScanText className="h-4 w-4 text-radar-400" />
              <h3 className="font-display text-sm font-bold text-white">手动粘贴页面正文检测</h3>
              <span className="chip border-radar-500/40 text-radar-300">推荐</span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-slate-400">
              请打开目标网页（<span className="font-mono text-radar-300">{url}</span>），复制正文文字粘贴到下方框中，系统将基于真实正文进行八大算法检测，确保评分真实可靠。
            </p>
            <textarea
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
              placeholder="在此粘贴网页正文内容（建议 200 字以上）&#10;仅基于真实正文检测，不会产生幻觉数据"
              className="h-48 w-full resize-none border border-radar-500/15 bg-void-950/60 p-3 font-sans text-xs leading-relaxed text-radar-100 placeholder:text-slate-600 focus:border-radar-500/40 focus:outline-none"
              spellCheck={false}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-500">
                {manualContent.trim().length} 字 · 至少 50 字
              </span>
              <button
                onClick={handleManualDetect}
                disabled={manualAnalyzing || manualContent.trim().length < 50}
                className={`btn-primary ${(manualAnalyzing || manualContent.trim().length < 50) ? "cursor-not-allowed opacity-40" : ""}`}
              >
                {manualAnalyzing ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" /> 检测中...
                  </>
                ) : (
                  <>
                    <Radar className="h-4 w-4" /> 基于正文检测
                  </>
                )}
              </button>
            </div>
            {manualError && (
              <div className="mt-2 border border-alert-500/40 bg-alert-500/10 px-3 py-2 font-mono text-[11px] text-alert-400">
                {manualError}
              </div>
            )}
            {manualAnalyzing && (
              <div className="mt-3">
                <ScanTerminal url={url} stage={stage} progress={progress} />
              </div>
            )}
          </div>

          {/* 其他操作 */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/report?u=${encodeURIComponent(url)}`)}
              className="btn-ghost"
            >
              <RefreshCw className="h-3.5 w-3.5" /> 重新抓取
            </button>
            <Link to="/" className="btn-ghost">
              <ArrowLeft className="h-3.5 w-3.5" /> 返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 扫描中
  if (!result) {
    return (
      <div className="container py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <ScanLine className="h-6 w-6 animate-pulse text-radar-400" />
            <div>
              <h1 className="font-display text-xl font-bold text-white">
                正在扫描检测
              </h1>
              <p className="font-mono text-xs text-radar-500">{url}</p>
            </div>
          </div>
          <ScanTerminal url={url} stage={stage} progress={progress} />
          <div className="mt-4 text-center font-mono text-xs text-slate-500">
            预计 2 秒内完成 · 模拟 Baiduspider 全流程抓取
          </div>
        </div>
      </div>
    );
  }

  // 报告展示
  return (
    <div className="container py-8">
      {/* 顶部信息条 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-wrap items-center gap-3"
      >
        <Link
          to="/"
          className="flex items-center gap-1.5 font-mono text-xs text-slate-400 hover:text-radar-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> 返回
        </Link>
        <span className="text-slate-600">/</span>
        <span className="font-mono text-xs text-radar-300">检测报告</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate(`/report?u=${encodeURIComponent(url)}`)}
            className="btn-ghost"
          >
            <RefreshCw className="h-3.5 w-3.5" /> 重新检测
          </button>
        </div>
      </motion.div>

      {/* 快速重查框：无需返回首页即可检测新 URL */}
      <RecheckBar currentUrl={url} onRecheck={(u) => navigate(`/report?u=${encodeURIComponent(u)}`)} />

      <div className="mb-6 flex flex-wrap items-center gap-3 border border-radar-500/15 bg-void-800/40 p-4">
        <ScanLine className="h-5 w-5 text-radar-400" />
        <div className="min-w-0">
          <div className="font-mono text-[10px] tracking-wider text-slate-500">
            DETECTED URL
          </div>
          <div className="truncate font-mono text-sm text-radar-200">{result.url}</div>
        </div>
        <div className="ml-auto flex items-center gap-4 font-mono text-xs">
          <div>
            <span className="text-slate-500">域名：</span>
            <span className="text-radar-300">{result.features.domain}</span>
          </div>
          <div>
            <span className="text-slate-500">备案：</span>
            <span className={result.features.isRegistered ? "text-pass-400" : "text-alert-400"}>
              {result.features.isRegistered ? "已备案" : "未备案"}
            </span>
          </div>
        </div>
      </div>

      {/* 抓取状态提示 */}
      <FetchStatusBanner result={result} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
        {/* 粘性侧边导航 */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            <div className="mb-3 font-mono text-[10px] tracking-widest text-slate-500">
              REPORT NAV
            </div>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 border-l-2 border-transparent px-3 py-2 font-mono text-xs text-slate-400 transition-all hover:border-radar-400 hover:bg-radar-500/5 hover:text-radar-200"
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* 报告内容 */}
        <div className="min-w-0 space-y-8">
          <section id="score" className="scroll-mt-24">
            <SectionTitle icon={Gauge} title="综合评分仪表盘" tag="OVERALL" />
            <ScoreDashboard result={result} />
          </section>

          <section id="deepscan" className="scroll-mt-24">
            <SectionTitle icon={ScanText} title="飓风算法 · 正文深度检测" tag="AIGC" />
            <ContentDeepScan
              initialContent={result.pageContent}
              initialResult={result.aiDetection}
              autoFetched={!!result.fetchResult?.success}
              onReDetect={handleReDetect}
            />
          </section>

          {/* 内容智能优化：有正文 + 检测出问题（AI≥40 或总分<60）时显示 */}
          {result.pageContent && result.aiDetection && (
            result.aiDetection.aiScore >= 40 || result.overallScore < 60
          ) && (
            <section className="mb-8 scroll-mt-24">
              <ContentOptimizer
                content={result.pageContent}
                aiResult={result.aiDetection}
                features={result.features}
                onOptimized={handleReDetect}
              />
            </section>
          )}

          <section id="diagnosis" className="scroll-mt-24">
            <SectionTitle icon={ShieldAlert} title="八大算法逐项诊断" tag="DIAGNOSIS" />
            <div className="space-y-3">
              {result.diagnoses.map((d, i) => (
                <AlgorithmDiagnosisCard key={d.algorithmId} diagnosis={d} index={i} />
              ))}
            </div>
          </section>

          <section id="spider" className="scroll-mt-24">
            <SectionTitle icon={Bug} title="百度蜘蛛喜好度" tag="SPIDER" />
            <SpiderSimulator affinity={result.spiderAffinity} />
          </section>

          <section id="inclusion" className="scroll-mt-24">
            <SectionTitle icon={Database} title="收录情况预测" tag="INCLUSION" />
            <InclusionPrediction prediction={result.inclusionPrediction} />
          </section>

          <section id="keyword" className="scroll-mt-24">
            <SectionTitle icon={KeyRound} title="关键词产出预测" tag="KEYWORD" />
            <KeywordPrediction keywords={result.keywordPrediction} />
          </section>

          <section id="remediation" className="scroll-mt-24">
            <SectionTitle icon={Wrench} title="整改清单" tag="REMEDIATION" />
            <RemediationList items={result.remediation} />
          </section>
        </div>
      </div>
    </div>
  );
}

/** 快速重查栏：在报告页直接输入新 URL 检测，无需返回首页 */
function RecheckBar({ currentUrl, onRecheck }: { currentUrl: string; onRecheck: (url: string) => void }) {
  const [input, setInput] = useState(currentUrl);
  const [error, setError] = useState("");

  // 当前 URL 变化时同步输入框（如点重新检测后）
  useEffect(() => {
    setInput(currentUrl);
  }, [currentUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      setError("请输入需要检测的网页 URL");
      return;
    }
    const parsed = parseUrl(trimmed);
    if (!parsed.valid) {
      setError(parsed.error || "URL 格式无效");
      return;
    }
    setError("");
    onRecheck(parsed.raw);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="mb-6"
    >
      <div className="panel panel-corner flex items-center gap-2 p-2">
        <Search className="ml-2 h-4 w-4 shrink-0 text-radar-500" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入新的网页 URL，直接检测，无需返回首页"
          className="min-w-0 flex-1 bg-transparent py-2 font-mono text-sm text-radar-100 placeholder:text-slate-600 focus:outline-none"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="btn-primary shrink-0">
          <Radar className="h-3.5 w-3.5" />
          检测
        </button>
      </div>
      {error && (
        <div className="mt-2 flex items-center gap-2 border border-alert-500/40 bg-alert-500/10 px-3 py-1.5 font-mono text-[11px] text-alert-400">
          {error}
        </div>
      )}
    </motion.form>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  tag,
}: {
  icon: typeof Gauge;
  title: string;
  tag: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center border border-radar-500/30 bg-radar-500/5">
        <Icon className="h-4 w-4 text-radar-400" />
      </span>
      <div>
        <div className="font-mono text-[10px] tracking-widest text-radar-500">
          {tag}
        </div>
        <h2 className="font-display text-lg font-bold text-white">{title}</h2>
      </div>
      <div className="ml-auto h-px flex-1 bg-gradient-to-r from-radar-500/20 to-transparent" />
    </div>
  );
}

/** 抓取状态横幅 */
function FetchStatusBanner({ result }: { result: DetectionResult }) {
  const fr = result.fetchResult;
  const ai = result.aiDetection;

  if (fr?.success && ai) {
    const color = ai.aiScore >= 60 ? "#FF3D5A" : ai.aiScore >= 40 ? "#FFB300" : "#00E676";
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start gap-3 border p-4"
        style={{ borderColor: `${color}40`, background: `${color}08` }}
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
        <div className="text-xs leading-relaxed text-slate-300">
          <span className="font-bold" style={{ color }}>
            已自动抓取页面正文 {fr.charCount} 字
          </span>
          （标题：{fr.title || "未识别"}，代理：{fr.proxyUsed}，耗时 {fr.elapsed}ms），
          飓风算法已完成 AIGC 深度检测：
          <span className="font-bold" style={{ color }}>
            AI 概率 {ai.aiScore}/100 · {ai.verdictLabel}
          </span>
          。命中套话 {ai.stats.templateCount} 处、连接词 {ai.stats.connectorCount} 处。
        </div>
      </motion.div>
    );
  }

  if (fr && !fr.success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start gap-3 border border-amber-glow/30 bg-amber-glow/5 p-4"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-glow" />
        <div className="text-xs leading-relaxed text-slate-300">
          <span className="font-bold text-amber-glow">自动抓取失败：</span>
          {fr.error}。飓风算法降级为 URL 风险信号检测。
          <span className="font-bold text-radar-300">请在下方「正文深度检测」区手动粘贴页面正文，启用 AIGC 精确检测。</span>
        </div>
      </motion.div>
    );
  }

  // 用户手动粘贴
  if (ai && result.pageContent && !fr) {
    const color = ai.aiScore >= 60 ? "#FF3D5A" : ai.aiScore >= 40 ? "#FFB300" : "#00E676";
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start gap-3 border p-4"
        style={{ borderColor: `${color}40`, background: `${color}08` }}
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
        <div className="text-xs leading-relaxed text-slate-300">
          <span className="font-bold" style={{ color }}>
            正文深度检测完成：
          </span>
          正文 {result.pageContent.length} 字，AI 概率 {ai.aiScore}/100 · {ai.verdictLabel}。
          命中套话 {ai.stats.templateCount} 处、连接词 {ai.stats.connectorCount} 处。
        </div>
      </motion.div>
    );
  }

  // 无正文
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex items-start gap-3 border border-amber-glow/30 bg-amber-glow/5 p-4"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-glow" />
      <div className="text-xs leading-relaxed text-slate-300">
        <span className="font-bold text-amber-glow">未获取到正文：</span>
        飓风算法降级为 URL 风险信号检测。
        <span className="font-bold text-radar-300">请在下方「正文深度检测」区粘贴页面正文，启用 AIGC 精确检测。</span>
      </div>
    </motion.div>
  );
}
