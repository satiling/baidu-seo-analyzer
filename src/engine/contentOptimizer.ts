/**
 * 内容优化引擎 V2
 * 基于 AI 检测结果，对正文进行深度规则化改写：
 * 1. 替换/删除 AI 套话模板（核心）
 * 2. 降低关键词密度
 * 3. 删除营销/引流话术
 * 4. 打散模板化结构（删除编号小标题、合并同质段落）
 * 5. 增加真实细节表达
 */

import type { AiDetectionResult } from "./aiContentDetector";

export interface OptimizeResult {
  optimized: string;
  stats: {
    originalLen: number;
    optimizedLen: number;
    removedTemplates: number;
    replacedKeywords: number;
    removedMarketing: number;
    restructuredParas: number;
  };
  changes: string[];
}

/** 同义词库 */
const SYNONYM_MAP: Record<string, string[]> = {
  "流量": ["访客", "用户访问", "自然访问量", "搜索来源"],
  "转化": ["成交", "购买转化", "下单", "交易达成"],
  "变现": ["收益", "盈利", "获得回报", "创造收入"],
  "排名": ["搜索位置", "搜索结果排序", "搜索展现"],
  "权重": ["搜索信任度", "站点质量评分", "搜索引擎认可度"],
  "收录": ["被索引", "进入搜索结果", "被抓取入库"],
  "推广": ["获取曝光", "扩大影响", "增加展示机会"],
  "引流": ["吸引访问", "获取流量", "带来访客"],
  "直通车": ["搜索推广工具", "付费推广渠道", "竞价工具"],
  "橱窗": ["展示窗口", "商品展示位", "推荐展位"],
  "小黄车": ["商品链接", "购物车入口", "下单入口"],
  "抖音": ["短视频平台", "内容平台", "创作者平台"],
  "自然流量": ["免费搜索流量", "自然搜索来源", "非付费访问"],
  "付费流量": ["推广流量", "投放来源", "广告流量"],
  "搜索权重": ["搜索排名因素", "搜索算法评分"],
  "优化": ["改进", "调整", "完善"],
  "提升": ["增加", "改善", "提高"],
  "效果": ["成果", "表现", "数据反馈"],
  "数据": ["指标", "统计", "数字表现"],
  "运营": ["经营", "管理", "打理"],
  "电商": ["线上零售", "网络销售", "在线交易"],
};

/** 伪个人经验模板 → 替换为中性表达 */
const FAKE_EXPERIENCE_REPLACE: [RegExp, string][] = [
  [/做.{0,5}两年多.{0,10}被问得最多[^。]*[。]/g, "在实操过程中，不少新手经常反馈类似问题。"],
  [/做.{0,5}两年多.{0,10}被问得最多/g, "在实操过程中，不少新手经常反馈"],
  [/做.{0,5}两年多[^，。]*[，。]/g, ""],
  [/做.{0,5}三年多[^，。]*[，。]/g, ""],
  [/做.{0,5}多年[^，。]*[，。]/g, ""],
  [/我从事.{0,8}已有.{0,4}年[^，。]*[，。]/g, ""],
  [/我被问得最多[^。]*[。]/g, "这个问题其实出现频率很高。"],
  [/很多人问我[^。]*[。]/g, "不少人在实践中会碰到这个问题。"],
  [/经常有人问我[^。]*[。]/g, "不少人在实践中会碰到这个问题。"],
  [/说实话[^，。]*[，。]/g, ""],
  [/讲真[^，。]*[，。]/g, ""],
  [/踩过坑[^，。]*[，。]/g, ""],
  [/最开始也踩过坑[^，。]*[，。]/g, ""],
  [/今天就把我的.{0,6}经验[^。]*[。]/g, ""],
  [/把我的.{0,6}经验[^。]*[。]/g, ""],
  [/看完你就知道[^。]*[。]/g, ""],
  [/看完这篇[^。]*你就[^。]*[。]/g, ""],
  [/我测试过[^。]*[。]/g, ""],
  [/我做过一个测试[^。]*[。]/g, ""],
  [/我做过.{0,4}测试[^。]*[。]/g, ""],
  [/我实测过[^。]*[。]/g, ""],
  [/我认识一个[^。]*[。]/g, ""],
  [/我有个朋友[^。]*[。]/g, ""],
  [/我有个学员[^。]*[。]/g, ""],
  [/我见过太多人[^。]*[。]/g, ""],
  [/我见过不少[^。]*[。]/g, ""],
  [/我的建议是[^。]*[。]/g, ""],
  [/我个人建议[^。]*[。]/g, ""],
  [/我个人的配置[^。]*[。]/g, ""],
  [/我个人的做法[^。]*[。]/g, ""],
  [/让我上个月[^。]*[。]/g, ""],
];

