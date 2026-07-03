import type { PageFeatures, InclusionPrediction } from "@/types/detection";

/** 预测百度收录情况 */
export function predictInclusion(
  features: PageFeatures,
  overallScore: number,
): InclusionPrediction {
  let probability = 0.4;
  const factors: InclusionPrediction["factors"] = [];

  // 备案影响
  if (features.isRegistered) {
    probability += 0.2;
    factors.push({
      label: "ICP 备案",
      impact: "positive",
      detail: "已完成备案，收录周期正常",
    });
  } else {
    probability -= 0.25;
    factors.push({
      label: "ICP 备案",
      impact: "negative",
      detail: "未备案域名收录难度陡增，周期延长 2-3 倍",
    });
  }

  // 内容质量
  if (features.contentLength > 800) {
    probability += 0.15;
    factors.push({
      label: "内容质量",
      impact: "positive",
      detail: `正文 ${features.contentLength} 字，内容充实`,
    });
  } else {
    probability -= 0.1;
    factors.push({
      label: "内容质量",
      impact: "negative",
      detail: `正文仅 ${features.contentLength} 字，内容单薄`,
    });
  }

  // AI 痕迹
  if (features.aiTraceScore > 70) {
    probability -= 0.15;
    factors.push({
      label: "AI 痕迹",
      impact: "negative",
      detail: `AI 痕迹分 ${features.aiTraceScore}，触发飓风算法降权风险`,
    });
  } else {
    factors.push({
      label: "AI 痕迹",
      impact: "positive",
      detail: `AI 痕迹分 ${features.aiTraceScore}，处于安全区间`,
    });
  }

  // 速度
  if (features.firstScreenTime < 2) {
    probability += 0.1;
    factors.push({
      label: "加载速度",
      impact: "positive",
      detail: `首屏 ${features.firstScreenTime.toFixed(1)}s，抓取友好`,
    });
  } else if (features.firstScreenTime > 3) {
    probability -= 0.1;
    factors.push({
      label: "加载速度",
      impact: "negative",
      detail: `首屏 ${features.firstScreenTime.toFixed(1)}s，蜘蛛抓取超时风险`,
    });
  }

  // 综合评分
  if (overallScore > 75) {
    probability += 0.15;
    factors.push({
      label: "综合合规",
      impact: "positive",
      detail: `综合评分 ${overallScore}，合规度高`,
    });
  } else if (overallScore < 50) {
    probability -= 0.15;
    factors.push({
      label: "综合合规",
      impact: "negative",
      detail: `综合评分 ${overallScore}，违规项较多`,
    });
  }

  // 行为数据
  if (features.bounceRate > 0.7) {
    probability -= 0.08;
    factors.push({
      label: "用户行为",
      impact: "negative",
      detail: `跳出率 ${Math.round(features.bounceRate * 100)}%，沙盒考核风险`,
    });
  }

  probability = Math.max(0.05, Math.min(0.95, probability));

  // 收录周期：未备案或低分显著拉长
  const baseDays: [number, number] = features.isRegistered
    ? [30, 90]
    : [60, 120];
  if (overallScore < 50) {
    baseDays[0] += 30;
    baseDays[1] += 30;
  }
  if (overallScore > 80) {
    baseDays[0] = Math.max(7, baseDays[0] - 20);
    baseDays[1] = Math.max(30, baseDays[1] - 30);
  }

  // 沙盒状态
  let sandbox: InclusionPrediction["sandbox"] = "active";
  if (overallScore > 85 && features.bounceRate < 0.5) sandbox = "released";
  if (overallScore < 40) sandbox = "none"; // 直接不收录

  const registrationImpact = features.isRegistered
    ? "已备案，正常进入收录流程"
    : "未备案，建议尽快完成 ICP 备案，否则收录周期延长 2-3 倍";

  return {
    probability,
    estimatedDays: baseDays,
    sandbox,
    registrationImpact,
    factors,
  };
}
