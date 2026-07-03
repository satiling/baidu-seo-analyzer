/**
 * AIGC 内容检测引擎
 * 基于文本统计分析的真实 AI 痕迹检测，覆盖六大维度：
 * 1. 困惑度近似（Perplexity）：基于 2-gram 频率熵
 * 2. 突发性（Burstiness）：句长变异系数
 * 3. 套话模板匹配：AI 高频套话命中率
 * 4. 词汇多样性（TTR）：Type-Token Ratio
 * 5. 连接词密度：AI 过度使用逻辑连接词
 * 6. 段落同质化：段落长度方差
 */

import {
  AI_TEMPLATES,
  AI_CONNECTORS,
  AI_VAGUE_ADJECTIVES,
  AI_TITLE_PATTERNS,
  CATEGORY_LABEL,
  type AiTemplateCategory,
} from "@/data/aiTemplates";

/** 单句分析结果 */
export interface SentenceAnalysis {
  text: string;
  length: number;
  isTemplate: boolean;
  matchedTemplates: { pattern: string; category: AiTemplateCategory }[];
  aiLikelihood: number; // 0-100
}

/** AIGC 检测结果 */
export interface AiDetectionResult {
  /** AI 生成概率 0-100 */
  aiScore: number;
  /** 判定 */
  verdict: "human" | "mixed" | "ai-likely" | "ai-high";
  verdictLabel: string;
  /** 六维指标 */
  metrics: {
    /** 困惑度近似（越低越像 AI） */
    perplexity: number;
    /** 突发性（越低越像 AI） */
    burstiness: number;
    /** 词汇多样性 TTR（越低越像 AI） */
    ttr: number;
    /** 套话命中率 0-100 */
    templateRate: number;
    /** 连接词密度 0-100 */
    connectorRate: number;
    /** 段落同质化 0-100 */
    paragraphHomogeneity: number;
  };
  /** 命中模板统计 */
  templateStats: { category: AiTemplateCategory; count: number; weight: number }[];
  /** 命中的套话实例 */
  matchedTemplates: { pattern: string; category: AiTemplateCategory; note: string; occurrence: number }[];
  /** 逐句分析 */
  sentences: SentenceAnalysis[];
  /** 证据列表 */
  evidence: string[];
  /** 文本统计 */
  stats: {
    charCount: number;
    sentenceCount: number;
    paragraphCount: number;
    avgSentenceLen: number;
    avgParagraphLen: number;
    connectorCount: number;
    templateCount: number;
    titleMatch: boolean;
    titlePattern?: string;
  };
  /** === 真实正文分析扩展维度 === */
  /** 关键词密度（0-1），基于正文高频 n-gram 统计 */
  keywordDensity: number;
  /** 重复最多的关键词列表 */
  topKeywords: { word: string; count: number; density: number }[];
  /** 营销导向评分 0-100（越高越像营销软文） */
  marketingScore: number;
  /** 模板化结构评分 0-100（并列/维度展开/清单式堆砌） */
  templateStructureScore: number;
  /** 原创增量评分 0-100（越高越原创，低分=模板拼凑+常识堆砌） */
  originalityScore: number;
}