/** AI 决策模板 → 替换为中性表达 */
const DECISION_REPLACE: [RegExp, string][] = [
  [/如果你想.{1,12}选[^；。]*[；。]/g, "不同场景适合不同选择。"],
  [/如果你想.{1,12}更适合[^；。]*[；。]/g, "不同场景适合不同选择。"],
  [/如果你有稳定.{0,6}想快速变现[^。]*[。]/g, ""],
  [/如果你没有.{0,6}还在测试[^。]*[。]/g, ""],
  [/如果你两者都想[^。]*[。]/g, ""],
  [/答案不同，选择就不同[^。]*[。]/g, ""],
  [/没有哪个更好，只有哪个更[^。]*[。]/g, ""],
  [/说到底就是[^。]*[。]/g, ""],
];

/** 引流话术 → 直接删除 */
const ENGAGEMENT_DELETE: [RegExp, string][] = [
  [/评论区告诉我[^。]*[。]/g, ""],
  [/在评论区[^。]*[。]/g, ""],
  [/选一个，我下期[^。]*[。]/g, ""],
  [/我下期[^。]*解答[^。]*[。]/g, ""],
  [/下期专门[^。]*[。]/g, ""],
  [/私信我[^。]*[。]/g, ""],
  [/加我微信[^。]*[。]/g, ""],
  [/关注我[^，。]*更多[^。]*[。]/g, ""],
  [/点个关注[^。]*[。]/g, ""],
  [/觉得有用[^，。]*(点赞|转发|收藏)[^。]*[。]/g, ""],
  [/转发[^。]*更多人[^。]*[。]/g, ""],
  [/分享给[^。]*朋友[^。]*[。]/g, ""],
  [/点赞[^。]*收藏[^。]*[。]/g, ""],
  [/建议收藏[^。]*[。]/g, ""],
  [/先收藏[^。]*再看[^。]*[。]/g, ""],
  [/赶紧[^。]*收藏[^。]*[。]/g, ""],
];

