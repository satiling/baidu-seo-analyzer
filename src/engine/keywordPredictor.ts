import type { PageFeatures, KeywordPrediction, Competition } from "@/types/detection";
import { generateKeywordCandidates } from "@/data/keywordSeed";
import { seededRandom } from "./featureGenerator";

/** 预测可产出关键词及其排名/流量潜力 */
export function predictKeywords(
  features: PageFeatures,
  overallScore: number,
): KeywordPrediction[] {
  const rand = seededRandom(`kw-${features.url}`);
  let path = "/";
  try {
    path = new URL(features.url.startsWith("http") ? features.url : `https://${features.url}`).pathname || "/";
  } catch {
    /* keep default */
  }
  const candidates = generateKeywordCandidates(
    features.domain,
    path,
    features.topicKeywords,
    10,
  );

  return candidates.map((c) => {
    // 难度：受内容质量、EEAT、AI 痕迹影响
    let difficulty = 40 + Math.round(rand() * 40);
    if (features.aiTraceScore > 70) difficulty += 15;
    if (!features.authorIdentity) difficulty += 8;
    if (features.contentLength < 800) difficulty += 8;
    if (features.citeSource) difficulty -= 8;
    if (features.titleBodyMatch > 0.7) difficulty -= 8;
    difficulty = Math.max(15, Math.min(95, difficulty));

    // 竞争度
    let competition: Competition = "mid";
    if (difficulty < 35) competition = "low";
    else if (difficulty > 70) competition = "high";

    // 预估排名区间：综合评分越高排名越靠前
    const rankBase = Math.max(
      1,
      Math.round(100 - overallScore + difficulty * 0.4 + rand() * 15),
    );
    const rankStart = Math.max(1, rankBase - 10);
    const rankEnd = Math.min(100, rankBase + 20);

    // 流量预估
    const trafficEstimate = Math.round(
      Math.max(0, (110 - difficulty) * (100 / rankBase) * (1 + rand())),
    );

    return {
      keyword: c.keyword,
      competition,
      rankRange: [rankStart, rankEnd],
      trafficEstimate,
      difficulty,
      intent: c.intent,
    };
  });
}
