import type { PageFeatures, SpiderAffinity } from "@/types/detection";
import { buildBehaviorSequence } from "@/data/spiderBehaviors";
import { seededRandom } from "./featureGenerator";

/** 模拟百度蜘蛛抓取行为，计算喜好度 */
export function simulateSpider(
  features: PageFeatures,
  overallScore: number,
): SpiderAffinity {
  const rand = seededRandom(`spider-${features.url}`);
  const sequence = buildBehaviorSequence(features.domain, overallScore);

  // 喜好度计算：基于内容质量、速度、EEAT、行为数据
  let affinity = 50;
  if (features.contentLength > 800) affinity += 8;
  if (features.firstScreenTime < 2) affinity += 10;
  if (features.firstScreenTime > 3) affinity -= 12;
  if (features.authorIdentity) affinity += 8;
  if (features.citeSource) affinity += 6;
  if (features.titleBodyMatch > 0.7) affinity += 8;
  if (features.aiTraceScore > 70) affinity -= 15;
  if (features.bounceRate < 0.5) affinity += 8;
  if (features.bounceRate > 0.7) affinity -= 10;
  if (features.adInsertion) affinity -= 8;
  affinity += Math.round((overallScore - 60) * 0.3);
  affinity = Math.max(5, Math.min(98, affinity + Math.round(rand() * 6 - 3)));

  const level =
    affinity >= 80
      ? "强烈喜好"
      : affinity >= 65
        ? "良好喜好"
        : affinity >= 45
          ? "一般喜好"
          : affinity >= 25
            ? "排斥"
            : "强烈排斥";

  // 生成雷达轨迹点（模拟抓取路径）
  const trace = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 + rand() * 0.4;
    const r = 30 + rand() * 50;
    return {
      x: 50 + Math.cos(angle) * (r / 2),
      y: 50 + Math.sin(angle) * (r / 2),
      label: sequence[i]?.phase || `P${i}`,
    };
  });

  return {
    score: affinity,
    level,
    behaviorSequence: sequence,
    trace,
  };
}
