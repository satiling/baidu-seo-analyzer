/**
 * AI内容检测引擎
 * 针对2026飓风算法4.0、清风算法5.0对AI批量生成低质内容的专项检测
 *
 * 检测维度：
 * 1. AI套话模板特征库（60+模式）
 * 2. 连接词堆砌检测
 * 3. 句长方差分析（AI内容句长过于均匀）
 * 4. 具体性指标检测（数字、日期、专有名词比例）
 * 5. 人称代词缺失检测
 * 6. 段落长度均匀度检测
 * 7. 信息密度检测（实质内容占比）
 * 8. 语义同质化检测（n-gram重复率）
 * 9. 空洞废话检测
 * 10. 观点独特性检测
 */

// ======================== AI套话模板特征库 ========================
const AI_TEMPLATE_PATTERNS = [
  // 开头套话
  '随着科技的不断发展', '随着互联网的', '在当今社会', '在当今时代', '在当前时代',
  '在信息化时代', '在数字化时代', '如今，', '近年来，', '现代社会中',
  '随着社会的进步', '随着经济的', '伴随着', '众所周知', '不言而喻',
  // 过渡套话
  '值得注意的是', '需要指出的是', '需要强调的是', '毋庸置疑', '毫无疑问',
  '显而易见', '不可否认的是', '总而言之', '综上所述', '总的来说',
  '由此可见', '不难看出', '可以看出', '通过以上分析', '通过上述',
  // 列举套话
  '首先，', '其次，', '再次，', '最后，', '此外，', '另外，',
  '一方面', '另一方面', '与此同时', '在此过程中',
  '本文将从以下几个方面', '让我们一起来', '接下来我们', '下面我们将',
  '具体来说', '总的来说', '从某种程度上', '在一定程度上',
  // 结尾套话
  '这对于', '具有重要意义', '发挥着重要作用', '起到了关键作用',
  '将会越来越', '必将成为', '有望成为', '值得我们深思',
  '是一个长期的', '是一个复杂', '是一个不断',
  // AI常用形容词堆砌
  '高效的', '便捷的', '智能的', '创新的', '优质的', '卓越的',
  '全方位的', '多层次的', '多维度的', '深度的', '广泛的',
  // AI常用动词堆砌
  '致力于', '旨在', '赋能', '助力', '打造', '构建',
  '推动', '促进', '提升', '优化', '完善', '加强',
  // 万能废话
  '不仅可以', '还可以', '既能', '也能', '既', '又',
  '在某种程度上', '从某种角度', '从宏观', '从微观',
  '我们需要', '我们应该', '我们要', '我们应当',
];

// ======================== AI连接词堆砌检测 ========================
const AI_CONNECTORS = [
  '因此', '所以', '然而', '但是', '不过', '虽然', '尽管', '即使',
  '因为', '由于', '基于', '根据', '按照', '凭借', '通过', '借助',
  '从而', '进而', '由此', '对此', '为此', '至此',
  '同时', '此外', '另外', '并且', '而且', '再者', '再次',
  '首先', '其次', '然后', '最后', '总之', '综上',
];

// ======================== 真实经验信号词（正向）========================
const REAL_EXPERIENCE_SIGNALS = [
  '我', '我们', '笔者', '本人', '亲测', '实测', '试用', '踩坑',
  '案例', '实战', '实操', '操作步骤', '步骤', '具体做法',
  '上周', '昨天', '今天', '上个月', '去年', '近日',
  '记得', '当时', '那次', '这次', '有一次',
  '错误', '失败', '问题', '踩了', '报错', '异常',
  '花了', '用了', '耗时', '第一次', '第二次',
  '北京', '上海', '深圳', '杭州', '广州', // 具体地名
  '我发现', '我们认为', '根据我的', '我们的团队',
];

