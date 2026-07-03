/**
 * AI 生成内容特征模板库
 * 基于 2026 飓风算法 4.0 与业界 AIGC 检测研究整理
 * 覆盖 GPT/Claude/文心/通义/豆包等主流模型生成中文文本的典型特征
 */

export interface AiTemplate {
  /** 模板内容 */
  pattern: string;
  /** 类别 */
  category: AiTemplateCategory;
  /** 权重（命中一次的扣分权重 1-5） */
  weight: number;
  /** 说明 */
  note: string;
}

export type AiTemplateCategory =
  | "opening" // 开头套话
  | "transition" // 过渡套话
  | "conclusion" // 结尾套话
  | "filler" // 空话句式
  | "structure" // 结构化模板
  | "hedge" // 模糊表达
  | "listing" // 列举式
  | "fakeExperience" // 伪个人经验
  | "decision" // AI 决策模板
  | "engagement" // 引流话术
  | "marketing"; // 营销导向话术（商业变现/流量收割/转化话术）

/** AI 高频套话模板（按类别） */
export const AI_TEMPLATES: AiTemplate[] = [
  // === 开头套话 ===
  { pattern: "在当今", category: "opening", weight: 5, note: "AI 典型开头套话" },
  { pattern: "随着.*的发展", category: "opening", weight: 5, note: "AI 典型开头套话" },
  { pattern: "在数字化时代", category: "opening", weight: 5, note: "AI 时代背景套话" },
  { pattern: "在信息化时代", category: "opening", weight: 5, note: "AI 时代背景套话" },
  { pattern: "众所周知", category: "opening", weight: 4, note: "AI 套话开头" },
  { pattern: "作为一个", category: "opening", weight: 3, note: "AI 角色代入式开头" },
  { pattern: "在现代社会", category: "opening", weight: 4, note: "AI 社会背景套话" },
  { pattern: "在日常生活中", category: "opening", weight: 4, note: "AI 生活化套话" },
  { pattern: "伴随着", category: "opening", weight: 3, note: "AI 伴随式开头" },
  { pattern: "近年来", category: "opening", weight: 3, note: "AI 时间套话" },
  { pattern: "当今社会", category: "opening", weight: 4, note: "AI 社会套话" },
  { pattern: "当下", category: "opening", weight: 2, note: "AI 时间套话" },

  // === 过渡套话 ===
  { pattern: "值得注意的是", category: "transition", weight: 5, note: "AI 高频过渡词" },
  { pattern: "需要指出的是", category: "transition", weight: 5, note: "AI 高频过渡词" },
  { pattern: "值得一提的是", category: "transition", weight: 4, note: "AI 过渡套话" },
  { pattern: "总而言之", category: "transition", weight: 4, note: "AI 总结过渡" },
  { pattern: "综上所述", category: "transition", weight: 5, note: "AI 总结套话" },
  { pattern: "总的来说", category: "transition", weight: 3, note: "AI 总结套话" },
  { pattern: "换句话说", category: "transition", weight: 3, note: "AI 解释过渡" },
  { pattern: "简而言之", category: "transition", weight: 3, note: "AI 简化过渡" },
  { pattern: "从另一个角度来看", category: "transition", weight: 4, note: "AI 视角切换套话" },
  { pattern: "从这个意义上说", category: "transition", weight: 4, note: "AI 总结套话" },
  { pattern: "不可否认", category: "transition", weight: 3, note: "AI 让步套话" },
  { pattern: "毋庸置疑", category: "transition", weight: 3, note: "AI 让步套话" },
  { pattern: "不言而喻", category: "transition", weight: 3, note: "AI 套话" },

  // === 结尾套话 ===
  { pattern: "总之", category: "conclusion", weight: 3, note: "AI 结尾套话" },
  { pattern: "综上", category: "conclusion", weight: 4, note: "AI 结尾套话" },
  { pattern: "最终", category: "conclusion", weight: 2, note: "AI 结尾套话" },
  { pattern: "希望通过本文", category: "conclusion", weight: 5, note: "AI 结尾套话" },
  { pattern: "希望本文.*能够", category: "conclusion", weight: 5, note: "AI 结尾套话" },
  { pattern: "希望本文.*对你", category: "conclusion", weight: 5, note: "AI 结尾套话" },
  { pattern: "相信通过", category: "conclusion", weight: 4, note: "AI 结尾套话" },
  { pattern: "相信你已经", category: "conclusion", weight: 4, note: "AI 结尾套话" },
  { pattern: "让我们一起", category: "conclusion", weight: 3, note: "AI 号召式结尾" },

  // === 空话句式 ===
  { pattern: "不仅是.*更是", category: "filler", weight: 5, note: "AI 递进空话" },
  { pattern: "不仅.*而且", category: "filler", weight: 4, note: "AI 递进句式" },
  { pattern: "既.*又.*还", category: "filler", weight: 4, note: "AI 排比空话" },
  { pattern: "一方面.*另一方面", category: "filler", weight: 4, note: "AI 对仗句式" },
  { pattern: "无论.*都", category: "filler", weight: 3, note: "AI 让步句式" },
  { pattern: "只有.*才能", category: "filler", weight: 3, note: "AI 条件句式" },
  { pattern: "正是因为", category: "filler", weight: 3, note: "AI 强调句式" },
  { pattern: "至关重要", category: "filler", weight: 4, note: "AI 高频空话" },
  { pattern: "举足轻重", category: "filler", weight: 3, note: "AI 高频成语" },
  { pattern: "不可或缺", category: "filler", weight: 4, note: "AI 高频空话" },
  { pattern: "息息相关", category: "filler", weight: 3, note: "AI 高频成语" },
  { pattern: "密不可分", category: "filler", weight: 3, note: "AI 高频成语" },
  { pattern: "方方面面", category: "filler", weight: 3, note: "AI 套话" },
  { pattern: "林林总总", category: "filler", weight: 3, note: "AI 套话" },

  // === 结构化模板 ===
  { pattern: "首先.*其次.*最后", category: "structure", weight: 4, note: "AI 三段式结构" },
  { pattern: "第一.*第二.*第三", category: "structure", weight: 4, note: "AI 列举式结构" },
  { pattern: "接下来我们", category: "structure", weight: 3, note: "AI 引导式结构" },
  { pattern: "下面我们来", category: "structure", weight: 3, note: "AI 引导式结构" },
  { pattern: "下面我将", category: "structure", weight: 3, note: "AI 引导式结构" },

  // === 模糊表达（AI 倾向于过度 hedging） ===
  { pattern: "一般来说", category: "hedge", weight: 2, note: "AI 模糊表达" },
  { pattern: "通常情况下", category: "hedge", weight: 2, note: "AI 模糊表达" },
  { pattern: "在某种程度上", category: "hedge", weight: 3, note: "AI 模糊表达" },
  { pattern: "从某种程度上", category: "hedge", weight: 3, note: "AI 模糊表达" },
  { pattern: "在一定程度上", category: "hedge", weight: 3, note: "AI 模糊表达" },
  { pattern: "因人而异", category: "hedge", weight: 2, note: "AI 模糊表达" },
  { pattern: "具体情况具体分析", category: "hedge", weight: 3, note: "AI 模糊套话" },

  // === 列举式 ===
  { pattern: "以下是", category: "listing", weight: 2, note: "AI 列举引导" },
  { pattern: "如下所示", category: "listing", weight: 2, note: "AI 列举引导" },
  { pattern: "具体来说", category: "listing", weight: 2, note: "AI 展开引导" },

  // === 伪个人经验（现代 AI 伪装话术，2024-2026 主流 AI 引流文特征） ===
  // 这类模板伪装"真人分享"，实为 AI 批量生成的引流文典型特征
  // 单条命中权重适中，但多条同时命中时强判定为 AI
  { pattern: "做.{1,8}两年多", category: "fakeExperience", weight: 4, note: "AI 伪经验开头（做XX两年多）" },
  { pattern: "做.{1,8}三年多", category: "fakeExperience", weight: 4, note: "AI 伪经验开头" },
  { pattern: "做.{1,8}多年", category: "fakeExperience", weight: 4, note: "AI 伪经验开头" },
  { pattern: "我从事.{1,10}已有.{0,4}年", category: "fakeExperience", weight: 4, note: "AI 伪从业经验" },
  { pattern: "我做.{1,8}.{0,3}年", category: "fakeExperience", weight: 4, note: "AI 伪从业经验" },
  { pattern: "我被问得最多的问题", category: "fakeExperience", weight: 5, note: "AI 伪痛点开头" },
  { pattern: "我被问得最多", category: "fakeExperience", weight: 5, note: "AI 伪痛点开头" },
  { pattern: "很多人问我", category: "fakeExperience", weight: 4, note: "AI 伪痛点开头" },
  { pattern: "经常有人问我", category: "fakeExperience", weight: 4, note: "AI 伪痛点开头" },
  { pattern: "说实话", category: "fakeExperience", weight: 3, note: "AI 伪真诚话术" },
  { pattern: "讲真", category: "fakeExperience", weight: 3, note: "AI 伪真诚话术" },
  { pattern: "踩过坑", category: "fakeExperience", weight: 4, note: "AI 伪教训话术" },
  { pattern: "最开始也踩过坑", category: "fakeExperience", weight: 4, note: "AI 伪教训话术" },
  { pattern: "今天就把我的.{0,6}经验", category: "fakeExperience", weight: 4, note: "AI 伪分享承诺" },
  { pattern: "把我的.{0,6}经验.{0,4}摊开", category: "fakeExperience", weight: 4, note: "AI 伪分享承诺" },
  { pattern: "把我的实战经验", category: "fakeExperience", weight: 4, note: "AI 伪分享承诺" },
  { pattern: "看完你就知道", category: "fakeExperience", weight: 4, note: "AI 伪承诺收尾" },
  { pattern: "看完这篇.{0,4}你就", category: "fakeExperience", weight: 4, note: "AI 伪承诺收尾" },
  { pattern: "我测试过", category: "fakeExperience", weight: 3, note: "AI 伪数据背书" },
  { pattern: "我做过一个测试", category: "fakeExperience", weight: 4, note: "AI 伪数据背书" },
  { pattern: "我做过.{0,4}测试", category: "fakeExperience", weight: 4, note: "AI 伪数据背书" },
  { pattern: "我实测过", category: "fakeExperience", weight: 4, note: "AI 伪数据背书" },
  { pattern: "我认识一个", category: "fakeExperience", weight: 3, note: "AI 伪案例" },
  { pattern: "我有个朋友", category: "fakeExperience", weight: 3, note: "AI 伪案例" },
  { pattern: "我有个学员", category: "fakeExperience", weight: 4, note: "AI 伪案例（培训引流）" },
  { pattern: "我见过太多人", category: "fakeExperience", weight: 4, note: "AI 伪案例" },
  { pattern: "我见过不少", category: "fakeExperience", weight: 3, note: "AI 伪案例" },
  { pattern: "我的建议是", category: "fakeExperience", weight: 3, note: "AI 伪建议" },
  { pattern: "我个人建议", category: "fakeExperience", weight: 3, note: "AI 伪建议" },
  { pattern: "我个人的配置", category: "fakeExperience", weight: 4, note: "AI 伪配置分享" },
  { pattern: "我个人的做法", category: "fakeExperience", weight: 4, note: "AI 伪做法分享" },
  { pattern: "让我上个月", category: "fakeExperience", weight: 4, note: "AI 伪业绩背书" },
  { pattern: "让我上个月.{0,10}突破", category: "fakeExperience", weight: 5, note: "AI 伪业绩背书" },

  // === AI 决策模板（"如果你想XX选X；如果你想XX选Y"对比句式） ===
  { pattern: "如果你想.{1,15}选.{1,15}", category: "decision", weight: 5, note: "AI 决策对比模板" },
  { pattern: "如果你想.{1,15}更适合", category: "decision", weight: 5, note: "AI 决策对比模板" },
  { pattern: "如果你.{1,10}选.{1,8}如果你.{1,10}更适合", category: "decision", weight: 6, note: "AI 双决策对比模板" },
  { pattern: "如果你有稳定.{0,6}想快速变现", category: "decision", weight: 4, note: "AI 决策模板" },
  { pattern: "如果你没有.{0,6}还在测试", category: "decision", weight: 4, note: "AI 决策模板" },
  { pattern: "如果你两者都想", category: "decision", weight: 4, note: "AI 决策模板" },
  { pattern: "答案不同，选择就不同", category: "decision", weight: 5, note: "AI 决策收尾" },
  { pattern: "没有哪个更好，只有哪个更", category: "decision", weight: 5, note: "AI 决策收尾" },
  { pattern: "说到底就是", category: "decision", weight: 3, note: "AI 总结句式" },

  // === 引流话术（评论区/私信/下期） ===
  { pattern: "评论区告诉我", category: "engagement", weight: 5, note: "AI 引流话术" },
  { pattern: "在评论区", category: "engagement", weight: 3, note: "AI 引流话术" },
  { pattern: "选一个，我下期", category: "engagement", weight: 5, note: "AI 引流话术" },
  { pattern: "我下期.{0,4}解答", category: "engagement", weight: 5, note: "AI 引流话术" },
  { pattern: "下期专门", category: "engagement", weight: 5, note: "AI 引流话术" },
  { pattern: "私信我", category: "engagement", weight: 4, note: "AI 引流话术" },
  { pattern: "加我微信", category: "engagement", weight: 5, note: "AI 引流话术" },
  { pattern: "关注我.{0,4}更多", category: "engagement", weight: 4, note: "AI 引流话术" },
  { pattern: "点个关注", category: "engagement", weight: 4, note: "AI 引流话术" },

  // === 并列同质化结构（"XX不同"重复 N 次） ===
  { pattern: "展示位置不同", category: "structure", weight: 3, note: "AI 并列同质化结构" },
  { pattern: "功能定位不同", category: "structure", weight: 3, note: "AI 并列同质化结构" },
  { pattern: "开通门槛不同", category: "structure", weight: 3, note: "AI 并列同质化结构" },
  { pattern: "适合人群不同", category: "structure", weight: 3, note: "AI 并列同质化结构" },
  { pattern: "收益模式不同", category: "structure", weight: 3, note: "AI 并列同质化结构" },
  { pattern: "从.{1,4}个维度", category: "structure", weight: 4, note: "AI 维度展开模板" },
  { pattern: "先问自己.{0,4}个问题", category: "structure", weight: 5, note: "AI 收尾结构" },

  // === 营销导向话术（商业变现/流量收割/转化话术，百度判定营销属性偏高） ===
  { pattern: "快速变现", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "收割.{0,4}流量", category: "marketing", weight: 4, note: "营销话术（流量收割）" },
  { pattern: "引流.{0,4}变现", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "批量铺.{0,4}词", category: "marketing", weight: 4, note: "营销话术（铺词）" },
  { pattern: "日赚\\d+", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "月入\\d+", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "GMV.{0,4}突破", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "转化率.{0,4}提升", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "流量.{0,4}暴涨", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "权重.{0,4}提升", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "排名.{0,4}第一", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "搜索.{0,4}霸屏", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "包.{0,4}收录", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "收录.{0,4}下滑", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "降权", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "权重.{0,4}掉了", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "不.{0,4}收录", category: "marketing", weight: 2, note: "营销话术" },
  { pattern: "帮你.{0,3}提升", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "帮你.{0,3}优化", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "帮你.{0,3}解决", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "帮你.{0,3}搞定", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "教你.{0,4}快速", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "教你.{0,4}如何", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "手把手教你", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "学会.{0,4}就能", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "学会.{0,4}不再", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "不再.{0,4}踩坑", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "翻身.{0,4}秘籍", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "爆款.{0,4}方法", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "暴利.{0,4}项目", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "躺赚", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "被动收入", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "副业.{0,4}月入", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "小白.{0,4}也能", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "新手.{0,4}也能", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "零基础.{0,4}也能", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "免费.{0,4}教程", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "限时.{0,4}免费", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "错过.{0,4}后悔", category: "marketing", weight: 4, note: "营销话术" },
  { pattern: "赶紧.{0,4}收藏", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "建议收藏", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "先收藏.{0,4}再看", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "转发.{0,4}更多人", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "分享给.{0,4}朋友", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "点赞.{0,4}收藏", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "觉得有用.{0,4}点赞", category: "marketing", weight: 3, note: "营销话术" },
  { pattern: "觉得有用.{0,4}转发", category: "marketing", weight: 3, note: "营销话术" },
];

