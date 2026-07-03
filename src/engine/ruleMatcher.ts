import type { PageFeatures, RuleHit, AlgorithmDiagnosis } from "@/types/detection";
import { ALGORITHM_META } from "@/data/algorithms";
import { parseUrl } from "./urlParser";
import { detectUrlRiskSignals } from "./featureGenerator";
import type { AiDetectionResult } from "./aiContentDetector";
import { CATEGORY_LABEL } from "@/data/aiTemplates";

/** 飓风算法 4.0 规则（多维度：AIGC + 模板化结构 + 营销导向 + 低原创增量 + 关键词堆砌） */
function matchHurricane(f: PageFeatures, aiDetection?: AiDetectionResult): RuleHit[] {
  const hits: RuleHit[] = [];

  if (aiDetection) {
    // ============ 维度 1：AIGC 内容检测 ============
    if (aiDetection.aiScore >= 60) {
      const topTemplates = aiDetection.matchedTemplates.slice(0, 3);
      const tplDetail = topTemplates.length
        ? topTemplates
            .map((t) => `「${CATEGORY_LABEL[t.category]?.label || t.category}：${t.pattern}」×${t.occurrence}`)
            .join("、")
        : "无明显套话但文本统计特征异常";
      hits.push({
        ruleId: "h-1",
        ruleName:
          aiDetection.aiScore >= 80 ? "AI 批量生成内容（高度疑似）" : "AI 生成内容风险（疑似）",
        severity: "high",
        deduct: aiDetection.aiScore >= 80 ? 45 : 30,
        evidence: `AIGC 文本检测 AI 概率 ${aiDetection.aiScore}/100，判定「${aiDetection.verdictLabel}」。命中证据：${tplDetail}。套话率 ${aiDetection.metrics.templateRate}%、困惑度 ${aiDetection.metrics.perplexity}、突发性 ${aiDetection.metrics.burstiness}、TTR ${aiDetection.metrics.ttr}。`,
        suggestion:
          "本文本被判定为 AI 生成。请重写为人工原创：增加独家观点、实测数据、个人案例、口语化表达，删除套话模板句，长短句交替，使用具体数字替代空泛形容词。",
      });
    } else if (aiDetection.aiScore >= 40) {
      hits.push({
        ruleId: "h-1",
        ruleName: "人机混合内容风险",
        severity: "mid",
        deduct: 15,
        evidence: `AIGC 文本检测 AI 概率 ${aiDetection.aiScore}/100，判定「${aiDetection.verdictLabel}」。文本存在部分 AI 痕迹：套话率 ${aiDetection.metrics.templateRate}%、连接词密度 ${aiDetection.metrics.connectorRate}。`,
        suggestion: "文本部分像 AI 生成。请检查标注的套话句并人工改写，增加原创观点与具体案例。",
      });
    }

    // ============ 维度 2：模板化拼凑结构 ============
    if (aiDetection.templateStructureScore >= 50) {
      hits.push({
        ruleId: "h-4",
        ruleName: "模板化拼凑结构（飓风算法打击范畴）",
        severity: aiDetection.templateStructureScore >= 70 ? "high" : "mid",
        deduct: aiDetection.templateStructureScore >= 70 ? 25 : 15,
        evidence: `模板化结构评分 ${aiDetection.templateStructureScore}/100。${aiDetection.templateStructureScore >= 70 ? "正文为高度模板化组装：并列同质化结构 + 清单式堆砌 + 段落长度高度一致，百度判定为批量标准化流水线内容，无独家增量。" : "正文存在模板化结构特征：并列式展开、清单式堆砌，缺少原创深度。"}`,
        suggestion: "打破模板化结构：删除机械并列句式，改用自然叙事；每个段落有独立观点而非同类罗列；增加实操截图、独家复盘提升原创增量。",
      });
    }

    // ============ 维度 3：营销导向 / 广告属性偏高 ============
    if (aiDetection.marketingScore >= 50) {
      hits.push({
        ruleId: "h-5",
        ruleName: "营销导向过重（商业软文属性偏高）",
        severity: aiDetection.marketingScore >= 70 ? "high" : "mid",
        deduct: aiDetection.marketingScore >= 70 ? 25 : 15,
        evidence: `营销导向评分 ${aiDetection.marketingScore}/100。${aiDetection.marketingScore >= 70 ? "全文核心目的为商业推广/获客引流，属于营销软文。百度判定：纯以商家推广、电商教学获客为目的的页面，内容价值评分下调。" : "正文存在营销软文倾向：商业变现关键词密度偏高、营销话术命中。"}`,
        suggestion: "弱化营销引流属性：减少商业关键词堆砌，降低转化话术比例，增加客观中立的通用知识内容，让内容价值超越营销目的。",
      });
    }

    // ============ 维度 4：原创增量价值低 ============
    if (aiDetection.originalityScore < 50) {
      hits.push({
        ruleId: "h-6",
        ruleName: "原创增量价值低（信息整合拼凑）",
        severity: aiDetection.originalityScore < 30 ? "high" : "mid",
        deduct: aiDetection.originalityScore < 30 ? 25 : 15,
        evidence: `原创增量评分 ${aiDetection.originalityScore}/100。${aiDetection.originalityScore < 30 ? "正文为行业通用常识拼凑，无独家实操深度、无实拍素材、无真实数据，百度判定为信息整合拼凑，飓风算法会降权处理。" : "正文缺乏独家增量信息：多为行业通用知识，缺少原创观点与独家数据支撑。"}`,
        suggestion: "增加独家内容增量：加入真实实操截图、个人复盘总结、一手数据、行业独家洞察；删除百科式常识堆砌，每段回答用户真实问题而非泛泛而谈。",
      });
    }

    // ============ 维度 5：关键词堆砌（高频词统计） ============
    // 优化后的内容允许话题词自然重复，阈值区分明显堆砌与自然主题聚焦
    if (aiDetection.keywordDensity > 0.12) {
      const topWords = aiDetection.topKeywords.slice(0, 5).map((k) => `"${k.word}"(${k.count}次)`).join("、");
      const density = Math.round(aiDetection.keywordDensity * 100);
      hits.push({
        ruleId: "h-7",
        ruleName: "关键词过度重复（堆砌）",
        severity: "high",
        deduct: 20,
        evidence: `关键词密度 ${density}%（阈值 12%），高频词：${topWords}。百度蜘蛛识别关键词堆砌，判定为 SEO 过度优化轻度违规。`,
        suggestion: "删减重复关键词，把词条式罗列改为自然叙事，使用同义词与相关语义词替换。",
      });
    } else if (aiDetection.keywordDensity > 0.06) {
      const density = Math.round(aiDetection.keywordDensity * 100);
      hits.push({
        ruleId: "h-7",
        ruleName: "关键词密度偏高",
        severity: "mid",
        deduct: 8,
        evidence: `关键词密度 ${density}%（阈值 6%-12%），存在轻微堆砌倾向。`,
        suggestion: "适当使用同义词替换，降低核心词重复频率。",
      });
    }

    // 套话命中明细：仅在 AI 痕迹仍较明显时触发，避免优化后残留少量命中被过度扣分
    if (aiDetection.stats.templateCount >= 8 && aiDetection.aiScore < 50) {
      hits.push({
        ruleId: "h-1b",
        ruleName: "AI 套话模板命中",
        severity: aiDetection.stats.templateCount >= 12 ? "high" : "mid",
        deduct: Math.min(16, aiDetection.stats.templateCount * 2),
        evidence: `正文命中 AI 高频套话模板 ${aiDetection.stats.templateCount} 处，涉及 ${aiDetection.matchedTemplates.length} 类。命中示例：${aiDetection.matchedTemplates.slice(0, 3).map((t) => `"${t.pattern}"`).join("、")}。`,
        suggestion: "删除或改写命中的套话句，使用自然口语化表达替代模板化句式。",
      });
    }
  } else {
    // 无正文：仅基于 URL 信号提示
    const signals = detectUrlRiskSignals(parseUrl(f.url));
    if (signals.aiContentRisk) {
      hits.push({
        ruleId: "h-1",
        ruleName: "AI 内容风险信号（需正文确认）",
        severity: "mid",
        deduct: 8,
        evidence: `URL 含 AI/生成/采集 等风险信号。注：纯 URL 无法判定正文是否 AI 生成，请在下方粘贴正文进行 AIGC 精确检测。`,
        suggestion: "强烈建议在报告页下方「正文深度检测」区粘贴页面正文，启用飓风算法 AIGC 精确检测。",
      });
    }
  }

  // 语义同质化（URL 信号兜底）
  if (f.semanticHomogeneity > 0.6) {
    const source = aiDetection ? "AIGC 检测器" : "URL 风险评估";
    hits.push({
      ruleId: "h-2",
      ruleName: "语义同质化风险",
      severity: "mid",
      deduct: Math.min(20, (f.semanticHomogeneity - 0.6) * 50),
      evidence: `语义同质化评估值 ${Math.round(f.semanticHomogeneity * 100)}%（来源：${source}）。${aiDetection ? "" : "注：同质化需对比站内多篇文章确认。"}`,
      suggestion: "人工核查站内是否存在语义高度相似内容，每篇内容须有独立增量信息。",
    });
  }

  // 内容过短
  if (f.contentLength < 500) {
    hits.push({
      ruleId: "h-3",
      ruleName: "内容过短",
      severity: "mid",
      deduct: 10,
      evidence: `正文长度 ${f.contentLength} 字。${aiDetection ? "" : "注：未粘贴正文时为 URL 推断值，建议粘贴正文精确统计。"}`,
      suggestion: "正文建议 800 字以上，需完整覆盖主题并包含独家信息。",
    });
  }

  return hits;
}

