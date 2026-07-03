import type { DetectionResult } from "@/types/detection";
import { generateFeaturesFromUrl } from "./featureGenerator";
import { matchAllRules } from "./ruleMatcher";
import { calculateOverallScore } from "./scorer";
import { simulateSpider } from "./spiderSimulator";
import { predictInclusion } from "./inclusionPredictor";
import { predictKeywords } from "./keywordPredictor";
import { generateRemediation } from "./remediationGenerator";
import { detectAiContent, type AiDetectionResult } from "./aiContentDetector";
import { fetchPageContent, type FetchResult } from "./pageFetcher";

export interface DetectOptions {
  /** 进度回调，返回 0-100 */
  onProgress?: (pct: number, stage: string) => void;
  /** 用户手动粘贴的页面正文（可选，优先于自动抓取） */
  pageContent?: string;
  /** 是否自动抓取页面正文（默认 true） */
  autoFetch?: boolean;
}

/** 检测引擎入口：解析 URL → 抓取正文 → 生成特征 → 规则匹配 → 综合评分 → 预测 */
export async function detectPage(
  url: string,
  options: DetectOptions = {},
): Promise<DetectionResult> {
  const { onProgress, pageContent, autoFetch = true } = options;
  const progress = (pct: number, stage: string) => onProgress?.(pct, stage);

  // 模拟异步分阶段处理，便于前端展示扫描动效
  await delay(120);
  progress(8, "解析 URL 结构");

  const { parsed, features } = generateFeaturesFromUrl(url);
  if (!parsed.valid || !features) {
    throw new Error(parsed.error || "URL 解析失败");
  }

  // === 获取正文 ===
  // 原则：没有真实正文就不给分数，避免幻觉数据
  let aiDetection: AiDetectionResult | undefined;
  let fetchResult: FetchResult | undefined;
  let finalContent = pageContent;

  // 若用户手动粘贴了正文，优先使用
  if (finalContent && finalContent.trim().length >= 50) {
    await delay(200);
    progress(18, "飓风算法 · AIGC 文本分析");
    aiDetection = detectAiContent(finalContent);
    applyAiToFeatures(features, aiDetection);
  } else if (autoFetch) {
    // 自动通过 CORS 代理抓取页面正文
    await delay(100);
    progress(14, "Baiduspider 抓取页面正文");
    try {
      fetchResult = await fetchPageContent(parsed.raw);
      if (fetchResult.success && fetchResult.content.length >= 50) {
        finalContent = fetchResult.content;
        await delay(200);
        progress(22, "飓风算法 · AIGC 文本分析");
        aiDetection = detectAiContent(finalContent);
        applyAiToFeatures(features, aiDetection);
      }
    } catch {
      // 抓取异常，下方统一处理
    }

    // 抓取失败且无用户粘贴正文 → 终止，不给假分数
    if (!finalContent || finalContent.trim().length < 50) {
      progress(100, "抓取失败");
      const reason = fetchResult?.error || "所有 CORS 代理均无法抓取该页面";
      throw new Error(
        `无法抓取页面正文：${reason}。没有真实正文无法给出可信评分，请在下方手动粘贴页面正文后重试。`,
      );
    }
  } else {
    // 未启用自动抓取且无用户正文 → 终止
    progress(100, "缺少正文");
    throw new Error(
      "缺少页面正文，无法进行真实检测。请在下方手动粘贴页面正文后重试。",
    );
  }

  await delay(200);
  progress(32, "模拟蜘蛛抓取行为");

  await delay(180);
  progress(46, "执行算法规则匹配");
  const diagnoses = matchAllRules(features, aiDetection);

  await delay(160);
  progress(58, "计算综合评分");
  const { score, grade, gradeLabel } = calculateOverallScore(diagnoses, features);

  await delay(180);
  progress(70, "模拟百度蜘蛛喜好度");
  const spiderAffinity = simulateSpider(features, score);

  await delay(160);
  progress(82, "推演收录概率");
  const inclusionPrediction = predictInclusion(features, score);

  await delay(160);
  progress(92, "预测关键词产出");
  const keywordPrediction = predictKeywords(features, score);

  await delay(120);
  progress(96, "生成整改清单");
  const remediation = generateRemediation(diagnoses);

  await delay(80);
  progress(100, "报告生成完成");

  return {
    url: parsed.raw,
    timestamp: Date.now(),
    overallScore: score,
    grade,
    gradeLabel,
    features,
    diagnoses,
    spiderAffinity,
    inclusionPrediction,
    keywordPrediction,
    remediation,
    pageContent: finalContent,
    aiDetection,
    fetchResult,
  };
}

/** 把 AIGC 检测结果应用到页面特征（导出供 Report 页复用，保持单一数据源） */
export function applyAiToFeatures(features: import("@/types/detection").PageFeatures, aiDetection: AiDetectionResult) {
  features.aiTraceScore = aiDetection.aiScore;
  features.semanticHomogeneity = aiDetection.metrics.templateRate / 100;
  features.contentLength = aiDetection.stats.charCount;
  // 真实关键词密度（替代 URL 伪随机数）
  features.keywordDensity = aiDetection.keywordDensity;

  // 按类别统计命中数
  const byCat = (c: string) =>
    aiDetection.templateStats.find((x) => x.category === c)?.count ?? 0;
  const fakeExpCount = byCat("fakeExperience");
  const engagementCount = byCat("engagement");
  const structureCount = byCat("structure") + byCat("decision");
  const marketingCount = byCat("marketing");

  // === 清风算法 5.0：引流话术命中 → 正文穿插引流 ===
  if (engagementCount > 0) {
    features.adInsertion = true;
  }

  // === 清风算法 5.0：营销导向过重 → 广告属性偏高 ===
  // 营销话术命中 + 商业关键词密度高 → 判定为营销软文
  if (aiDetection.marketingScore >= 50 || marketingCount >= 2) {
    features.adInsertion = true;
  }

  // === EEAT 门槛：伪个人经验命中 → 作者身份伪造 ===
  if (fakeExpCount >= 2 || aiDetection.aiScore >= 60) {
    features.authorIdentity = false;
  }
  if (aiDetection.aiScore >= 60) {
    features.authorityBadge = false;
    features.citeSource = false;
  }

  // === ERNIE 语义模型：模板化覆盖 → 意图覆盖不足 ===
  if (aiDetection.aiScore >= 60 || structureCount >= 3) {
    features.titleBodyMatch = Math.min(
      features.titleBodyMatch,
      Math.max(0.3, 0.7 - structureCount * 0.08 - (fakeExpCount >= 5 ? 0.15 : 0)),
    );
  } else if (aiDetection.aiScore > 40) {
    features.titleBodyMatch = Math.max(0.4, features.titleBodyMatch - 0.15);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { parseUrl } from "./urlParser";
export type { ParsedUrl } from "./urlParser";
export { fetchPageContent, extractContent } from "./pageFetcher";
export type { FetchResult } from "./pageFetcher";