/** 检测入口 */
export function detectAiContent(text: string): AiDetectionResult {
  const cleanText = text.trim();
  if (cleanText.length < 50) {
    return buildTooShortResult(cleanText);
  }

  // 1. 分句
  const sentences = splitSentences(cleanText);
  // 2. 分段
  const paragraphs = splitParagraphs(cleanText);
  // 3. 分词（简易中文分词：按字 + 标点）
  const tokens = tokenize(cleanText);

  // 4. 计算各维度指标
  const sentenceAnalysis = analyzeSentences(sentences);
  const perplexity = computePerplexity(tokens);
  const burstiness = computeBurstiness(sentences);
  const ttr = computeTTR(tokens);
  const templateStats = computeTemplateStats(cleanText, sentenceAnalysis);
  const connectorStats = computeConnectorStats(cleanText, tokens);
  const paragraphHomogeneity = computeParagraphHomogeneity(paragraphs);
  const titleMatch = matchTitle(cleanText);

  // 5. 综合 AI 评分
  const aiScore = computeAiScore({
    perplexity,
    burstiness,
    ttr,
    templateStats,
    connectorStats,
    paragraphHomogeneity,
    titleMatch,
    sentenceCount: sentences.length,
  });

  // 5.1 真实正文扩展分析（关键词密度、营销导向、模板化结构、原创增量）
  const keywordAnalysis = computeKeywordDensity(cleanText);
  const marketingScore = computeMarketingScore(cleanText, templateStats);
  const templateStructureScore = computeTemplateStructureScore(cleanText, sentenceAnalysis, paragraphs);
  const originalityScore = computeOriginalityScore(cleanText, sentences, templateStats, paragraphHomogeneity);

  // 6. 构建结果
  const verdict = scoreToVerdict(aiScore);
  const evidence = buildEvidence({
    perplexity, burstiness, ttr, templateStats, connectorStats, paragraphHomogeneity, titleMatch, sentences,
  });

  return {
    aiScore,
    verdict: verdict.verdict,
    verdictLabel: verdict.label,
    metrics: {
      perplexity,
      burstiness,
      ttr,
      templateRate: templateStats.rate,
      connectorRate: connectorStats.rate,
      paragraphHomogeneity,
    },
    templateStats: templateStats.byCategory,
    matchedTemplates: templateStats.matched,
    sentences: sentenceAnalysis,
    evidence,
    stats: {
      charCount: cleanText.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      avgSentenceLen: sentences.length ? Math.round(sentences.reduce((s, x) => s + x.length, 0) / sentences.length) : 0,
      avgParagraphLen: paragraphs.length ? Math.round(paragraphs.reduce((s, x) => s + x.length, 0) / paragraphs.length) : 0,
      connectorCount: connectorStats.count,
      templateCount: templateStats.totalCount,
      titleMatch: titleMatch.matched,
      titlePattern: titleMatch.pattern,
    },
    keywordDensity: keywordAnalysis.density,
    topKeywords: keywordAnalysis.top,
    marketingScore,
    templateStructureScore,
    originalityScore,
  };
}

// ============ 分句 / 分段 / 分词 ============