/** 清风算法 5.0 规则 */
function matchBreeze(f: PageFeatures, aiDetection?: AiDetectionResult): RuleHit[] {
  const hits: RuleHit[] = [];
  if (f.adInsertion) {
    if (aiDetection) {
      // 有正文检测结果：基于真实引流话术命中给出证据
      const engagementHits = aiDetection.matchedTemplates.filter(
        (t) => t.category === "engagement",
      );
      const detail = engagementHits.length
        ? `正文检测到引流话术命中：${engagementHits.slice(0, 3).map((t) => `"${t.pattern}"`).join("、")}`
        : "正文穿插引流信息";
      hits.push({
        ruleId: "b-1",
        ruleName: "正文穿插引流信息",
        severity: "high",
        deduct: 25,
        evidence: `${detail}。清风算法 5.0 打击正文恶意穿插联系方式、引流信息，"评论区告诉我/私信我/加微信"等话术属于正文引流。`,
        suggestion: "删除正文中的引流话术，联系方式与广告置于页脚或独立联系页，正文保持纯净。",
      });
    } else {
      const signals = detectUrlRiskSignals(parseUrl(f.url));
      const keywords = signals.adRiskKeywords.length
        ? signals.adRiskKeywords.join("、")
        : "引流相关";
      hits.push({
        ruleId: "b-1",
        ruleName: "正文穿插引流信息风险",
        severity: "high",
        deduct: 25,
        evidence: `URL 路径包含引流相关信号（${keywords}），存在正文穿插联系方式/微信/广告的风险。注：未抓取正文，请在下方粘贴正文精确检测。`,
        suggestion: "人工核查正文段落，若穿插联系方式/微信/广告，请迁移至页脚或独立联系页，正文保持纯净。",
      });
    }
  }
  if (f.keywordDensity > 0.12) {
    const density = Math.round(f.keywordDensity * 100);
    if (aiDetection && aiDetection.topKeywords.length > 0) {
      const topWords = aiDetection.topKeywords.slice(0, 5).map((k) => `"${k.word}"(${k.count}次)`).join("、");
      hits.push({
        ruleId: "b-2",
        ruleName: "关键词过度重复（堆砌）",
        severity: "high",
        deduct: Math.min(30, (f.keywordDensity - 0.06) * 300),
        evidence: `基于正文计算，关键词密度 ${density}%（阈值 12%），高频词：${topWords}。清风算法 5.0 打击 AI 生成内容的生硬关键词堆砌、语义重复。`,
        suggestion: "删减重复关键词，把词条式罗列改为自然叙事，使用同义词与相关语义词替换，密度控制在 2%-5%。",
      });
    } else {
      hits.push({
        ruleId: "b-2",
        ruleName: "关键词堆砌风险",
        severity: "high",
        deduct: Math.min(30, (f.keywordDensity - 0.06) * 300),
        evidence: `关键词密度评估 ${density}%。注：实际密度需抓取正文计算，本项为风险评估。`,
        suggestion: "人工核查关键词分布，密度控制在 2%-5%，使用同义词与相关语义词替换。",
      });
    }
  }
  if (f.titleBodyMatch < 0.5) {
    const source = aiDetection ? "AIGC 检测器" : "URL 风险评估";
    hits.push({
      ruleId: "b-3",
      ruleName: "标题正文不符风险",
      severity: "high",
      deduct: 20,
      evidence: `标题与正文语义匹配度评估 ${Math.round(f.titleBodyMatch * 100)}%（来源：${source}）。${aiDetection ? "正文疑似模板化生成，与标题意图覆盖不一致。" : "注：需人工核对标题与正文内容是否一致。"}`,
      suggestion: "人工核对标题是否准确概括正文，重写标题使其与正文语义对齐。",
    });
  }
  return hits;
}