/** 营销导向话术 → 删除或弱化 */
const MARKETING_REPLACE: [RegExp, string][] = [
  [/快速变现[^。]*[。]/g, ""],
  [/收割.{0,4}流量[^。]*[。]/g, ""],
  [/引流.{0,4}变现[^。]*[。]/g, ""],
  [/批量铺.{0,4}词[^。]*[。]/g, ""],
  [/日赚\d+[^。]*[。]/g, ""],
  [/月入\d+[^。]*[。]/g, ""],
  [/GMV.{0,4}突破[^。]*[。]/g, ""],
  [/流量.{0,4}暴涨[^。]*[。]/g, ""],
  [/排名.{0,4}第一[^。]*[。]/g, ""],
  [/搜索.{0,4}霸屏[^。]*[。]/g, ""],
  [/包.{0,4}收录[^。]*[。]/g, ""],
  [/帮你.{0,3}提升[^。]*[。]/g, ""],
  [/帮你.{0,3}优化[^。]*[。]/g, ""],
  [/帮你.{0,3}解决[^。]*[。]/g, ""],
  [/帮你.{0,3}搞定[^。]*[。]/g, ""],
  [/教你.{0,4}快速[^。]*[。]/g, ""],
  [/教你.{0,4}如何[^。]*[。]/g, ""],
  [/手把手教你[^。]*[。]/g, ""],
  [/学会.{0,4}就能[^。]*[。]/g, ""],
  [/学会.{0,4}不再[^。]*[。]/g, ""],
  [/不再.{0,4}踩坑[^。]*[。]/g, ""],
  [/翻身.{0,4}秘籍[^。]*[。]/g, ""],
  [/爆款.{0,4}方法[^。]*[。]/g, ""],
  [/暴利.{0,4}项目[^。]*[。]/g, ""],
  [/躺赚[^。]*[。]/g, ""],
  [/被动收入[^。]*[。]/g, ""],
  [/副业.{0,4}月入[^。]*[。]/g, ""],
  [/小白.{0,4}也能[^。]*[。]/g, ""],
  [/新手.{0,4}也能[^。]*[。]/g, ""],
  [/零基础.{0,4}也能[^。]*[。]/g, ""],
  [/免费.{0,4}教程[^。]*[。]/g, ""],
  [/限时.{0,4}免费[^。]*[。]/g, ""],
  [/错过.{0,4}后悔[^。]*[。]/g, ""],
];

/** 自然句首替换 */
const NATURAL_STARTERS = [
  "实际上，", "换个角度看，", "需要注意的是，", "有意思的是，",
  "很多人忽略了一点：", "更进一步说，", "回过头来看，", "客观地说，",
  "从实践来看，", "综合来看，",
];

export function optimizeContent(text: string, aiResult: AiDetectionResult): OptimizeResult {
  const changes: string[] = [];
  let result = text;

  // 1. 替换伪个人经验套话（核心 AI 痕迹）
  result = applyReplacements(result, FAKE_EXPERIENCE_REPLACE, changes, "删除/改写伪经验套话");

  // 2. 替换 AI 决策模板
  result = applyReplacements(result, DECISION_REPLACE, changes, "改写决策模板");

  // 3. 删除引流话术
  result = applyReplacements(result, ENGAGEMENT_DELETE, changes, "删除引流话术");

  // 4. 删除/弱化营销话术
  result = applyReplacements(result, MARKETING_REPLACE, changes, "删除营销话术");

  // 5. 删除结构化编号标题（一、二、三 / 1. 2. 3.）
  result = removeStructuredHeadings(result, changes);

  // 6. 降低关键词密度（迭代替换，直到密度低于 8%）
  if (aiResult.keywordDensity > 0.08) {
    result = reduceKeywords(result, aiResult.topKeywords, changes);
    // 重新计算密度，若仍高则二次替换
    let recomputed = computeKeywordDensity(result);
    let safe = 0;
    while (recomputed.density > 0.08 && safe < 3) {
      const beforeLen = result.length;
      result = reduceKeywords(result, recomputed.top, changes);
      if (result.length === beforeLen) break;
      recomputed = computeKeywordDensity(result);
      safe++;
    }
  }

  // 7. 打断连续重复段落（如 5 个维度都讲"XX不同"）
  result = removeRepetitivePatterns(result, changes);

  // 7.5 二次降频：把新生成的高频 4-gram 用代词/简化表达替换
  result = reduceHighFrequencyNGrams(result, changes);

  // 8. 增加真实细节表达
  result = addNaturalDetails(result);

  // 9. 清理空白
  result = cleanup(result);

  return {
    optimized: result,
    stats: {
      originalLen: text.length,
      optimizedLen: result.length,
      removedTemplates: changes.filter((c) => c.includes("套话") || c.includes("模板") || c.includes("编号")).length,
      replacedKeywords: changes.filter((c) => c.startsWith("替换关键词")).length,
      removedMarketing: changes.filter((c) => c.includes("引流") || c.includes("营销")).length,
      restructuredParas: changes.filter((c) => c.includes("打散") || c.includes("重复")).length,
    },
    changes,
  };
}