/** AI 偏爱的高频逻辑连接词（过度使用是 AI 文本特征） */
export const AI_CONNECTORS = [
  "因此", "然而", "此外", "另外", "同时", "总之", "所以",
  "但是", "不过", "而且", "并且", "从而", "进而", "于是",
  "实际上", "事实上", "其实", "当然", "显然", "显然地",
  "与此同时", "在此基础上", "在此背景下",
];

/** AI 偏爱的万能形容词（空泛无实质） */
export const AI_VAGUE_ADJECTIVES = [
  "重要", "关键", "核心", "根本", "基本", "主要",
  "显著", "明显", "突出", "卓越", "优秀", "良好",
  "丰富", "多样", "全面", "完整", "系统", "深入",
];

/** 模板类别显示配置 */
export const CATEGORY_LABEL: Record<AiTemplateCategory, { label: string; color: string }> = {
  opening: { label: "开头套话", color: "#FF3D5A" },
  transition: { label: "过渡套话", color: "#FFB300" },
  conclusion: { label: "结尾套话", color: "#FF6B81" },
  filler: { label: "空话句式", color: "#FF3D5A" },
  structure: { label: "结构化模板", color: "#5DECFF" },
  hedge: { label: "模糊表达", color: "#FFB300" },
  listing: { label: "列举式", color: "#5DECFF" },
  fakeExperience: { label: "伪个人经验", color: "#FF3D5A" },
  decision: { label: "AI 决策模板", color: "#FF6B81" },
  engagement: { label: "引流话术", color: "#FFB300" },
  marketing: { label: "营销导向话术", color: "#FF3D5A" },
};

/** AI 标题模板（标题党/AI 引流标题） */
export const AI_TITLE_PATTERNS = [
  /一文搞懂/,
  /一文读懂/,
  /一文看懂/,
  /全攻略/,
  /完整指南/,
  /终极指南/,
  /深度解析/,
  /深度评测/,
  /全方位/,
  /手把手/,
  /从零开始/,
  /从入门到精通/,
  /90%.{0,4}都不知道/,
  /99%.{0,4}都不知道/,
  /必看/,
  /干货/,
  /收藏/,
];
