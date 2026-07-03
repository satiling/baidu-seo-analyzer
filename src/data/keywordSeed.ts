/** 关键词种子词库：基于页面主题派生可产出关键词 */

export interface KeywordSeed {
  topic: string;
  modifiers: string[];
}

/** 通用 SEO 词根 */
export const GENERIC_SEEDS: KeywordSeed[] = [
  {
    topic: "攻略",
    modifiers: ["怎么做", "怎么选", "入门", "大全", "指南", "2026"],
  },
  {
    topic: "对比",
    modifiers: ["哪个好", "区别", "对比", "评测", "排名", "推荐"],
  },
  {
    topic: "问题",
    modifiers: ["是什么", "为什么", "怎么办", "多少钱", "多久", "可以吗"],
  },
];

/** 行业词根（根据域名关键词粗略匹配） */
export const INDUSTRY_SEEDS: Record<string, KeywordSeed[]> = {
  tech: [
    { topic: "教程", modifiers: ["安装", "配置", "使用", "入门", "实战"] },
    { topic: "工具", modifiers: ["推荐", "对比", "下载", "免费", "在线"] },
  ],
  health: [
    { topic: "健康", modifiers: ["症状", "治疗", "预防", "饮食", "运动"] },
    { topic: "疾病", modifiers: ["原因", "表现", "检查", "用药", "护理"] },
  ],
  finance: [
    { topic: "理财", modifiers: ["入门", "方法", "技巧", "风险", "收益"] },
    { topic: "贷款", modifiers: ["利率", "条件", "流程", "计算", "注意事项"] },
  ],
  ecommerce: [
    { topic: "选购", modifiers: ["技巧", "避坑", "性价比", "品牌", "型号"] },
    { topic: "评测", modifiers: ["真实", "详细", "优缺点", "体验", "对比"] },
  ],
};

/** 根据域名/路径关键词推断行业 */
export function detectIndustry(domain: string, path: string): string {
  const text = `${domain} ${path}`.toLowerCase();
  if (/(tech|code|dev|api|soft|app|ai|cloud)/.test(text)) return "tech";
  if (/(health|med|care|病|医|药|健康)/.test(text)) return "health";
  if (/(finance|money|loan|bank|invest|理财|贷款|金融)/.test(text)) return "finance";
  if (/(shop|store|buy|mall|商品|购|商城|电商)/.test(text)) return "ecommerce";
  return "tech";
}

/** 根据域名提取主题词 */
export function extractTopicWords(domain: string): string[] {
  const cleaned = domain
    .replace(/^www\./, "")
    .replace(/\.(com|cn|net|org|io|co|xyz|top|vip|site|info)$/i, "")
    .split(/[-_.]/)
    .filter((s) => s.length > 1);
  return cleaned;
}

/** 生成关键词预测候选 */
export function generateKeywordCandidates(
  domain: string,
  path: string,
  topicKeywords: string[],
  count = 8,
): { keyword: string; intent: string }[] {
  const industry = detectIndustry(domain, path);
  const industrySeeds = INDUSTRY_SEEDS[industry] || INDUSTRY_SEEDS.tech;
  const candidates: { keyword: string; intent: string }[] = [];

  const topicWord = topicKeywords[0] || extractTopicWords(domain)[0] || "网站";

  // 基于主题词 + 修饰词
  for (const seed of [...industrySeeds, ...GENERIC_SEEDS]) {
    for (const mod of seed.modifiers) {
      candidates.push({
        keyword: `${topicWord}${seed.topic}${mod}`,
        intent: intentOf(seed.topic, mod),
      });
    }
  }

  // 基于主题词直接组合
  candidates.push({ keyword: `${topicWord}是什么`, intent: "信息型" });
  candidates.push({ keyword: `${topicWord}怎么做`, intent: "信息型" });
  candidates.push({ keyword: `${topicWord}推荐`, intent: "交易型" });

  // 去重并截取
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    if (seen.has(c.keyword)) return false;
    seen.add(c.keyword);
    return true;
  });
  return unique.slice(0, count);
}

function intentOf(topic: string, mod: string): string {
  if (/(推荐|排名|对比|评测|哪个好)/.test(mod)) return "决策型";
  if (/(怎么做|怎么选|入门|教程|安装|配置)/.test(mod)) return "信息型";
  if (/(多少钱|价格|下载|购买)/.test(mod)) return "交易型";
  if (/(是什么|为什么|区别|原因)/.test(mod)) return "信息型";
  return "信息型";
}