/** 蓝天算法 3.0 规则 */
function matchBluesky(f: PageFeatures): RuleHit[] {
  const hits: RuleHit[] = [];
  if (f.lowQualityLinkRatio > 0.4) {
    const signals = detectUrlRiskSignals(parseUrl(f.url));
    const hint = signals.lowQualityLinkRisk ? "URL 含 link/dir/友情 等信号，" : "";
    hits.push({
      ruleId: "s-1",
      ruleName: "低质外链占比过高风险",
      severity: "high",
      deduct: Math.min(25, (f.lowQualityLinkRatio - 0.4) * 50),
      evidence: `${hint}低质外链占比评估 ${Math.round(f.lowQualityLinkRatio * 100)}%。注：实际外链质量需在百度搜索资源平台外链分析中确认。`,
      suggestion: "登录百度搜索资源平台外链分析，拒绝低质外链，清理与主题无关友链。",
    });
  }
  if (f.externalLinkCount > 40) {
    hits.push({
      ruleId: "s-2",
      ruleName: "外链锚文本同质化风险",
      severity: "mid",
      deduct: 12,
      evidence: `外链数量评估 ${f.externalLinkCount}。注：锚文本同质化需人工抽查外链锚文本确认。`,
      suggestion: "人工抽查外链锚文本，多样化（品牌词、URL、长尾词混合），拒绝付费软文外链。",
    });
  }
  return hits;
}