function splitSentences(text: string): string[] {
  return text
    .split(/[。！？!?；;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** 简易中文分词：按字切分，保留 2 字以上词组候选 */
function tokenize(text: string): string[] {
  // 移除标点符号
  const clean = text.replace(/[，。！？!?；;：:、""''（）《》【】\s\n\r\t,.()]/g, "");
  const tokens: string[] = [];
  // 单字
  for (const ch of clean) tokens.push(ch);
  // 2-gram
  for (let i = 0; i < clean.length - 1; i++) {
    tokens.push(clean.slice(i, i + 2));
  }
  return tokens;
}

// ============ 六大维度计算 ============

/**
 * 困惑度近似：基于 2-gram 频率分布的香农熵
 * AI 文本可预测性强 → 2-gram 分布集中 → 熵低 → 困惑度低
 * 人类文本用词多样 → 2-gram 分散 → 熵高 → 困惑度高
 */
function computePerplexity(tokens: string[]): number {
  const bigrams = tokens.filter((t) => t.length === 2);
  if (bigrams.length < 10) return 50; // 文本过短返回中值
  const freq: Record<string, number> = {};
  for (const b of bigrams) freq[b] = (freq[b] || 0) + 1;
  const total = bigrams.length;
  let entropy = 0;
  for (const k in freq) {
    const p = freq[k] / total;
    entropy -= p * Math.log2(p);
  }
  // 困惑度 = 2^entropy，归一化到 0-100
  // 中文文本 2-gram 熵通常 6-12，困惑度 64-4096
  // 归一化：entropy < 7 → 高 AI 概率；entropy > 10 → 人类
  const rawPerplexity = Math.pow(2, entropy);
  // 映射到 0-100：entropy 6 → 5, entropy 10 → 70, entropy 12 → 95
  const normalized = Math.max(2, Math.min(98, (entropy - 5.5) * 22));
  // rawPerplexity 仅供 evidence 展示
  void rawPerplexity;
  return Math.round(normalized);
}

/**
 * 突发性：句子长度的变异系数（标准差/均值）
 * 人类写作：长短句交替，变异系数大（> 0.5）
 * AI 写作：句长均匀，变异系数小（< 0.35）
 */
function computeBurstiness(sentences: string[]): number {
  if (sentences.length < 3) return 50;
  const lengths = sentences.map((s) => s.length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean === 0) return 50;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const std = Math.sqrt(variance);
  const cv = std / mean;
  // cv > 0.6 → 人类风格（高分）；cv < 0.3 → AI 风格（低分）
  const normalized = Math.max(3, Math.min(98, cv * 140));
  return Math.round(normalized);
}

/**
 * 词汇多样性 TTR (Type-Token Ratio)
 * 不同词数 / 总词数
 * AI 文本 TTR 偏低（词汇重复）
 */
function computeTTR(tokens: string[]): number {
  const unigrams = tokens.filter((t) => t.length === 1);
  if (unigrams.length < 20) return 50;
  const unique = new Set(unigrams);
  const ttr = unique.size / unigrams.length;
  // 中文 TTR 通常 0.4-0.7
  // TTR < 0.45 → AI（低分）；TTR > 0.65 → 人类（高分）
  const normalized = Math.max(3, Math.min(98, (ttr - 0.35) * 220));
  return Math.round(normalized);
}

/**
 * 套话模板匹配
 */
function computeTemplateStats(text: string, sentenceAnalysis: SentenceAnalysis[]) {
  const matched: AiDetectionResult["matchedTemplates"] = [];
  const byCategoryMap: Record<string, { count: number; weight: number }> = {};
  let totalWeight = 0;
  let totalCount = 0;

  for (const tpl of AI_TEMPLATES) {
    const regex = new RegExp(tpl.pattern, "g");
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      const occurrence = matches.length;
      matched.push({
        pattern: tpl.pattern,
        category: tpl.category,
        note: tpl.note,
        occurrence,
      });
      totalWeight += tpl.weight * occurrence;
      totalCount += occurrence;
      if (!byCategoryMap[tpl.category]) {
        byCategoryMap[tpl.category] = { count: 0, weight: 0 };
      }
      byCategoryMap[tpl.category].count += occurrence;
      byCategoryMap[tpl.category].weight += tpl.weight * occurrence;
    }
  }

  const byCategory = Object.entries(byCategoryMap).map(([cat, v]) => ({
    category: cat as AiTemplateCategory,
    count: v.count,
    weight: v.weight,
  }));

  // 套话率：加权命中数 / 文本总句数
  const sentenceCount = Math.max(1, sentenceAnalysis.length);
  const rate = Math.min(100, (totalWeight / sentenceCount) * 25);

  return {
    matched,
    byCategory,
    totalCount,
    totalWeight,
    rate: Math.round(rate),
  };
}

/**
 * 连接词密度
 */
function computeConnectorStats(text: string, tokens: string[]) {
  let count = 0;
  for (const conn of AI_CONNECTORS) {
    // 统计每个连接词出现次数
    let idx = 0;
    while ((idx = text.indexOf(conn, idx)) !== -1) {
      count++;
      idx += conn.length;
    }
  }
  // 连接词密度：每 100 字的连接词数
  const charCount = text.length;
  const per100 = charCount > 0 ? (count / charCount) * 100 : 0;
  // per100 > 2 → AI（高分）；per100 < 0.8 → 人类（低分）
  const rate = Math.min(100, per100 * 35);
  return { count, rate: Math.round(rate) };
}

/**
 * 段落同质化：段落长度的变异系数
 * AI 段落长度均匀 → 变异系数小 → 同质化高（高分）
 */
function computeParagraphHomogeneity(paragraphs: string[]): number {
  if (paragraphs.length < 3) return 50;
  const lengths = paragraphs.map((p) => p.length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean === 0) return 50;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const std = Math.sqrt(variance);
  const cv = std / mean;
  // cv < 0.3 → 段落均匀（AI，高分）；cv > 0.7 → 段落差异大（人类，低分）
  const homogeneity = Math.max(3, Math.min(98, 95 - cv * 110));
  return Math.round(homogeneity);
}

/** 标题模板匹配 */
function matchTitle(text: string): { matched: boolean; pattern?: string } {
  const firstLine = text.split("\n")[0].slice(0, 100);
  for (const p of AI_TITLE_PATTERNS) {
    if (p.test(firstLine)) return { matched: true, pattern: p.source };
  }
  return { matched: false };
}

// ============ 逐句分析 ============

function analyzeSentences(sentences: string[]): SentenceAnalysis[] {
  return sentences.map((s) => {
    const matched: { pattern: string; category: AiTemplateCategory }[] = [];
    for (const tpl of AI_TEMPLATES) {
      const regex = new RegExp(tpl.pattern);
      if (regex.test(s)) {
        matched.push({ pattern: tpl.pattern, category: tpl.category });
      }
    }
    // 连接词命中
    let connCount = 0;
    for (const conn of AI_CONNECTORS) {
      if (s.includes(conn)) connCount++;
    }
    // 万能形容词
    let vagueCount = 0;
    for (const adj of AI_VAGUE_ADJECTIVES) {
      if (s.includes(adj)) vagueCount++;
    }
    const isTemplate = matched.length > 0 || connCount >= 2;
    const aiLikelihood = Math.min(
      100,
      matched.length * 35 + connCount * 15 + vagueCount * 8,
    );
    return {
      text: s,
      length: s.length,
      isTemplate,
      matchedTemplates: matched,
      aiLikelihood,
    };
  });
}

// ============ 综合评分 ============

function computeAiScore(input: {
  perplexity: number;
  burstiness: number;
  ttr: number;
  templateStats: { rate: number; totalWeight: number; totalCount: number; byCategory: { category: AiTemplateCategory; count: number; weight: number }[] };
  connectorStats: { rate: number; count: number };
  paragraphHomogeneity: number;
  titleMatch: { matched: boolean };
  sentenceCount: number;
}): number {
  // 六维加权：每维转换成 AI 概率（0-100）
  // 困惑度：越低越像 AI
  const perplexityAi = 100 - input.perplexity;
  // 突发性：越低越像 AI
  const burstinessAi = 100 - input.burstiness;
  // TTR：越低越像 AI
  const ttrAi = 100 - input.ttr;
  // 套话率：直接作为 AI 概率
  const templateAi = Math.min(100, input.templateStats.rate * 1.4);
  // 连接词密度：直接作为 AI 概率
  const connectorAi = input.connectorStats.rate;
  // 段落同质化：直接作为 AI 概率
  const homogeneityAi = input.paragraphHomogeneity;

  // 加权求和（套话权重最高，因为是最直接的 AI 痕迹）
  let score =
    perplexityAi * 0.15 +
    burstinessAi * 0.15 +
    ttrAi * 0.10 +
    templateAi * 0.35 +
    connectorAi * 0.10 +
    homogeneityAi * 0.15;

  // === 现代 AI 伪装话术密度加权（核心判定） ===
  // 伪个人经验、AI 决策模板、引流话术是 2024-2026 主流 AI 引流文的典型特征
  // 多条同时命中时，强判定为 AI 生成
  const byCat = (c: AiTemplateCategory) =>
    input.templateStats.byCategory.find((x) => x.category === c);

  const fakeExp = byCat("fakeExperience");
  const decision = byCat("decision");
  const engagement = byCat("engagement");

  if (fakeExp) {
    // 伪经验命中数加权：每条 +3，超过 5 条额外 +15
    score += Math.min(25, fakeExp.count * 3);
    if (fakeExp.count >= 5) score += 15;
    if (fakeExp.count >= 8) score += 10;
  }
  if (decision) {
    // AI 决策模板命中：每条 +5
    score += Math.min(20, decision.count * 5);
  }
  if (engagement) {
    // 引流话术命中：每条 +4
    score += Math.min(15, engagement.count * 4);
  }

  // 标题模板命中加 8 分
  if (input.titleMatch.matched) score += 8;

  // 套话命中数加权（命中越多越像 AI）
  if (input.templateStats.totalCount >= 5) score += 6;
  if (input.templateStats.totalCount >= 10) score += 8;

  // 文本过短时降低置信度（偏向中值）
  if (input.sentenceCount < 5) {
    score = score * 0.7 + 50 * 0.3;
  }

  return Math.max(2, Math.min(99, Math.round(score)));
}

function scoreToVerdict(score: number): { verdict: AiDetectionResult["verdict"]; label: string } {
  if (score >= 80) return { verdict: "ai-high", label: "高度疑似 AI 生成" };
  if (score >= 60) return { verdict: "ai-likely", label: "疑似 AI 生成" };
  if (score >= 40) return { verdict: "mixed", label: "人机混合 / 需进一步核查" };
  return { verdict: "human", label: "倾向人类原创" };
}

// ============ 证据生成 ============

function buildEvidence(input: {
  perplexity: number;
  burstiness: number;
  ttr: number;
  templateStats: { rate: number; totalCount: number; totalWeight: number; matched: AiDetectionResult["matchedTemplates"] };
  connectorStats: { count: number; rate: number };
  paragraphHomogeneity: number;
  titleMatch: { matched: boolean; pattern?: string };
  sentences: string[];
}): string[] {
  const evidence: string[] = [];

  if (input.templateStats.totalCount > 0) {
    evidence.push(
      `命中 AI 套话模板 ${input.templateStats.totalCount} 处（加权 ${input.templateStats.totalWeight}），套话率 ${input.templateStats.rate}%，涉及 ${input.templateStats.matched.length} 类模板。`,
    );
    // 列出前 3 个命中模板
    const top = input.templateStats.matched.slice(0, 3);
    for (const m of top) {
      evidence.push(`· 命中「${CATEGORY_LABEL[m.category].label}」："${m.pattern}" × ${m.occurrence} 次（${m.note}）`);
    }
  } else {
    evidence.push("未命中 AI 高频套话模板，套话特征不明显。");
  }

  if (input.perplexity < 35) {
    evidence.push(`困惑度评估 ${input.perplexity}/100（偏低），文本可预测性强，2-gram 分布集中，符合 AI 生成特征。`);
  } else if (input.perplexity > 65) {
    evidence.push(`困惑度评估 ${input.perplexity}/100（偏高），用词多样、表达不可预测，符合人类写作特征。`);
  } else {
    evidence.push(`困惑度评估 ${input.perplexity}/100（中等），无法单独判定。`);
  }

  if (input.burstiness < 35) {
    evidence.push(`突发性 ${input.burstiness}/100（偏低），句长高度均匀，缺乏长短句交替，符合 AI 生成特征。`);
  } else if (input.burstiness > 60) {
    evidence.push(`突发性 ${input.burstiness}/100（偏高），长短句交替明显，符合人类写作节奏。`);
  }

  if (input.ttr < 35) {
    evidence.push(`词汇多样性 TTR ${input.ttr}/100（偏低），词汇重复率高，符合 AI 生成特征。`);
  } else if (input.ttr > 60) {
    evidence.push(`词汇多样性 TTR ${input.ttr}/100（偏高），用词丰富，符合人类写作特征。`);
  }

  if (input.connectorStats.count > 0) {
    evidence.push(`AI 偏爱连接词命中 ${input.connectorStats.count} 处，密度评分 ${input.connectorStats.rate}/100。`);
  }

  if (input.paragraphHomogeneity > 65) {
    evidence.push(`段落同质化 ${input.paragraphHomogeneity}/100（偏高），段落长度均匀，符合 AI 结构化生成特征。`);
  }

  if (input.titleMatch.matched) {
    evidence.push(`标题命中 AI 模板 "${input.titleMatch.pattern}"，疑似 AI 引流标题。`);
  }

  return evidence;
}

// ============ 真实正文扩展分析 ============

/** 关键词密度：基于 2-gram 频率统计，找出重复最多的关键词 */
function computeKeywordDensity(text: string): {
  density: number;
  top: { word: string; count: number; density: number }[];
} {
  const cleaned = text.replace(/[\s，。！？、；：""''（）【】《》\u0000-\u001F]+/g, "");
  const totalChars = cleaned.length;
  if (totalChars < 10) return { density: 0, top: [] };

  // 2-gram 和 3-gram 频率统计
  const freq: Record<string, number> = {};
  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i <= cleaned.length - n; i++) {
      const gram = cleaned.slice(i, i + n);
      // 过滤纯数字/标点
      if (/^[\d\s]+$/.test(gram)) continue;
      freq[gram] = (freq[gram] || 0) + 1;
    }
  }

  // 排序取 top 10
  const sorted = Object.entries(freq)
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const top = sorted.map(([word, count]) => ({
    word,
    count,
    density: Math.round((count / totalChars) * 10000) / 100,
  }));

  // 密度 = top 词的累计占比
  const totalTopCount = sorted.reduce((s, [, c]) => s + c, 0);
  // 乘以 1.5 使密度值更接近真实关键词占比（避免 n-gram 重叠导致虚高）
  const density = Math.min(1, (totalTopCount / totalChars) * 1.5);

  return { density: Math.round(density * 100) / 100, top };
}

