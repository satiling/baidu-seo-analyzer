import { detectPage } from "./src/engine";

async function main() {
  const url = "https://gouichi.com/pdd/62691.html";
  const result = await detectPage(url);
  console.log("URL:", result.url);
  console.log("总分:", result.overallScore, result.grade, result.gradeLabel);
  console.log("\n特征:");
  console.log("  内容长度:", result.features.contentLength);
  console.log("  AI痕迹分:", result.features.aiTraceScore);
  console.log("  语义同质化:", result.features.semanticHomogeneity);
  console.log("  关键词密度:", result.features.keywordDensity);
  console.log("  标题匹配:", result.features.titleBodyMatch);
  console.log("\n算法诊断:");
  for (const d of result.diagnoses) {
    console.log(`  ${d.algorithmName}: ${d.score} ${d.status}`);
    for (const h of d.hits) {
      console.log(`    [${h.severity}] ${h.ruleName} -${h.deduct}`);
    }
  }
  if (result.aiDetection) {
    console.log("\nAIGC检测:");
    console.log("  AI Score:", result.aiDetection.aiScore, result.aiDetection.verdictLabel);
    console.log("  营销分:", result.aiDetection.marketingScore);
    console.log("  结构分:", result.aiDetection.templateStructureScore);
    console.log("  原创分:", result.aiDetection.originalityScore);
    console.log("  关键词密度:", result.aiDetection.keywordDensity);
    console.log("  套话命中:", result.aiDetection.stats.templateCount);
    console.log("  高频词:", result.aiDetection.topKeywords.slice(0, 8).map(k => `${k.word}(${k.count})`).join(", "));
  }
  if (result.fetchResult) {
    console.log("\n抓取:");
    console.log("  成功:", result.fetchResult.success);
    console.log("  字数:", result.fetchResult.charCount);
    console.log("  代理:", result.fetchResult.proxyUsed);
    console.log("  标题:", result.fetchResult.title);
  }
}
main().catch(console.error);
