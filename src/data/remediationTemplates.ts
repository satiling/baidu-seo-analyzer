import type { RemediationItem } from "@/types/detection";

/** 整改建议模板库：按算法与违规类型索引 */
export interface RemediationTemplate {
  algorithmId: string;
  priority: RemediationItem["priority"];
  title: string;
  problem: string;
  solution: string;
  codeSample?: string;
  impact: string;
}

export const REMEDIATION_TEMPLATES: Record<string, RemediationTemplate[]> = {
  hurricane: [
    {
      algorithmId: "hurricane",
      priority: "P0",
      title: "降低 AI 痕迹，增加原创增量",
      problem: "AI 痕迹分评估偏高（需人工复核正文确认），疑似 AI 批量生成或采集伪原创。",
      solution:
        "人工核查正文是否为 AI 套话文，对每篇内容加入人工撰写的独家观点、实测数据、案例截图；删除套话段落；使用 AI 检测工具自检后再发布。",
      codeSample:
        "<!-- 结构化标记作者与更新时间 -->\n<article>\n  <header>\n    <span itemprop=\"author\">作者：张三（10年行业经验）</span>\n    <time itemprop=\"dateModified\" datetime=\"2026-07-01\">2026-07-01 更新</time>\n  </header>\n  <!-- 正文需含独家数据/案例 -->\n</article>",
      impact: "飓风算法扣分减少 60% 以上，避免整站降权风险。",
    },
    {
      algorithmId: "hurricane",
      priority: "P1",
      title: "建立站内内容去重机制",
      problem: "站内存在多篇语义高度相似内容，触发跨平台指纹库重复判定。",
      solution:
        "使用 TF-IDF 或语义相似度工具定期扫描站内文章，合并相似度 > 0.8 的页面，使用 301 重定向到规范版本。",
      impact: "消除重复内容判定，提升整站内容质量分。",
    },
  ],
  breeze: [
    {
      algorithmId: "breeze",
      priority: "P0",
      title: "清理正文穿插的引流信息",
      problem: "URL 路径包含引流相关信号，存在正文穿插联系方式/微信/广告的风险（需人工复核正文确认）。",
      solution:
        "人工打开页面核查正文段落，若实际穿插联系方式/微信/广告，将其迁移至页脚或独立「联系我们」页；正文仅保留与主题相关内容。",
      codeSample:
        "<!-- 错误：正文穿插 -->\n<p>我们的服务很好，<a>加微信 xxx</a> 了解更多。</p>\n\n<!-- 正确：页脚集中 -->\n<footer>\n  <a href=\"/contact\">联系我们</a>\n</footer>",
      impact: "消除清风算法引流作弊判定，关键词作弊扣分清零。",
    },
    {
      algorithmId: "breeze",
      priority: "P1",
      title: "标题与正文语义对齐",
      problem: "标题与正文语义匹配度低，疑似标题党或 AI 引流页。",
      solution:
        "重写标题使其准确概括正文核心；正文前 100 字必须出现标题承诺的信息；避免标题党词汇（震惊、必看等）。",
      impact: "提升标题正文匹配度，清风算法恢复至安全区间。",
    },
    {
      algorithmId: "breeze",
      priority: "P2",
      title: "降低关键词密度",
      problem: "关键词密度过高，存在堆砌嫌疑。",
      solution:
        "将关键词密度控制在 2%-5%；使用同义词与相关语义词替换部分关键词；自然语言优先。",
      impact: "避免关键词堆砌判定，ERNIE 语义识别更友好。",
    },
  ],
  bluesky: [
    {
      algorithmId: "bluesky",
      priority: "P1",
      title: "清理低质外链与友链",
      problem: "存在批量交换的低质友情链接或目录链接，低质外链占比偏高。",
      solution:
        "使用百度搜索资源平台外链分析工具，拒绝低质外链；清理与网站主题无关的友链；锚文本多样化。",
      codeSample:
        "# robots 禁止低质目录页抓取\nUser-agent: Baiduspider\nDisallow: /links/\nDisallow: /directory/",
      impact: "蓝天算法外链质量分提升，避免锚文本同质化作弊判定。",
    },
  ],
  lightning: [
    {
      algorithmId: "lightning",
      priority: "P0",
      title: "优化首屏加载速度",
      problem: "首屏加载超过 3 秒，移动端交互流畅度差。",
      solution:
        "压缩图片（WebP/AVIF）、启用 Gzip/Brotli、关键 CSS 内联、JS 延迟加载、使用 CDN。",
      codeSample:
        "<!-- 图片懒加载 + 现代格式 -->\n<img loading=\"lazy\" srcset=\"hero.webp\" />\n\n<!-- JS 延迟加载 -->\n<script defer src=\"app.js\"></script>",
      impact: "首屏 LCP 降至 1.5 秒内，闪电算法恢复满分区间。",
    },
    {
      algorithmId: "lightning",
      priority: "P1",
      title: "改善移动端交互流畅度",
      problem: "滑动卡顿、点击响应延迟、动画掉帧等交互问题。",
      solution:
        "避免大量同步 JS 阻塞；使用 CSS transform/opacity 做动画；被动事件监听 passive:true；减少布局抖动。",
      codeSample:
        "document.addEventListener('touchmove', handler, { passive: true });\n\n/* 使用 transform 替代 top/left */\n.move { transform: translateX(0); transition: transform .2s; }",
      impact: "移动端交互分提升至 80+，排名权重不再下调。",
    },
  ],
  thunder: [
    {
      algorithmId: "thunder",
      priority: "P0",
      title: "立即停止快排与刷量",
      problem: "检测到疑似使用快排工具或机器刷量行为，惊雷算法将触发反向降权。",
      solution:
        "立即停用所有快排/刷量工具与代运营服务；登录百度搜索资源平台查看流量异常告警；通过自然内容获取真实点击。",
      impact: "避免反向降权，3-6 个月后流量可自然恢复。",
    },
  ],
  ernie: [
    {
      algorithmId: "ernie",
      priority: "P1",
      title: "围绕用户意图组织内容",
      problem: "内容仅堆砌关键词，未覆盖用户真实搜索意图与相关实体。",
      solution:
        "分析搜索意图（信息型/导航型/交易型）；用 People Also Ask 拓展语义；覆盖相关实体与长尾问题；自然语言完整作答。",
      codeSample:
        "<!-- FAQ 结构化数据覆盖长尾意图 -->\n<script type=\"application/ld+json\">\n{\n  \"@type\": \"FAQPage\",\n  \"mainEntity\": [{\n    \"@type\": \"Question\",\n    \"name\": \"XX 怎么选？\",\n    \"acceptedAnswer\": { \"text\": \"...\" }\n  }]\n}\n</script>",
      impact: "ERNIE 语义匹配度提升，长尾词排名能力增强。",
    },
  ],
  eeat: [
    {
      algorithmId: "eeat",
      priority: "P0",
      title: "补充作者身份与专业背书",
      problem: "页面缺少明确作者身份、专业资质、权威来源引用，EEAT 不达标。",
      solution:
        "添加作者介绍页（含资质、履历）；专业内容由领域专家审核署名；引用政府/学术权威来源并标注链接。",
      codeSample:
        "<!-- 作者结构化数据 -->\n<script type=\"application/ld+json\">\n{\n  \"@type\": \"Article\",\n  \"author\": {\n    \"@type\": \"Person\",\n    \"name\": \"张三\",\n    \"jobTitle\": \"资深 SEO 顾问（10年经验）\"\n  }\n}\n</script>",
      impact: "EEAT 可信度提升，专业领域内容获得排名加权。",
    },
    {
      algorithmId: "eeat",
      priority: "P1",
      title: "展示真实经验案例",
      problem: "内容缺乏经验（Experience）维度支撑，可信度不足。",
      solution:
        "加入真实项目案例、数据截图、客户评价、实测过程记录；避免纯理论表述。",
      impact: "Experience 维度补齐，YMYL 领域降权风险解除。",
    },
  ],
  sandbox: [
    {
      algorithmId: "sandbox",
      priority: "P1",
      title: "完成 ICP 备案与沙盒期运营",
      problem: "域名未备案或处于动态沙盒期，收录与排名受限。",
      solution:
        "优先完成 ICP 备案；沙盒期专注 10-20 篇高质量内容；通过站内推荐位提升新页点击率与停留时长；降低跳出率。",
      impact: "沙盒期考核达标，页面保留索引并参与排名。",
    },
  ],
};

/** 默认通用整改项（当无具体命中时使用） */
export const DEFAULT_REMEDIATION: RemediationTemplate = {
  algorithmId: "general",
  priority: "P3",
  title: "持续监控算法更新",
  problem: "百度算法持续迭代，需定期复查。",
  solution: "订阅百度搜索资源平台公告，每月使用本平台复检一次。",
  impact: "保持合规状态，避免新算法迭代导致的降权。",
};
