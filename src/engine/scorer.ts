import type { AlgorithmDiagnosis, Grade, PageFeatures } from "@/types/detection";
import { ALGORITHM_META } from "@/data/algorithms";

/** 根据各算法诊断结果计算加权综合评分 */
export function calculateOverallScore(
  diagnoses: AlgorithmDiagnosis[],
  features: PageFeatures,
): { score: number; grade: Grade; gradeLabel: string } {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const diag of diagnoses) {
    const meta = ALGORITHM_META.find((m) => m.id === diag.algorithmId);
    const weight = meta?.weight ?? 10;
    weightedSum += diag.score * weight;
    totalWeight += weight;
  }
  let score = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // 全局微调：未备案域名额外扣分
  if (!features.isRegistered) score = Math.max(0, score - 3);

  // === 飓风算法硬性门槛（核心内容质量算法，一票否决） ===
  // 飓风算法是百度打击低质/AI/采集/模板化内容的核心算法，一旦判定违规，
  // 整站降权，不应被其他维度满分稀释。权重、流量、排名与飓风算法直接挂钩。
  const hurricane = diagnoses.find((d) => d.algorithmId === "hurricane");
  if (hurricane) {
    if (hurricane.status === "fail") {
      // fail：总分硬性上限 39（F 级，高风险，长期批量发布同类内容会触发站点降权）
      score = Math.min(score, 39);
      // 且不得高于飓风算法自身分 +5（飓风 30 分时总分最多 35）
      score = Math.min(score, hurricane.score + 5);
    } else if (hurricane.status === "warn") {
      // warn：总分硬性上限 59（D 级，需优化，排名会偏低）
      score = Math.min(score, 59);
    }
  }

  score = Math.round(score);
  const grade = scoreToGrade(score);
  return { score, grade, gradeLabel: gradeLabel(grade) };
}

function scoreToGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

function gradeLabel(grade: Grade): string {
  const map: Record<Grade, string> = {
    A: "优秀·合规",
    B: "良好·基本合规",
    C: "中等·需优化",
    D: "较差·风险较高",
    F: "危险·降权风险",
  };
  return map[grade];
}

/** 维度雷达数据：用于报告页雷达图 */
export function buildRadarDimensions(diagnoses: AlgorithmDiagnosis[]) {
  return diagnoses.slice(0, 6).map((d) => ({
    label: ALGORITHM_META.find((m) => m.id === d.algorithmId)?.name || d.algorithmId,
    value: d.score,
  }));
}