/** 营销导向评分：基于营销话术命中 + 商业变现关键词密度 */
function computeMarketingScore(
  text: string,
  templateStats: ReturnType<typeof computeTemplateStats>,
): number {
  const marketingHits = templateStats.byCategory.find((x) => x.category === "marketing");
  const engagementHits = templateStats.byCategory.find((x) => x.category === "engagement");

  let score = 0;

  // 营销话术命中
  if (marketingHits) {
    score += Math.min(40, marketingHits.count * 5);
    if (marketingHits.count >= 3) score += 10;
  }
  // 引流话术也贡献营销分
  if (engagementHits) {
    score += Math.min(20, engagementHits.count * 4);
  }
  // 检查商业变现关键词密度
  const bizWords = ["流量", "转化", "变现", "排名", "权重", "收录", "推广", "引流", "赚钱", "付费", "直通车", "广告", "ROI", "GMV", "客单价", "复购", "粉丝", "私域", "变现"];
  let bizCount = 0;
  for (const w of bizWords) {
    const matches = text.match(new RegExp(w, "g"));
    if (matches) bizCount += matches.length;
  }
  const bizDensity = Math.min(1, bizCount / (text.length / 100));
  score += Math.round(bizDensity * 30);

  return Math.min(100, Math.round(score));
}

