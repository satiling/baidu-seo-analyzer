import type { SpiderBehavior } from "@/types/detection";

/** 蜘蛛行为序列模板 */
export interface BehaviorTemplate {
  phase: string;
  action: string;
  detailFn: (domain: string) => string;
}

export const SPIDER_PHASES: BehaviorTemplate[] = [
  {
    phase: "DNS",
    action: "解析域名",
    detailFn: (d) => `Baiduspider 解析 ${d} → 解析成功，TTL 3600s`,
  },
  {
    phase: "FETCH",
    action: "抓取首页",
    detailFn: (d) => `GET https://${d}/ HTTP/2 → 200 OK (text/html)`,
  },
  {
    phase: "ROBOTS",
    action: "校验 robots",
    detailFn: () => `读取 robots.txt → 允许全站抓取，Crawl-delay 1`,
  },
  {
    phase: "PARSE",
    action: "解析 DOM",
    detailFn: () => `提取 title/description/h1/结构化数据 → 完成`,
  },
  {
    phase: "CONTENT",
    action: "内容质量评估",
    detailFn: () => `ERNIE 语义模型分析正文 → 提取实体与意图`,
  },
  {
    phase: "LINK",
    action: "链接分析",
    detailFn: () => `解析内链/外链结构 → 计算权重传递`,
  },
  {
    phase: "INDEX",
    action: "索引决策",
    detailFn: () => `质量分达标，提交索引库 → 进入动态沙盒`,
  },
  {
    phase: "REVISIT",
    action: "回访调度",
    detailFn: () => `调度下次抓取 → 频率 3 天/次`,
  },
];

/** 根据页面特征生成行为序列结果 */
export function buildBehaviorSequence(
  domain: string,
  score: number,
): SpiderBehavior[] {
  return SPIDER_PHASES.map((p, i) => {
    let result: SpiderBehavior["result"] = "ok";
    let latency = 80 + Math.floor(Math.random() * 200);
    if (score < 60 && i >= 4) {
      result = i === 6 ? "block" : "warn";
      latency += 200;
    } else if (score < 80 && i >= 5) {
      result = "warn";
      latency += 100;
    }
    return {
      phase: p.phase,
      action: p.action,
      result,
      detail: p.detailFn(domain),
      latencyMs: latency,
    };
  });
}