/** 闪电算法 3.0 规则 */
function matchLightning(f: PageFeatures): RuleHit[] {
  const hits: RuleHit[] = [];
  if (f.firstScreenTime > 3) {
    const signals = detectUrlRiskSignals(parseUrl(f.url));
    const hint = signals.slowLoadRisk ? "URL 含图片/视频/图集等媒体路径，" : "";
    hits.push({
      ruleId: "l-1",
      ruleName: "首屏加载过慢风险",
      severity: "high",
      deduct: Math.min(30, (f.firstScreenTime - 3) * 12),
      evidence: `${hint}首屏加载评估 ${f.firstScreenTime.toFixed(1)} 秒。注：实际加载速度请用 PageSpeed Insights 或百度移动端测速工具实测确认。`,
      suggestion: "用 PageSpeed Insights 实测，压缩资源、启用 CDN、关键 CSS 内联、JS 延迟加载，LCP 控制在 1.5 秒内。",
    });
  }
  if (f.mobileInteractiveScore < 60) {
    hits.push({
      ruleId: "l-2",
      ruleName: "移动端交互差风险",
      severity: "mid",
      deduct: Math.min(20, (60 - f.mobileInteractiveScore) * 0.4),
      evidence: `移动端交互分评估 ${f.mobileInteractiveScore}/100。注：实际交互体验需移动端实测验。`,
      suggestion: "移动端实测滑动/点击流畅度，使用 transform/opacity 动画，passive 事件监听。",
    });
  }
  return hits;
}

/** 惊雷算法规则 */
function matchThunder(f: PageFeatures): RuleHit[] {
  const hits: RuleHit[] = [];
  // 跳出率过低 + 停留时间异常一致 → 疑似刷量
  if (f.bounceRate < 0.25 && f.dwellTime > 120) {
    hits.push({
      ruleId: "t-1",
      ruleName: "异常行为序列风险",
      severity: "high",
      deduct: 30,
      evidence: `跳出率评估 ${Math.round(f.bounceRate * 100)}%、停留 ${f.dwellTime}s，数据异常一致。注：真实行为数据需在百度统计/搜索资源平台查看，若使用过快排工具请立即停止。`,
      suggestion: "登录百度统计核查真实流量数据，若使用过快排/刷量工具请立即停用，通过自然内容获取真实点击。",
    });
  }
  return hits;
}