/** 模板化结构评分：检测并列/维度展开/清单式堆砌结构 */
function computeTemplateStructureScore(
  text: string,
  sentenceAnalysis: ReturnType<typeof analyzeSentences>,
  paragraphs: string[],
): number {
  let score = 0;

  // 1. 并列同质化结构检测（"XX不同"重复出现）
  const structurePatterns = [
    /(.{1,6})不同/g,           // 展示位置不同、功能定位不同
    /(.{1,6})方面/g,            // XX方面
    /从.{1,4}个维度/g,          // 从N个维度
    /第[一二三四五六七八九十\d]+[点步]/g,  // 第一点、第二步
    /[1-9零一二三四五六七八九十]、[^，。]+[；;]/g,  // 编号列表
  ];

  for (const p of structurePatterns) {
    const matches = text.match(p);
    if (matches) score += Math.min(20, matches.length * 5);
  }

  // 2. 段落长度同质化（段落长度高度一致 = 模板化特征）
  if (paragraphs.length >= 3) {
    const lens = paragraphs.map((p) => p.length);
    const mean = lens.reduce((s, l) => s + l, 0) / lens.length;
    const variance = lens.reduce((s, l) => s + (l - mean) ** 2, 0) / lens.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    // 变异系数 < 0.3 = 段落高度同质化
    if (cv < 0.2) score += 25;
    else if (cv < 0.35) score += 15;
    else if (cv < 0.5) score += 5;
  }

  // 3. 清单式堆砌：大于 5 个编号段落
  const numberedParas = paragraphs.filter((p) => /^\s*[0-9零一二三四五六七八九十]+[\.、]/.test(p));
  if (numberedParas.length >= 5) score += 20;
  else if (numberedParas.length >= 3) score += 10;

  return Math.min(100, Math.round(score));
}