// ======================== 具体性指标词 ========================
const SPECIFIC_INDICATORS = [
  // 数字百分比
  /\d+%/, /\d+万/, /\d+亿/, /\d+元/, /\d+块/, /\d+次/, /\d+个/, /\d+种/, /\d+项/,
  // 日期
  /\d{4}年/, /\d{1,2}月\d{1,2}日/, /\d{1,2}月/,
  // 时间
  /\d+小时/, /\d+分钟/, /\d+秒/, /\d+天/,
  // 版本号
  /v\d+\.\d+/, /版本\d+/, /V\d+\.\d+/,
  // 计量
  /\d+kg/, /\d+km/, /\d+MB/, /\d+GB/, /\d+TB/, /\d+MB\/s/,
];

// ======================== 主检测函数 ========================

/**
 * 全面检测AI生成内容特征
 * @param {string} text - 正文文本（已去除HTML标签）
 * @param {Object} $ - cheerio实例
 * @returns {Object} { aiScore, aiProbability, signals, findings }
 */
function detectAIContent(text, $) {
  const signals = [];
  const findings = [];
  let aiProbability = 0; // AI生成概率 0-100

  const textLength = text.length;
  if (textLength < 100) {
    return { aiProbability: 30, aiLevel: 'low', signals, findings, reason: '内容过短' };
  }

  // ========== 1. AI套话模板检测 ==========
  let templateHits = 0;
  const matchedTemplates = [];
  AI_TEMPLATE_PATTERNS.forEach(p => {
    const count = (text.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (count > 0) {
      templateHits += count;
      if (matchedTemplates.length < 5) matchedTemplates.push(p);
    }
  });

  // 套话密度 = 套话命中次数 / 千字
  const templateDensity = templateHits / (textLength / 1000);
  if (templateDensity >= 15) {
    aiProbability += 45;
    signals.push({ type: 'template', level: 'high', value: templateHits, density: templateDensity.toFixed(1) });
    findings.push({
      type: 'fail',
      message: `AI套话模板密度${templateDensity.toFixed(1)}/千字（命中${templateHits}处，如"${matchedTemplates.slice(0,3).join('、')}"），飓风4.0专项打击批量AI生成套话文`,
      suggestion: '彻底重写，删除所有模板化开头/过渡/结尾表达，用真实经验替代',
    });
  } else if (templateDensity >= 8) {
    aiProbability += 30;
    signals.push({ type: 'template', level: 'high', value: templateHits, density: templateDensity.toFixed(1) });
    findings.push({
      type: 'fail',
      message: `AI套话模板密度${templateDensity.toFixed(1)}/千字（命中${templateHits}处，如"${matchedTemplates.slice(0,3).join('、')}"），飓风4.0专项打击批量AI生成套话文`,
      suggestion: '彻底重写，删除所有模板化开头/过渡/结尾表达，用真实经验替代',
    });
  } else if (templateDensity >= 4) {
    aiProbability += 18;
    signals.push({ type: 'template', level: 'medium', value: templateHits, density: templateDensity.toFixed(1) });
    findings.push({
      type: 'warn',
      message: `AI套话模板密度${templateDensity.toFixed(1)}/千字（命中${templateHits}处），疑似AI生成`,
      suggestion: '替换模板化表达，增加原创观点和独特视角',
    });
  } else if (templateDensity >= 2) {
    aiProbability += 8;
    signals.push({ type: 'template', level: 'low', value: templateHits, density: templateDensity.toFixed(1) });
  }

  // ========== 2. 连接词堆砌检测 ==========
  let connectorHits = 0;
  AI_CONNECTORS.forEach(c => {
    const regex = new RegExp(c, 'g');
    const count = (text.match(regex) || []).length;
    connectorHits += count;
  });
  const connectorDensity = connectorHits / (textLength / 1000);
  if (connectorDensity >= 15) {
    aiProbability += 18;
    signals.push({ type: 'connector', level: 'high', value: connectorHits, density: connectorDensity.toFixed(1) });
    findings.push({
      type: 'warn',
      message: `连接词密度${connectorDensity.toFixed(1)}/千字（${connectorHits}处），AI生成内容常见特征`,
      suggestion: '减少逻辑连接词堆砌，用自然语流替代',
    });
  } else if (connectorDensity >= 10) {
    aiProbability += 8;
    signals.push({ type: 'connector', level: 'medium', value: connectorHits });
  }

  // ========== 3. 句长方差分析 ==========
  const sentences = text.split(/[。！？.!?；;\n]/).map(s => s.trim()).filter(s => s.length > 5);
  if (sentences.length >= 6) {
    const sentenceLens = sentences.map(s => s.length);
    const avgLen = sentenceLens.reduce((a,b) => a+b, 0) / sentenceLens.length;
    const variance = sentenceLens.reduce((sum, len) => sum + Math.pow(len - avgLen, 2), 0) / sentenceLens.length;
    const stdDev = Math.sqrt(variance);
    const cv = avgLen > 0 ? stdDev / avgLen : 0; // 变异系数

    // 人类写作句长变异系数通常 > 0.5，AI生成往往 < 0.35
    if (cv < 0.25) {
      aiProbability += 22;
      signals.push({ type: 'sentenceVariance', level: 'high', cv: cv.toFixed(2), avgLen: avgLen.toFixed(0) });
      findings.push({
        type: 'fail',
        message: `句长变异系数仅${cv.toFixed(2)}（平均句长${avgLen.toFixed(0)}字），句式高度均匀，AI生成特征明显`,
        suggestion: '人类写作句长有自然波动，应混合长短句，加入问句、感叹句、短句强化节奏',
      });
    } else if (cv < 0.4) {
      aiProbability += 10;
      signals.push({ type: 'sentenceVariance', level: 'medium', cv: cv.toFixed(2) });
      findings.push({
        type: 'warn',
        message: `句长变异系数${cv.toFixed(2)}偏低，句式较为单一`,
        suggestion: '混合使用长短句，增加表达节奏感',
      });
    }
  }

  // ========== 4. 具体性指标检测 ==========
  let specificHits = 0;
  SPECIFIC_INDICATORS.forEach(re => {
    const m = text.match(re);
    if (m) specificHits += m.length;
  });
  const specificDensity = specificHits / (textLength / 1000);
  // 真实内容通常具体指标密度 > 5/千字，AI空洞内容往往 < 2/千字
  if (specificDensity < 1) {
    aiProbability += 22;
    signals.push({ type: 'specificity', level: 'low', value: specificHits, density: specificDensity.toFixed(1) });
    findings.push({
      type: 'fail',
      message: `具体数据/日期/数字密度仅${specificDensity.toFixed(1)}/千字，内容空洞无实质信息，飓风4.0判定低质`,
      suggestion: '加入具体数据、案例、日期、版本号、实测数字等可验证信息',
    });
  } else if (specificDensity < 3) {
    aiProbability += 10;
    signals.push({ type: 'specificity', level: 'medium', value: specificHits });
    findings.push({
      type: 'warn',
      message: `具体数据密度${specificDensity.toFixed(1)}/千字偏低，缺少可验证信息`,
      suggestion: '补充实测数据、具体案例、权威引用',
    });
  } else if (specificDensity >= 5) {
    aiProbability -= 8; // 有具体数据，降低AI概率
  }

  // ========== 5. 人称代词/真实经验信号检测 ==========
  let experienceHits = 0;
  REAL_EXPERIENCE_SIGNALS.forEach(w => {
    if (text.includes(w)) experienceHits++;
  });
  if (experienceHits === 0) {
    aiProbability += 18;
    signals.push({ type: 'experience', level: 'missing' });
    findings.push({
      type: 'fail',
      message: '全文无任何人称代词和真实经验信号（我/我们/笔者/亲测/案例等），AI生成特征明显',
      suggestion: '加入第一人称叙述、真实案例、实操经验，体现真实作者身份',
    });
  } else if (experienceHits <= 2) {
    aiProbability += 10;
    signals.push({ type: 'experience', level: 'low', value: experienceHits });
    findings.push({
      type: 'warn',
      message: `真实经验信号仅${experienceHits}处，缺少作者真实参与感`,
      suggestion: '增加"我们"、"实测"、"案例"等真实经验表达',
    });
  } else if (experienceHits >= 5) {
    aiProbability -= 10; // 真实经验丰富，降低AI概率
  }

  // ========== 6. 段落长度均匀度检测 ==========
  const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().filter(t => t.length > 20);
  if (paragraphs.length >= 4) {
    const paraLens = paragraphs.map(p => p.length);
    const avgParaLen = paraLens.reduce((a,b) => a+b, 0) / paraLens.length;
    const paraVariance = paraLens.reduce((sum, len) => sum + Math.pow(len - avgParaLen, 2), 0) / paraLens.length;
    const paraCV = avgParaLen > 0 ? Math.sqrt(paraVariance) / avgParaLen : 0;

    // AI生成段落长度往往很均匀（CV < 0.3），人类写作段落长短差异大
    if (paraCV < 0.2 && paragraphs.length >= 5) {
      aiProbability += 15;
      signals.push({ type: 'paragraphUniformity', level: 'high', cv: paraCV.toFixed(2) });
      findings.push({
        type: 'warn',
        message: `段落长度变异系数${paraCV.toFixed(2)}极低，段落高度均匀，AI生成特征`,
        suggestion: '人类写作段落长短不一，应让段落有自然差异，重点段详细展开，过渡段简短',
      });
    } else if (paraCV < 0.35 && paragraphs.length >= 5) {
      aiProbability += 6;
      signals.push({ type: 'paragraphUniformity', level: 'medium', cv: paraCV.toFixed(2) });
    }
  }

  // ========== 7. 信息密度检测（实质内容占比）==========
  // 去除套话、连接词后的实质内容比例
  let fluffText = text;
  AI_TEMPLATE_PATTERNS.forEach(p => {
    fluffText = fluffText.split(p).join('');
  });
  AI_CONNECTORS.forEach(c => {
    fluffText = fluffText.split(c).join('');
  });
  // 去除标点和空白
  const fluffStripped = fluffText.replace(/[，。！？、；：""''（）()【】《》<>\s\n\r\t,.\!?;:"']/g, '');
  const originalStripped = text.replace(/[，。！？、；：""''（）()【】《》<>\s\n\r\t,.\!?;:"']/g, '');
  const infoDensity = originalStripped.length > 0 ? fluffStripped.length / originalStripped.length : 1;

  if (infoDensity < 0.6) {
    aiProbability += 20;
    signals.push({ type: 'infoDensity', level: 'low', value: (infoDensity*100).toFixed(0) + '%' });
    findings.push({
      type: 'fail',
      message: `信息密度仅${(infoDensity*100).toFixed(0)}%（去除套话/连接词后实质内容占比），废话占比过高，飓风4.0判定低质空洞`,
      suggestion: '删除所有套话和过渡废话，每句话必须提供具体信息或明确观点',
    });
  } else if (infoDensity < 0.75) {
    aiProbability += 8;
    signals.push({ type: 'infoDensity', level: 'medium', value: (infoDensity*100).toFixed(0) + '%' });
    findings.push({
      type: 'warn',
      message: `信息密度${(infoDensity*100).toFixed(0)}%偏低，存在废话填充`,
      suggestion: '压缩套话，每段提供实质信息',
    });
  }

  // ========== 8. 语义同质化检测（n-gram重复率）==========
  if (textLength > 300) {
    // 提取4-gram
    const cleanedText = text.replace(/[^\u4e00-\u9fa5]/g, '');
    const ngrams = [];
    const N = 4;
    for (let i = 0; i <= cleanedText.length - N; i++) {
      ngrams.push(cleanedText.substring(i, i + N));
    }
    if (ngrams.length > 20) {
      const ngramSet = new Set(ngrams);
      const repeatRate = 1 - (ngramSet.size / ngrams.length);
      // 正常文章4-gram重复率 0.3-0.5，AI同质化内容 > 0.6
      if (repeatRate > 0.7) {
        aiProbability += 20;
        signals.push({ type: 'ngramRepeat', level: 'high', value: (repeatRate*100).toFixed(0) + '%' });
        findings.push({
          type: 'fail',
          message: `4-gram重复率${(repeatRate*100).toFixed(0)}%极高，语义同质化严重，飓风4.0语义相似度检测必判低质`,
          suggestion: '彻底重写，确保每段表达独特，避免AI改写的伪原创拼接',
        });
      } else if (repeatRate > 0.55) {
        aiProbability += 10;
        signals.push({ type: 'ngramRepeat', level: 'medium', value: (repeatRate*100).toFixed(0) + '%' });
        findings.push({
          type: 'warn',
          message: `4-gram重复率${(repeatRate*100).toFixed(0)}%偏高，存在语义同质化`,
          suggestion: '增加词汇多样性，避免重复表达',
        });
      }
    }
  }

  // ========== 9. 标点符号多样性检测 ==========
  if (textLength > 300) {
    const punctTypes = {
      comma: (text.match(/，/g) || []).length,
      period: (text.match(/。/g) || []).length,
      question: (text.match(/[？?]/g) || []).length,
      exclaim: (text.match(/[！!]/g) || []).length,
      semicolon: (text.match(/[；;]/g) || []).length,
      colon: (text.match(/[：:]/g) || []).length,
      dash: (text.match(/[—–-]/g) || []).length,
      quote: (text.match(/[""''""'']/g) || []).length,
    };
    const usedTypes = Object.values(punctTypes).filter(c => c > 0).length;
    // AI生成内容往往只用逗号和句号，缺少问号感叹号等
    if (usedTypes <= 2) {
      aiProbability += 12;
      signals.push({ type: 'punctuation', level: 'low', types: usedTypes });
      findings.push({
        type: 'warn',
        message: `仅使用${usedTypes}种标点符号，缺少问号/感叹号/破折号等，AI生成特征`,
        suggestion: '增加反问句、感叹句、引用等，丰富标点使用',
      });
    }
  }

  // ========== 10. 观点独特性检测 ==========
  if (textLength > 300) {
    // 检测是否有独特观点表达
    const opinionMarkers = [
      '我认为', '笔者认为', '在我看来', '个人认为', '我的观点',
      '不同于', '区别于', '相比之下', '与传统的', '反观',
      '争议', '质疑', '反对', '批评', '建议', '提醒',
      '错误', '误区', '陷阱', '坑', '注意',
    ];
    let opinionHits = 0;
    opinionMarkers.forEach(m => { if (text.includes(m)) opinionHits++; });
    if (opinionHits === 0) {
      aiProbability += 12;
      signals.push({ type: 'opinion', level: 'missing' });
      findings.push({
        type: 'warn',
        message: '未检测到任何独特观点表达（我认为/在我看来/区别于/误区等），内容中性描述过多',
        suggestion: '加入作者观点、对比分析、风险提醒等独特视角',
      });
    }
  }

  // ========== 综合AI概率 ==========
  aiProbability = Math.max(0, Math.min(95, aiProbability));

  // 判定等级
  let aiLevel = 'human'; // human / low / medium / high
  if (aiProbability >= 65) aiLevel = 'high';
  else if (aiProbability >= 40) aiLevel = 'medium';
  else if (aiProbability >= 20) aiLevel = 'low';

  return {
    aiProbability,
    aiLevel,
    signals,
    findings,
    templateHits,
    templateDensity: templateDensity.toFixed(1),
    infoDensity: (infoDensity * 100).toFixed(0) + '%',
    specificDensity: specificDensity.toFixed(1),
    experienceHits,
  };
}

module.exports = {
  detectAIContent,
  AI_TEMPLATE_PATTERNS,
  AI_CONNECTORS,
  REAL_EXPERIENCE_SIGNALS,
  SPECIFIC_INDICATORS,
};
