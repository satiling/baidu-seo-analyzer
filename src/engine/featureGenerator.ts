import type { PageFeatures } from "@/types/detection";
import { parseUrl, type ParsedUrl } from "./urlParser";
import { extractTopicWords } from "@/data/keywordSeed";

/** 确定性伪随机数生成器：以字符串为种子，保证同一 URL 结果可复现 */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const TITLE_SAMPLES = [
  "2026 年 XX 选购全攻略：从入门到精通的完整指南",
  "XX 是什么？一文搞懂核心原理与实操方法",
  "深度评测：2026 年最值得关注的 XX 推荐",
  "XX 怎么做？5 年经验专家分享实战技巧",
  "XX 常见问题汇总：90% 的人都不知道的细节",
];

/** URL 风险信号：从 URL 路径/域名可推断的风险关键词 */
export interface UrlRiskSignals {
  /** 正文穿插引流风险（URL 含 contact/wechat/广告 等） */
  adInsertionRisk: boolean;
  adRiskKeywords: string[];
  /** AI 内容风险（URL 含 ai/gpt/生成/采集 等） */
  aiContentRisk: boolean;
  /** 低质外链风险（URL 含 link/dir/友情 等） */
  lowQualityLinkRisk: boolean;
  /** 加载缓慢风险（URL 含 img/video/gallery 等） */
  slowLoadRisk: boolean;
}

const AD_PATTERNS = [
  /contact/i, /\/link/i, /wechat/i, /\bvx\b/i, /\bwx\b/i, /广告/, /推广/,
  /加微/, /咨询/, /\bqq\b/i, /\/tel/i, /\/phone/i, /\/ad\//i, /\/promo/i, /\/go\//i,
  /\/sid/i, /\/redirect/i,
];

/** 从 URL 提取可推断的风险信号（纯前端无法抓取正文，仅基于 URL 信号） */
export function detectUrlRiskSignals(parsed: ParsedUrl): UrlRiskSignals {
  const text = `${parsed.domain}${parsed.path}`.toLowerCase();
  const adRiskKeywords: string[] = [];
  for (const p of AD_PATTERNS) {
    const m = text.match(p);
    if (m && !adRiskKeywords.includes(m[0])) adRiskKeywords.push(m[0]);
  }
  return {
    adInsertionRisk: adRiskKeywords.length > 0,
    adRiskKeywords,
    aiContentRisk: /(ai|gpt|生成|采集|批量|auto-gen|spin|rewrite)/.test(text),
    lowQualityLinkRisk: /(\/link|friend|\/dir|directory|\/links|友情|外链|partners)/.test(text),
    slowLoadRisk: /(img|image|video|media|gallery|图集|视频|photo|slide)/.test(text),
  };
}

/** 根据解析后的 URL 生成页面特征（确定性 · 基于 URL 信号 · 无罪推定） */
export function generateFeatures(parsed: ParsedUrl): PageFeatures {
  const seed = `${parsed.domain}${parsed.path}`;
  const rand = seededRandom(seed);
  const signals = detectUrlRiskSignals(parsed);

  const topicWords = extractTopicWords(parsed.domain);
  const topicKeywords = topicWords.length
    ? topicWords.slice(0, 3)
    : ["内容", "资讯"];

  // 原则：正文级特征（需抓取才能确认的）默认合规，仅 URL 信号触发风险
  // URL 可推断的特征（备案、协议、路径深度）保留判定
  return {
    url: parsed.raw,
    domain: parsed.domain,
    protocol: parsed.protocol,
    pathDepth: parsed.pathDepth,
    isRegistered: parsed.isRegistered,
    // 标题长度：合理区间 12-38
    titleLength: 12 + Math.floor(rand() * 26),
    // 关键词密度：默认安全 1%-4%（无罪推定，URL 无法推断堆砌）
    keywordDensity: 0.01 + rand() * 0.03,
    // 首屏时间：默认 0.8-2.4s（合规），URL 含媒体类路径才升风险
    firstScreenTime: signals.slowLoadRisk ? 3.2 + rand() * 2.8 : 0.8 + rand() * 1.6,
    // 移动端交互：默认 68-95（较好）
    mobileInteractiveScore: 68 + Math.floor(rand() * 28),
    // 外链数：合理 5-28
    externalLinkCount: 5 + Math.floor(rand() * 24),
    // 低质外链占比：默认 0-0.25（低），URL 信号触发才升风险
    lowQualityLinkRatio: signals.lowQualityLinkRisk ? 0.42 + rand() * 0.28 : rand() * 0.22,
    // 内容长度：默认 800-2600（合理）
    contentLength: 800 + Math.floor(rand() * 1800),
    // AI 痕迹：默认 8-32（安全），URL 信号触发才升风险
    aiTraceScore: signals.aiContentRisk ? 65 + Math.floor(rand() * 25) : 8 + Math.floor(rand() * 24),
    // 语义同质化：默认 0.08-0.32（低）
    semanticHomogeneity: 0.08 + rand() * 0.24,
    // EEAT：默认大多数合规（无罪推定）
    authorIdentity: rand() > 0.22,
    authorityBadge: rand() > 0.38,
    citeSource: rand() > 0.32,
    // 广告穿插：严格基于 URL 信号，不再随机误判
    adInsertion: signals.adInsertionRisk,
    // 标题正文匹配：默认 0.72-0.96（较好）
    titleBodyMatch: 0.72 + rand() * 0.24,
    // 跳出率：默认 0.3-0.55（合理）
    bounceRate: 0.3 + rand() * 0.25,
    // 停留时长：默认 55-180（合理）
    dwellTime: 55 + Math.floor(rand() * 125),
    titleSample: TITLE_SAMPLES[Math.floor(rand() * TITLE_SAMPLES.length)].replace(
      "XX",
      topicKeywords[0] || "产品",
    ),
    topicKeywords,
  };
}

/** 重新解析并生成特征的便捷函数 */
export function generateFeaturesFromUrl(url: string): {
  parsed: ParsedUrl;
  features: PageFeatures | null;
} {
  const parsed = parseUrl(url);
  if (!parsed.valid) return { parsed, features: null };
  return { parsed, features: generateFeatures(parsed) };
}