function applyReplacements(
  text: string,
  rules: [RegExp, string][],
  changes: string[],
  label: string,
): string {
  let result = text;
  let total = 0;
  for (const [pattern, replacement] of rules) {
    const matches = result.match(pattern);
    if (matches) {
      total += matches.length;
      result = result.replace(pattern, replacement);
    }
  }
  if (total > 0) {
    changes.push(`${label}：${total} 处`);
  }
  return result;
}

function removeStructuredHeadings(text: string, changes: string[]): string {
  const before = text;
  // 删除中文数字序号：一、二、三 ... ； 1. 2. 3. ；(1) (2)
  // 段落开头
  text = text.replace(/^[\s]*[一二三四五六七八九十][\.、]\s*/gm, "");
  text = text.replace(/^[\s]*\d+[\.、\)]\s*/gm, "");
  text = text.replace(/^[\s]*[(（]\d+[)）]\s*/gm, "");
  text = text.replace(/^[\s]*第[一二三四五六七八九十\d]+[点步]\s*/gm, "");
  // 段落内部（与内容连在一起的标题）
  text = text.replace(/[\s]*[一二三四五六七八九十][\.、][\s]*/g, " ");
  text = text.replace(/第[一二三四五六七八九十\d]+[点步][\s]*/g, "");
  if (text !== before) {
    changes.push("打散编号小标题结构：删除模板化列表序号");
  }
  return text;
}

function reduceKeywords(
  text: string,
  topKeywords: { word: string; count: number; density: number }[],
  changes: string[],
): string {
  let result = text;
  const handled = new Set<string>();
  let totalReplaced = 0;

  for (const kw of topKeywords) {
    const synonyms = SYNONYM_MAP[kw.word];
    if (!synonyms || synonyms.length === 0) continue;
    if (handled.has(kw.word)) continue;

    const escaped = kw.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "g");
    const matches = result.match(regex);
    if (!matches || matches.length < 3) continue;

    // 高频词替换 60% 以上，分散到多个同义词
    const replaceCount = Math.max(2, Math.floor(matches.length * 0.6));
    let replacedCount = 0;
    let synIdx = 0;

    result = result.replace(regex, (match) => {
      if (replacedCount >= replaceCount) return match;
      // 避免连续替换导致同一句里出现多个同义词，跳过已经出现过的位置
      replacedCount++;
      const syn = synonyms[synIdx % synonyms.length];
      synIdx++;
      return syn;
    });

    if (replacedCount > 0) {
      handled.add(kw.word);
      totalReplaced += replacedCount;
      changes.push(
        `替换关键词"${kw.word}"：${replacedCount} 次（共 ${matches.length} 次）`,
      );
    }
  }

  if (totalReplaced > 0) {
    changes.push(`共替换关键词 ${totalReplaced} 次，降低堆砌密度`);
  }

  return result;
}

function removeRepetitivePatterns(text: string, changes: string[]): string {
  const before = text;
  // 删除连续 3 次以上重复出现的"XX不同"结构
  text = text.replace(/([^。]{1,8}不同[^，。]*[，。])+[^。]{1,8}不同[^，。]*[。]/g, (match) => {
    // 只保留前两句
    const parts = match.split(/(?<=[，。])/);
    return parts.slice(0, 2).join("");
  });

  // 删除"从N个维度" "先问自己N个问题" 等模板收尾
  text = text.replace(/从.{1,4}个维度[^。]*[。]/g, "");
  text = text.replace(/先问自己.{1,4}个问题[^。]*[。]/g, "");

  if (text !== before) {
    changes.push("打散重复并列结构：删除同质化维度罗列");
  }
  return text;
}

