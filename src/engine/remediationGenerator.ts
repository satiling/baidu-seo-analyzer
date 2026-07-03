import type { AlgorithmDiagnosis, RemediationItem } from "@/types/detection";
import { REMEDIATION_TEMPLATES, type RemediationTemplate } from "@/data/remediationTemplates";

/** 根据算法诊断结果生成整改清单 */
export function generateRemediation(
  diagnoses: AlgorithmDiagnosis[],
): RemediationItem[] {
  const items: RemediationItem[] = [];

  for (const diag of diagnoses) {
    if (diag.status === "pass") continue;
    const templates = REMEDIATION_TEMPLATES[diag.algorithmId] || [];
    // 仅命中违规的算法才出整改项
    if (diag.hits.length === 0) continue;

    for (const tpl of templates) {
      items.push({
        id: `${diag.algorithmId}-${tpl.priority}`,
        priority: tpl.priority,
        algorithmId: diag.algorithmId,
        title: tpl.title,
        problem: tpl.problem,
        solution: tpl.solution,
        codeSample: tpl.codeSample,
        impact: tpl.impact,
      });
    }
  }

  // 按优先级排序
  const priorityOrder: Record<RemediationItem["priority"], number> = {
    P0: 0,
    P1: 1,
    P2: 2,
    P3: 3,
  };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // 去重（同标题保留第一个）
  const seen = new Set<string>();
  return items.filter((it) => {
    if (seen.has(it.title)) return false;
    seen.add(it.title);
    return true;
  });
}

/** 导出模板类型供外部使用 */
export type { RemediationTemplate };