/** 原创增量评分：基于词汇丰富度、模板化程度、原创信号 */
function computeOriginalityScore(
  text: string,
  sentences: string[],
  templateStats: ReturnType<typeof computeTemplateStats>,
  paragraphHomogeneity: number,
): number {
  // 基础分 100
  let score = 100;

  // 套话模板扣分
  const totalTemplates = templateStats.totalCount;
  score -= Math.min(40, totalTemplates * 3);

  // 伪个人经验命中扣分（假装原创）
  const fakeExp = templateStats.byCategory.find((x) => x.category === "fakeExperience");
  if (fakeExp) {
    score -= Math.min(25, fakeExp.count * 4);
    if (fakeExp.count >= 5) score -= 15;
  }

  // 段落同质化扣分
  if (paragraphHomogeneity > 70) score -= 20;
  else if (paragraphHomogeneity > 50) score -= 10;

  // 短文扣分
  if (text.length < 500) score -= 15;
  else if (text.length < 1000) score -= 5;

  // 高频万能词扣分（"重要"、"关键"、"核心"等）
  let vagueCount = 0;
  for (const w of AI_VAGUE_ADJECTIVES) {
    const matches = text.match(new RegExp(w, "g"));
    if (matches) vagueCount += matches.length;
  }
  score -= Math.min(15, vagueCount);

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============ 边界情况 ============

function buildTooShortResult(text: string): AiDetectionResult {
  return {
    aiScore: 0,
    verdict: "human",
    verdictLabel: "文本过短，无法分析",
    metrics: {
      perplexity: 50, burstiness: 50, ttr: 50,
      templateRate: 0, connectorRate: 0, paragraphHomogeneity: 50,
    },
    templateStats: [],
    matchedTemplates: [],
    sentences: [],
    evidence: [`文本仅 ${text.length} 字，至少需要 50 字才能进行 AI 痕迹分析。建议粘贴完整正文段落。`],
    stats: {
      charCount: text.length, sentenceCount: 0, paragraphCount: 0,
      avgSentenceLen: 0, avgParagraphLen: 0,
      connectorCount: 0, templateCount: 0, titleMatch: false,
    },
    keywordDensity: 0,
    topKeywords: [],
    marketingScore: 0,
    templateStructureScore: 0,
    originalityScore: 100,
  };
}