/** 二次降频：替换高频 4-gram 为代词或简化表达（仅在独立语义单元处替换，避免破词） */
function reduceHighFrequencyNGrams(text: string, changes: string[]): string {
  const cleaned = text.replace(/[\s，。！？、；：""''（）【】《》\u0000-\u001F]+/g, "");
  const totalChars = cleaned.length;
  if (totalChars < 50) return text;

  // 统计 4-gram 频率
  const freq: Record<string, number> = {};
  for (let i = 0; i <= cleaned.length - 4; i++) {
    const gram = cleaned.slice(i, i + 4);
    if (/^[\d\s]+$/.test(gram)) continue;
    freq[gram] = (freq[gram] || 0) + 1;
  }

  // 找出重复 5 次以上的 4-gram
  const highFreq = Object.entries(freq)
    .filter(([, c]) => c >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (highFreq.length === 0) return text;

  let result = text;
  let totalReduced = 0;

  for (const [gram] of highFreq) {
    // 只处理名词性短语的重复（避免误伤常用虚词）
    if (/^(的|是|在|和|了|我|不|有|大|个|上|这|为|你|会|对|也|能|就|说|要|她|他|它|们|与|及|而|但|因|于|把|被|给|让|向|往|从|到|等|第|很|最|更|太|非常|可以)/.test(gram)) continue;

    const escaped = gram.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // 只在后面紧跟标点、空格、句尾或"的/是/和/等"虚词时替换，避免破坏词边界
    const regex = new RegExp(`${escaped}(?=[，。！？、；：\s]|的|是|和|就|也|让|在|上|下|里|外|中|$)`, "g");
    const matches = result.match(regex);
    if (!matches || matches.length < 4) continue;

    // 保留前 2 次，后续替换
    let kept = 0;
    const replacements = ["该功能", "该工具", "它", "这一入口", "这个工具"];
    let ridx = 0;

    result = result.replace(regex, (match) => {
      if (kept < 2) {
        kept++;
        return match;
      }
      totalReduced++;
      const rep = replacements[ridx % replacements.length];
      ridx++;
      return rep;
    });
  }

  if (totalReduced > 0) {
    changes.push(`二次降频：用代词替换高频重复短语 ${totalReduced} 处`);
  }

  return result;
}

function addNaturalDetails(text: string): string {
  const paragraphs = text.split(/\n\s*\n/);
  const result: string[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    let para = paragraphs[i].trim();
    if (!para) continue;

    // 避免连续段落以相同字开头
    if (i >= 2) {
      const prev = result[result.length - 1]?.[0];
      const prev2 = result[result.length - 2]?.[0];
      if (para[0] === prev && para[0] === prev2) {
        const starter = NATURAL_STARTERS[i % NATURAL_STARTERS.length];
        para = starter + para;
      }
    }

    // 把过短的段落合并到上一段
    if (para.length < 40 && result.length > 0) {
      result[result.length - 1] += para;
      continue;
    }

    result.push(para);
  }

  return result.join("\n\n");
}

function cleanup(text: string): string {
  return text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join("\n");
}

/** 重新计算关键词密度（辅助迭代替换） */
function computeKeywordDensity(text: string): {
  density: number;
  top: { word: string; count: number; density: number }[];
} {
  const cleaned = text.replace(/[\s，。！？、；：""''（）【】《》\u0000-\u001F]+/g, "");
  const totalChars = cleaned.length;
  if (totalChars < 10) return { density: 0, top: [] };

  const freq: Record<string, number> = {};
  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i <= cleaned.length - n; i++) {
      const gram = cleaned.slice(i, i + n);
      if (/^[\d\s]+$/.test(gram)) continue;
      freq[gram] = (freq[gram] || 0) + 1;
    }
  }

  const sorted = Object.entries(freq)
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const top = sorted.map(([word, count]) => ({
    word,
    count,
    density: Math.round((count / totalChars) * 10000) / 100,
  }));

  const totalTopCount = sorted.reduce((s, [, c]) => s + c, 0);
  const density = Math.min(1, (totalTopCount / totalChars) * 1.5);

  return { density: Math.round(density * 100) / 100, top };
}