/** EEAT 评估 */
function matchEeat(f: PageFeatures): RuleHit[] {
  const hits: RuleHit[] = [];
  if (!f.authorIdentity) {
    hits.push({
      ruleId: "e-1",
      ruleName: "缺少作者身份",
      severity: "high",
      deduct: 18,
      evidence: "页面未检测到明确作者署名。注：请人工打开页面确认是否包含作者介绍与署名。",
      suggestion: "添加作者介绍页（含资质、履历），使用 Article 结构化数据标注作者。",
    });
  }
  if (!f.authorityBadge) {
    hits.push({
      ruleId: "e-2",
      ruleName: "缺少权威资质",
      severity: "mid",
      deduct: 12,
      evidence: "未检测到权威资质背书。注：医疗/金融/法律等 YMYL 领域需人工确认是否展示资质。",
      suggestion: "展示专业资质证书、备案信息、专家审核署名。",
    });
  }
  if (!f.citeSource) {
    hits.push({
      ruleId: "e-3",
      ruleName: "缺少权威来源引用",
      severity: "mid",
      deduct: 10,
      evidence: "正文未检测到权威来源引用。注：请人工核查正文是否引用政府/学术机构来源。",
      suggestion: "引用政府、学术机构来源并标注链接，提升内容可信度。",
    });
  }
  return hits;
}

/** ERNIE 语义评估 */
function matchErnie(f: PageFeatures): RuleHit[] {
  const hits: RuleHit[] = [];
  if (f.titleBodyMatch < 0.6) {
    hits.push({
      ruleId: "n-1",
      ruleName: "意图覆盖不足风险",
      severity: "mid",
      deduct: 15,
      evidence: `标题正文匹配度评估 ${Math.round(f.titleBodyMatch * 100)}%。注：实际意图覆盖需人工核对正文是否完整回答用户搜索意图。`,
      suggestion: "人工核对搜索意图（信息型/导航型/交易型），用 FAQ 结构化数据覆盖长尾问题。",
    });
  }
  if (f.contentLength < 800) {
    hits.push({
      ruleId: "n-2",
      ruleName: "语义完整度不足风险",
      severity: "low",
      deduct: 8,
      evidence: `正文 ${f.contentLength} 字。注：实际字数与语义覆盖需打开页面确认。`,
      suggestion: "扩展内容至 800 字以上，覆盖相关实体、对比、案例、FAQ。",
    });
  }
  return hits;
}

/** 动态沙盒评估 */
function matchSandbox(f: PageFeatures): RuleHit[] {
  const hits: RuleHit[] = [];
  if (!f.isRegistered) {
    hits.push({
      ruleId: "d-1",
      ruleName: "未备案域名",
      severity: "high",
      deduct: 20,
      evidence: "域名 TLD 推断为未备案（.cn/.com.cn 视为已备案，其他后缀需人工确认）。注：请到工信部备案查询系统核实。",
      suggestion: "优先完成 ICP 备案，未备案域名收录周期延长 2-3 倍。",
    });
  }
  if (f.bounceRate > 0.7) {
    hits.push({
      ruleId: "d-2",
      ruleName: "跳出率过高风险",
      severity: "mid",
      deduct: 12,
      evidence: `跳出率评估 ${Math.round(f.bounceRate * 100)}%。注：真实跳出率需在百度统计查看。`,
      suggestion: "通过站内推荐、相关文章、内链引导降低跳出率至 50% 以下。",
    });
  }
  if (f.dwellTime < 30) {
    hits.push({
      ruleId: "d-3",
      ruleName: "停留时长过短风险",
      severity: "mid",
      deduct: 10,
      evidence: `平均停留评估 ${f.dwellTime}s。注：真实停留时长需在百度统计查看。`,
      suggestion: "提升内容可读性，增加图表、视频、分段小标题，延长停留至 60s+。",
    });
  }
  return hits;
}

const MATCHERS: Record<string, (f: PageFeatures, aiDetection?: AiDetectionResult) => RuleHit[]> = {
  hurricane: matchHurricane,
  breeze: matchBreeze,
  bluesky: matchBluesky,
  lightning: matchLightning,
  thunder: matchThunder,
  eeat: matchEeat,
  ernie: matchErnie,
  sandbox: matchSandbox,
};

/** 执行所有算法规则匹配，返回每个算法的诊断结果 */
export function matchAllRules(f: PageFeatures, aiDetection?: AiDetectionResult): AlgorithmDiagnosis[] {
  return ALGORITHM_META.map((meta) => {
    const matcher = MATCHERS[meta.id];
    const hits = matcher ? matcher(f, aiDetection) : [];
    const totalDeduct = hits.reduce((sum, h) => sum + h.deduct, 0);
    const score = Math.max(0, 100 - totalDeduct);
    let status: AlgorithmDiagnosis["status"] = "pass";
    if (score < 60) status = "fail";
    else if (score < 80) status = "warn";
    return {
      algorithmId: meta.id,
      algorithmName: `${meta.name} ${meta.version}`,
      status,
      score: Math.round(score),
      hits,
    };
  });
}
