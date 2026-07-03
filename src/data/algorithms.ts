import type { AlgorithmMeta } from "@/types/detection";

/** 八大算法 / 机制静态元数据 */
export const ALGORITHM_META: AlgorithmMeta[] = [
  {
    id: "hurricane",
    name: "飓风算法",
    version: "4.0",
    weight: 20,
    category: "content",
    icon: "Tornado",
    color: "#FF3D5A",
    coreUpgrade:
      "在原有打击恶劣采集、跨领域聚合、站群低质内容的基础上，新增 AI 批量生成低质内容专项打击，打通小程序与 H5 内容指纹库，跨平台重复内容统一判定为低质。",
    controlPoints: [
      "批量产出的无价值 AI 套话文、语义同质化内容",
      "采集后用 AI 改写的「伪原创」内容（语义相似度检测精度大幅提升）",
      "跨平台重复内容统一判定为低质",
    ],
    violationExample:
      "某站使用 AI 工具批量生成 500 篇「XX 怎么选」类文章，语义高度同质化，仅替换品类词，被判定为无原创增量内容，整站降权。",
    complianceAdvice:
      "坚持人工原创或 AI 辅助 + 人工深度加工；每篇内容必须有独立观点、数据或经验增量；建立内容指纹去重机制，避免站内重复。",
  },
  {
    id: "breeze",
    name: "清风算法",
    version: "5.0",
    weight: 20,
    category: "cheat",
    icon: "Wind",
    color: "#FFB300",
    coreUpgrade:
      "从单纯打击标题党，扩展至全页面关键词作弊 + AI 文不对题治理，原细雨算法核心规则并入，管控正文恶意穿插联系方式、引流信息。",
    controlPoints: [
      "AI 生成内容的生硬关键词堆砌、语义重复",
      "标题与正文语义不符的 AI 生成引流页",
      "正文恶意穿插联系方式、引流信息",
    ],
    violationExample:
      "页面标题为「2026 年最新政策解读」，正文却在每段穿插「加微信 xxx 领资料」「点击咨询」等引流信息，且关键词密度异常。",
    complianceAdvice:
      "标题与正文必须语义一致；关键词自然分布，密度建议 2%-5%；联系方式与广告置于页脚或独立联系页，避免正文穿插。",
  },
  {
    id: "bluesky",
    name: "蓝天算法",
    version: "3.0",
    weight: 10,
    category: "link",
    icon: "Cloud",
    color: "#5DECFF",
    coreUpgrade:
      "升级外链质量评估体系，全面清洗劣质外链网络，付费软文外链权重直接清零，发布与购买双方同步降权。",
    controlPoints: [
      "批量交换的低质友情链接、目录链接",
      "付费软文外链权重清零，买卖双方同步降权",
      "外链锚文本高度同质化的站点判定为作弊",
    ],
    violationExample:
      "某站购买 200 条软文外链，锚文本全部为「深圳装修公司」，被识别为锚文本同质化作弊，外链权重清零并触发降权。",
    complianceAdvice:
      "外链以自然增长为主，锚文本多样化（品牌词、URL、长尾词混合）；定期清理低质友链；拒绝付费软文外链。",
  },
  {
    id: "lightning",
    name: "闪电算法",
    version: "3.0",
    weight: 15,
    category: "speed",
    icon: "Zap",
    color: "#FFE34D",
    coreUpgrade:
      "从单纯考核首屏加载速度，扩展至移动端全链路交互流畅度考核，新增滑动卡顿率、点击响应延迟、资源加载阻塞、动画掉帧等体验指标。",
    controlPoints: [
      "首屏加载超过 3 秒排名权重显著下调",
      "滑动卡顿率、点击响应延迟超标",
      "资源加载阻塞、动画掉帧等交互问题",
    ],
    violationExample:
      "移动端首屏加载 5.2 秒，JS 资源未压缩且阻塞渲染，滑动出现明显卡顿，交互体验评分仅 42 分，排名权重下调。",
    complianceAdvice:
      "首屏 LCP 控制在 1.5 秒内；压缩 JS/CSS、懒加载非首屏资源；使用 CDN；避免布局抖动；移动端交互延迟 < 100ms。",
  },
  {
    id: "thunder",
    name: "惊雷算法",
    version: "持续迭代",
    weight: 10,
    category: "behavior",
    icon: "AlertTriangle",
    color: "#FF6B81",
    coreUpgrade:
      "引入用户行为序列校验，对 AI 模拟点击、机器刷量、人工快排的识别准确率大幅提升，异常刷量触发反向降权。",
    controlPoints: [
      "AI 模拟点击、机器刷量识别",
      "人工快排工具基本失效",
      "异常刷量触发反向降权",
    ],
    violationExample:
      "某站使用快排工具模拟用户点击提升排名，被行为序列校验识别为机器流量，不仅未提升排名，反而被反向降权 30%。",
    complianceAdvice:
      "完全停止使用任何快排/刷量工具；通过提升内容质量与真实用户体验获取自然点击；关注真实停留时长与跳出率。",
  },
  {
    id: "ernie",
    name: "ERNIE 语义模型",
    version: "2026",
    weight: 25,
    category: "content",
    icon: "BrainCircuit",
    color: "#00E5FF",
    coreUpgrade:
      "百度全面应用 ERNIE 深度语义模型，排名核心从「关键词匹配度」转向用户意图识别 + 实体关系匹配，同义词与相关语义统一识别。",
    controlPoints: [
      "关键词匹配不再有排名优势",
      "内容是否完整准确解决用户需求成为第一优先级",
      "实体关系与意图识别驱动排名",
    ],
    violationExample:
      "页面堆砌「北京旅游」关键词 30 次，但未覆盖「景点推荐、路线规划、门票价格」等用户真实意图，排名不及语义完整的竞品。",
    complianceAdvice:
      "围绕用户搜索意图组织内容（信息型/导航型/交易型）；覆盖相关实体与长尾语义；用自然语言完整回答用户问题。",
  },
  {
    id: "eeat",
    name: "EEAT 门槛",
    version: "硬性",
    weight: 25,
    category: "authority",
    icon: "ShieldCheck",
    color: "#00E676",
    coreUpgrade:
      "经验、专业度、权威性、可信度四大维度正式纳入评分体系，医疗/金融/法律等专业领域无权威资质内容直接降权。",
    controlPoints: [
      "专业领域无权威资质、无真实经验内容降权",
      "明确作者身份、专业背书、权威来源引用获权重提升",
      "YMYL（Your Money Your Life）领域严审",
    ],
    violationExample:
      "某健康类站点发布「糖尿病治疗方案」但无医疗资质、无作者署名、无文献引用，被判定为不可信内容直接降权。",
    complianceAdvice:
      "添加作者介绍与资质证明；引用权威来源（政府、学术机构）；专业领域内容需专业人士审核；展示真实经验案例。",
  },
  {
    id: "sandbox",
    name: "动态沙盒机制",
    version: "2026",
    weight: 15,
    category: "behavior",
    icon: "Hourglass",
    color: "#B0F7FF",
    coreUpgrade:
      "收录门槛大幅收紧，新站收录周期从 1-2 周拉长至 1-3 个月，新页面收录后进入动态沙盒，行为数据不达标会被移出索引。",
    controlPoints: [
      "新站收录周期延长至 1-3 个月",
      "未备案域名收录难度陡增",
      "沙盒期通过点击率、停留时长、跳出率考核",
    ],
    violationExample:
      "新页面收录后 7 天内点击率仅 0.3%、跳出率 85%、停留 8 秒，未达沙盒考核阈值，被移出索引不再参与排名。",
    complianceAdvice:
      "新站优先完成 ICP 备案；首月专注少量高质量内容；通过站内推荐提升新页点击率与停留时长；降低跳出率。",
  },
];

export const ALGORITHM_MAP = Object.fromEntries(
  ALGORITHM_META.map((a) => [a.id, a]),
);

export function getAlgorithm(id: string): AlgorithmMeta | undefined {
  return ALGORITHM_MAP[id];
}
