const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const { URL } = require('url');
const { detectAIContent } = require('./ai-detector');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 百度蜘蛛 User-Agent
const BAIDU_SPIDER_UA = 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)';
const BAIDU_SPIDER_MOBILE_UA = 'Mozilla/5.0 (Linux;u;Android 2.3.7;zh-cn;) AppleWebKit/533.1 (KHTML,like Gecko) Version/4.0 Mobile Safari/533.1 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)';

// ======================== 核心抓取函数 ========================

async function fetchUrl(targetUrl, userAgent) {
  const startTime = Date.now();
  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: () => true,
      responseType: 'arraybuffer',
      decompress: true,
    });

    const fetchTime = Date.now() - startTime;
    const body = Buffer.from(response.data).toString('utf-8');

    return {
      success: true,
      status: response.status,
      headers: response.headers,
      body,
      fetchTime,
      finalUrl: response.request?.res?.responseUrl || targetUrl,
    };
  } catch (error) {
    const fetchTime = Date.now() - startTime;
    return { success: false, error: error.message, fetchTime, code: error.code };
  }
}

// ======================== 1. 飓风算法 4.0 ========================
function analyzeHurricane($, body) {
  const findings = [];
  let score = 100;

  $('script, style, noscript, iframe, header, footer, nav').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const textLength = bodyText.length;
  const htmlLength = body.length;
  const contentRatio = htmlLength > 0 ? textLength / htmlLength : 0;

  // ========== 基础内容长度检测 ==========
  if (textLength < 200) {
    score -= 55;
    findings.push({ type: 'fail', message: `正文仅${textLength}字，飓风4.0判定低质空洞内容，直接降权清索引`, suggestion: '丰富页面内容，确保正文不少于800字，体现原创增量' });
  } else if (textLength < 500) {
    score -= 30;
    findings.push({ type: 'fail', message: `正文${textLength}字偏少，飓风4.0要求内容有原创增量`, suggestion: '补充实质性原创内容，避免AI批量生成套话文' });
  } else if (textLength < 800) {
    score -= 15;
    findings.push({ type: 'warn', message: `正文${textLength}字尚可但偏短`, suggestion: '进一步丰富内容深度' });
  } else if (textLength < 1500) {
    findings.push({ type: 'pass', message: `正文${textLength}字，内容量达标`, suggestion: null });
  } else {
    findings.push({ type: 'pass', message: `正文${textLength}字，内容量充足`, suggestion: null });
  }

  // ========== 内容信噪比 ==========
  if (contentRatio < 0.1) {
    score -= 25;
    findings.push({ type: 'fail', message: `内容信噪比仅${(contentRatio*100).toFixed(1)}%，代码冗余严重`, suggestion: '精简HTML，提升文本占比至20%以上' });
  } else if (contentRatio < 0.2) {
    score -= 10;
    findings.push({ type: 'warn', message: `内容信噪比${(contentRatio*100).toFixed(1)}%偏低`, suggestion: '增加正文内容或精简代码' });
  } else {
    findings.push({ type: 'pass', message: `内容信噪比${(contentRatio*100).toFixed(1)}%良好`, suggestion: null });
  }

  // ========== 段落与标题结构 ==========
  const paragraphs = $('p').length;
  const headings = $('h1, h2, h3, h4, h5, h6').length;
  if (textLength > 500 && paragraphs < 3) {
    score -= 15;
    findings.push({ type: 'warn', message: `仅${paragraphs}个段落，结构不清晰`, suggestion: '合理分段，使用小标题组织内容层次' });
  }
  if (textLength > 1000 && headings === 0) {
    score -= 10;
    findings.push({ type: 'warn', message: '长文本缺少标题层级', suggestion: '添加H2/H3小标题提升可读性与结构化' });
  }

  // ========== 4.0核心：AI批量生成低质内容专项检测 ==========
  const aiResult = detectAIContent(bodyText, $);

  // 根据AI概率大幅扣分
  if (aiResult.aiLevel === 'high') {
    // AI概率≥65%，严重违规
    score -= 50;
    findings.push({
      type: 'fail',
      message: `AI生成概率${aiResult.aiProbability}%（极高），飓风4.0专项打击AI批量生成低质内容，将直接降权清索引`,
      suggestion: '彻底人工重写，去除所有AI特征：套话模板、均匀句式、缺少人称、缺少数据。加入真实经验、具体案例、独特观点',
    });
  } else if (aiResult.aiLevel === 'medium') {
    // AI概率40-64%
    score -= 32;
    findings.push({
      type: 'fail',
      message: `AI生成概率${aiResult.aiProbability}%（较高），存在多个AI内容特征，飓风4.0语义相似度检测将判定为低质`,
      suggestion: '大幅改写，重点修复：信息密度低、缺少真实经验、句式单一等问题',
    });
  } else if (aiResult.aiLevel === 'low') {
    // AI概率20-39%
    score -= 15;
    findings.push({
      type: 'warn',
      message: `AI生成概率${aiResult.aiProbability}%（中等），存在部分AI特征`,
      suggestion: '优化内容，增加真实经验和具体数据',
    });
  } else {
    findings.push({
      type: 'pass',
      message: `AI生成概率${aiResult.aiProbability}%（较低），内容具有人类写作特征`,
      suggestion: null,
    });
  }

  // 合并AI检测的具体发现
  aiResult.findings.forEach(f => findings.push(f));

  // ========== 跨领域采集检测 ==========
  const title = ($('title').text()||'').trim();
  const metaKeywords = ($('meta[name="keywords"]').attr('content')||'').trim();
  if (title && metaKeywords) {
    const titleWords = title.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    const kwWords = metaKeywords.split(/[,，\s]+/).filter(w => w.length >= 2);
    // 检测标题与关键词主题差异大
    if (titleWords.length > 0 && kwWords.length > 3) {
      const overlap = titleWords.filter(w => metaKeywords.includes(w)).length;
      if (overlap / titleWords.length < 0.2 && textLength > 500) {
        score -= 15;
        findings.push({
          type: 'warn',
          message: '标题与关键词主题不匹配，疑似跨领域采集',
          suggestion: '确保页面内容与站点定位一致，飓风2.0打击跨领域采集',
        });
      }
    }
  }

  // ========== 站群同质化检测（基于内容指纹特征）==========
  // 检测是否有大量通用模板化结构
  const templateStructures = [
    /关于我们.*联系方式.*友情链接/s,
    /公司简介.*产品中心.*新闻动态/s,
    /首页.*关于.*服务.*案例.*联系/s,
  ];
  let structureHits = 0;
  templateStructures.forEach(re => { if (re.test(bodyText)) structureHits++; });
  if (structureHits >= 2 && textLength < 2000) {
    score -= 12;
    findings.push({
      type: 'warn',
      message: '页面结构高度模板化，疑似站群批量建站',
      suggestion: '差异化页面结构，避免使用统一模板',
    });
  }

  return {
    name: '飓风算法',
    category: '内容质量',
    version: '4.0 (2026升级)',
    description: '打击恶劣采集、跨领域聚合、站群低质内容，4.0新增AI批量生成低质内容专项打击，语义同质化检测精度大幅提升',
    status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail',
    score: Math.max(0, score),
    findings,
    aiDetails: {
      aiProbability: aiResult.aiProbability,
      aiLevel: aiResult.aiLevel,
      templateHits: aiResult.templateHits,
      templateDensity: aiResult.templateDensity,
      infoDensity: aiResult.infoDensity,
      specificDensity: aiResult.specificDensity,
      experienceHits: aiResult.experienceHits,
    },
  };
}

// ======================== 2. 清风算法 5.0 ========================
function analyzeBreeze($) {
  const findings = [];
  let score = 100;

  const title = ($('title').text()||'').trim();
  const h1Text = ($('h1').first().text()||'').trim();
  const titleLen = title.length;
  const bodyText = $('body').text()||'';

  // 标题长度
  if (titleLen === 0) {
    score -= 40;
    findings.push({ type: 'fail', message: '缺少title标签', suggestion: '添加描述性页面标题' });
  } else if (titleLen > 60) {
    score -= 20;
    findings.push({ type: 'warn', message: `标题${titleLen}字过长(建议20-30汉字)`, suggestion: '精简标题突出核心关键词' });
  } else if (titleLen < 6) {
    score -= 15;
    findings.push({ type: 'warn', message: `标题仅${titleLen}字过短`, suggestion: '补充标题信息' });
  } else {
    findings.push({ type: 'pass', message: `标题${titleLen}字合理`, suggestion: null });
  }

  // 标题关键词堆砌
  if (title) {
    const segments = title.split(/[-_|—·,\s]+/).filter(s => s.length > 0);
    const wordFreq = {};
    segments.forEach(s => {
      for (let i=2; i<=Math.min(s.length,6); i++) {
        for (let j=0; j<=s.length-i; j++) {
          const w = s.substring(j,j+i);
          if (/[\u4e00-\u9fa5]{2,}/.test(w)) wordFreq[w]=(wordFreq[w]||0)+1;
        }
      }
    });
    const stuffed = Object.entries(wordFreq).filter(([_,c])=>c>=3);
    if (stuffed.length > 0) {
      score -= 30;
      findings.push({ type: 'fail', message: `标题关键词堆砌："${stuffed.map(s=>s[0]).slice(0,3).join('、')}"重复出现，清风5.0打击关键词堆砌`, suggestion: '自然组织标题语言，语义理解已替代关键词匹配' });
    }
  }

  // ===== 5.0新增：全页面关键词作弊检测 =====
  if (bodyText.length > 100) {
    // 检测正文关键词密度异常 - 更严格的判定
    const bodyKeywords = {};
    const words = bodyText.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
    words.forEach(w => { bodyKeywords[w]=(bodyKeywords[w]||0)+1; });

    // 计算每个词的密度（次/千字）
    const textKb = bodyText.length / 1000;
    const overused = Object.entries(bodyKeywords)
      .filter(([w,c]) => {
        const density = c / textKb;
        // 关键词长度≥3，密度>5/千字 或 绝对次数>8
        return w.length >= 3 && (density > 5 || c > 8);
      })
      .sort((a,b) => b[1]-a[1])
      .slice(0,8);

    if (overused.length >= 3) {
      score -= 30;
      findings.push({
        type: 'fail',
        message: `正文关键词过度使用：${overused.slice(0,3).map(o=>`"${o[0]}"(${o[1]}次)`).join('、')}，清风5.0打击全页面关键词作弊`,
        suggestion: '2026年语义理解已替代关键词匹配，堆砌关键词不再有排名优势反而触发处罚',
      });
    } else if (overused.length >= 1 && overused[0][1] > 10) {
      score -= 15;
      findings.push({
        type: 'warn',
        message: `"${overused[0][0]}"出现${overused[0][1]}次偏多，疑似关键词堆砌`,
        suggestion: '降低关键词密度，用语义相关词自然表达',
      });
    }

    // ===== AI生硬堆砌检测：检测不自然的关键词分布 =====
    // AI内容常见模式：关键词在首段、尾段反复出现，中段几乎不出现
    if (bodyText.length > 800) {
      const thirdLen = Math.floor(bodyText.length / 3);
      const firstPart = bodyText.substring(0, thirdLen);
      const middlePart = bodyText.substring(thirdLen, thirdLen * 2);
      const lastPart = bodyText.substring(thirdLen * 2);

      const topKw = overused[0];
      if (topKw) {
        const kw = topKw[0];
        const firstCount = (firstPart.match(new RegExp(kw, 'g')) || []).length;
        const middleCount = (middlePart.match(new RegExp(kw, 'g')) || []).length;
        const lastCount = (lastPart.match(new RegExp(kw, 'g')) || []).length;
        const total = firstCount + middleCount + lastCount;

        // 如果关键词集中分布在首尾，中间稀少，疑似AI生硬堆砌
        if (total >= 6 && middleCount / total < 0.2) {
          score -= 18;
          findings.push({
            type: 'fail',
            message: `关键词"${kw}"分布异常（首段${firstCount}次/中段${middleCount}次/尾段${lastCount}次），AI生硬堆砌特征`,
            suggestion: '关键词应自然分布全文，不要在首尾集中堆砌',
          });
        }
      }
    }
  }

  // ===== 5.0新增：AI文不对题检测 =====
  if (title && bodyText) {
    const titleWords = new Set(title.match(/[\u4e00-\u9fa5]{2,}/g) || []);
    const bodyWords = (bodyText.substring(0, 500).match(/[\u4e00-\u9fa5]{2,}/g) || []);
    let overlap = 0;
    bodyWords.forEach(w => { if (titleWords.has(w)) overlap++; });
    const relevance = titleWords.size > 0 ? overlap / titleWords.size : 0;
    if (relevance < 0.15 && titleWords.size >= 2) {
      score -= 20;
      findings.push({ type: 'fail', message: '标题与正文语义相关性低，清风5.0打击AI生成文不对题引流页', suggestion: '确保标题与正文语义一致，ERNIE模型已可深度识别语义匹配' });
    } else if (relevance < 0.3 && titleWords.size >= 2) {
      score -= 10;
      findings.push({ type: 'warn', message: '标题与正文语义相关性偏低', suggestion: '增强标题与正文的内容关联性' });
    }
  }

  // 标题党检测
  const clickbaitWords = ['最','第一','唯一','顶级','震惊','惊呆','速看','马上删','免费领','100%','绝对','必看'];
  const hits = clickbaitWords.filter(w => title.includes(w));
  if (hits.length >= 2) {
    score -= 25;
    findings.push({ type: 'fail', message: `标题含夸大词汇：${hits.join('、')}`, suggestion: '使用客观准确标题' });
  }

  // ===== 5.0并入：正文穿插联系方式（原细雨算法） =====
  const contactPatterns = [/1[3-9]\d{9}/g, /QQ[：:]?\s*\d{5,12}/gi, /微信[：:]?\s*[\w-]{5,30}/gi];
  let contacts = 0;
  const mainContent = $('main, article, .content, .post-content, .entry-content, #content').text() || bodyText;
  contactPatterns.forEach(p => { const m=mainContent.match(p); if(m) contacts+=m.length; p.lastIndex=0; });
  if (contacts > 5) {
    score -= 25;
    findings.push({ type: 'fail', message: `正文穿插${contacts}处联系方式，清风5.0(合并细雨)打击正文穿插联系方式引流`, suggestion: '联系方式集中在页面底部联系区域，不在正文中穿插' });
  } else if (contacts > 2) {
    score -= 10;
    findings.push({ type: 'warn', message: `正文含${contacts}处联系方式`, suggestion: '减少正文联系方式穿插' });
  }

  // 虚假下载按钮
  const dlBtns = $('a, button').filter((_,el) => {
    const t = $(el).text().trim();
    const c = ($(el).attr('class')||'').toLowerCase();
    return (t.includes('下载')||t.includes('立即下载'))&&(c.includes('btn')||c.includes('button')||c.includes('download'));
  }).length;
  if (dlBtns > 3) {
    score -= 20;
    findings.push({ type: 'fail', message: `${dlBtns}个下载按钮，清风打击虚假下载诱导`, suggestion: '确保下载按钮指向真实资源' });
  }

  return {
    name: '清风算法',
    category: '标题与内容作弊',
    version: '5.0 (2026升级)',
    description: '打击标题党、关键词堆砌、虚假下载，5.0扩展至全页面关键词作弊+AI文不对题治理，并入原细雨算法正文穿插联系方式规则',
    status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail',
    score: Math.max(0, score),
    findings,
  };
}

// ======================== 3. 蓝天算法 3.0 ========================
function analyzeBlueSky($, baseUrl) {
  const findings = [];
  let score = 100;

  let externalLinks = 0, nofollowLinks = 0;
  const externalDomains = new Set();
  const anchorTexts = [];
  let baseDomain = '';
  try { baseDomain = new URL(baseUrl).hostname; } catch(e) {}

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')||'';
    const rel = ($(el).attr('rel')||'').toLowerCase();
    const anchor = $(el).text().trim().substring(0,30);
    if (href.startsWith('http://')||href.startsWith('https://')) {
      try {
        const d = new URL(href).hostname;
        if (d !== baseDomain) {
          externalLinks++;
          externalDomains.add(d);
          if (rel.includes('nofollow')) nofollowLinks++;
          if (anchor) anchorTexts.push(anchor);
        }
      } catch(e) {}
    }
  });

  // 外链数量
  if (externalLinks > 50) {
    score -= 30;
    findings.push({ type: 'fail', message: `外链${externalLinks}个过多，蓝天3.0判定为出售外链`, suggestion: '控制外链数量，对非必要外链添加rel="nofollow"' });
  } else if (externalLinks > 20) {
    score -= 15;
    findings.push({ type: 'warn', message: `外链${externalLinks}个偏多`, suggestion: '评估外链质量，添加nofollow' });
  }

  // ===== 3.0新增：锚文本同质化检测 =====
  if (anchorTexts.length >= 5) {
    const anchorFreq = {};
    anchorTexts.forEach(a => { anchorFreq[a]=(anchorFreq[a]||0)+1; });
    const homogeneous = Object.entries(anchorFreq).filter(([_,c])=>c>=3);
    if (homogeneous.length >= 2) {
      score -= 25;
      findings.push({ type: 'fail', message: `外链锚文本高度同质化："${homogeneous.map(h=>h[0]).join('、')}"重复出现，蓝天3.0直接判定作弊`, suggestion: '多样化锚文本，自然链接交换而非批量统一' });
    }
  }

  // ===== 3.0新增：低质友情链接批量交换检测 =====
  const friendLinkArea = $('[class*="friend"], [class*="partner"], [id*="friend"]').length;
  if (friendLinkArea > 0 && externalLinks > 15) {
    score -= 15;
    findings.push({ type: 'warn', message: '检测到友情链接区域且外链数量多，蓝天3.0打击批量交换低质友情链接', suggestion: '精简友情链接至5-10个高质量相关站点' });
  }

  // nofollow使用
  if (externalLinks > 5 && nofollowLinks/externalLinks < 0.2) {
    score -= 10;
    findings.push({ type: 'warn', message: `nofollow使用率${(nofollowLinks/externalLinks*100).toFixed(0)}%偏低`, suggestion: '对非信任外链添加nofollow' });
  }

  // 软文外链特征
  const bodyText = $('body').text()||'';
  const softPatterns = [/赞助商|sponsored|广告声明|advertis/gi, /推广|促销|限时优惠/gi, /咨询电话|订购热线|招商加盟/gi];
  let softScore = 0;
  softPatterns.forEach(p => { const m=bodyText.match(p); if(m) softScore+=m.length; p.lastIndex=0; });
  if (softScore > 8) {
    score -= 20;
    findings.push({ type: 'fail', message: `检测到大量软文推广特征(${softScore}处)，蓝天3.0对付费软文外链权重直接清零`, suggestion: '标注广告声明，软文外链将被清零权重，买卖双方同步降权' });
  }

  findings.push({ type: 'info', message: `外链${externalLinks}个(nofollow ${nofollowLinks}个)，指向${externalDomains.size}个域名`, suggestion: null });

  if (findings.filter(f=>f.type==='fail').length===0 && findings.filter(f=>f.type==='warn').length===0) {
    findings.unshift({ type: 'pass', message: '链接结构正常', suggestion: null });
  }

  return {
    name: '蓝天算法',
    category: '链接与排名作弊',
    version: '3.0 (2026升级)',
    description: '打击新闻源售卖软文，3.0升级外链质量评估体系，清洗劣质外链网络，锚文本同质化直接判作弊',
    status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail',
    score: Math.max(0, score),
    findings,
  };
}

// ======================== 4. 闪电算法 3.0 ========================
function analyzeLightning(fetchTime, pageSize, $) {
  const findings = [];
  let score = 100;

  // 首屏加载时间
  if (fetchTime < 1500) {
    findings.push({ type: 'pass', message: `响应${fetchTime}ms，首屏2秒内加载完成，获闪电算法排名流量倾斜`, suggestion: null });
  } else if (fetchTime < 3000) {
    score -= 30;
    findings.push({ type: 'warn', message: `响应${fetchTime}ms，接近3秒降权阈值`, suggestion: '启用CDN加速、压缩资源、减少HTTP请求' });
  } else {
    score -= 60;
    findings.push({ type: 'fail', message: `响应${fetchTime}ms超过3秒，闪电3.0将显著下调排名权重`, suggestion: '紧急优化加载速度：CDN+压缩+懒加载+减少阻塞脚本' });
  }

  // 页面体积
  const kb = (pageSize/1024).toFixed(1);
  if (pageSize > 1024*1024) {
    score -= 40;
    findings.push({ type: 'fail', message: `页面${kb}KB超过1MB`, suggestion: '必须大幅精简代码' });
  } else if (pageSize > 512*1024) {
    score -= 20;
    findings.push({ type: 'warn', message: `页面${kb}KB偏大`, suggestion: '压缩HTML/CSS/JS' });
  }

  // ===== 3.0新增：交互流畅度指标 =====
  const blockingScripts = $('script:not([async]):not([defer])').length;
  if (blockingScripts > 8) {
    score -= 15;
    findings.push({ type: 'fail', message: `${blockingScripts}个阻塞渲染的同步脚本，闪电3.0考核交互流畅度(点击响应延迟等)`, suggestion: '为非关键脚本添加async/defer，减少阻塞渲染' });
  } else if (blockingScripts > 4) {
    score -= 8;
    findings.push({ type: 'warn', message: `${blockingScripts}个同步脚本可能影响交互响应`, suggestion: '优化脚本加载策略' });
  }

  // CSS阻塞检测
  const blockingCSS = $('link[rel="stylesheet"]').length;
  if (blockingCSS > 6) {
    score -= 8;
    findings.push({ type: 'warn', message: `${blockingCSS}个外部CSS文件，可能阻塞渲染`, suggestion: '合并CSS文件，关键CSS内联' });
  }

  // 大图片检测(影响滑动流畅度)
  const largeImages = $('img').filter((_,el) => {
    const w = parseInt($(el).attr('width')||'0');
    return w > 1200;
  }).length;
  if (largeImages > 3) {
    score -= 8;
    findings.push({ type: 'warn', message: `${largeImages}张超大图片可能影响滑动流畅度`, suggestion: '压缩图片，使用懒加载，闪电3.0考核滑动卡顿率' });
  }

  return {
    name: '闪电算法',
    category: '用户体验',
    version: '3.0 (2026升级)',
    description: '移动端加载速度影响排名，3.0扩展至全链路交互流畅度考核：滑动卡顿率、点击响应延迟、资源加载阻塞等体验指标',
    status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail',
    score: Math.max(0, score),
    findings,
  };
}

// ======================== 5. 惊雷算法（持续迭代） ========================
function analyzeThunder($) {
  const findings = [];
  let score = 100;

  const scripts = $('script').toArray();
  let suspiciousCode = 0;
  scripts.forEach(script => {
    const code = $(script).html()||'';
    if (/\.click\(\)/.test(code) && /setInterval|setTimeout/.test(code)) suspiciousCode++;
    if (/autoRedirect|autoJump|clickRedirect/i.test(code)) suspiciousCode++;
    if (/document\.referrer/.test(code) && /replace|substr/i.test(code)) suspiciousCode++;
  });

  if (suspiciousCode > 2) {
    score -= 40;
    findings.push({ type: 'fail', message: `${suspiciousCode}处可疑自动点击/跳转代码，惊雷算法(2026升级)引入用户行为序列校验，识别精度大幅提升`, suggestion: '移除所有模拟点击/跳转代码，异常刷量触发反向降权' });
  } else if (suspiciousCode > 0) {
    score -= 15;
    findings.push({ type: 'warn', message: `${suspiciousCode}处可疑脚本需核实`, suggestion: '检查是否涉及模拟用户行为' });
  }

  // 快排特征
  const bodyHtml = $.html().toLowerCase();
  const kpSigns = ['kp.', 'quickrank', '快排', '刷排名', '提升排名', '刷点击'];
  const kpHits = kpSigns.filter(s => bodyHtml.includes(s));
  if (kpHits.length > 0) {
    score -= 30;
    findings.push({ type: 'fail', message: `快排工具特征：${kpHits.join('、')}`, suggestion: '立即移除，2026年惊雷算法对AI模拟点击、机器刷量识别准确率大幅提升，传统快排基本失效' });
  }

  if (findings.length === 0) {
    findings.push({ type: 'pass', message: '未检测到刷点击/快排作弊代码', suggestion: null });
  }

  return {
    name: '惊雷算法',
    category: '链接与排名作弊',
    version: '持续迭代 (2026升级)',
    description: '打击刷点击、快排作弊，2026升级引入用户行为序列校验，对AI模拟点击、机器刷量的识别准确率大幅提升，传统快排基本失效',
    status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail',
    score: Math.max(0, score),
    findings,
  };
}

// ======================== 6. 烽火算法 3.0 ========================
function analyzeBeacon(originalUrl, finalUrl, headers, $, body) {
  const findings = [];
  let score = 100;

  // HTTPS
  if (originalUrl.startsWith('https://')) {
    findings.push({ type: 'pass', message: '已启用HTTPS', suggestion: null });
  } else {
    score -= 30;
    findings.push({ type: 'fail', message: '未启用HTTPS，烽火3.0重点关注用户安全', suggestion: '部署SSL证书全站HTTPS' });
  }

  // 跨域跳转劫持
  try {
    const orig = new URL(originalUrl).hostname;
    const fin = new URL(finalUrl).hostname;
    if (orig !== fin) {
      score -= 50;
      findings.push({ type: 'fail', message: `跨域跳转${orig}→${fin}，存在劫持风险`, suggestion: '排查恶意劫持' });
    }
  } catch(e) {}

  // Meta Refresh
  const mr = $('meta[http-equiv="refresh"]').attr('content')||'';
  if (mr) {
    const m = mr.match(/url=(.+)/i);
    if (m) {
      score -= 40;
      findings.push({ type: 'fail', message: `Meta Refresh跳转: ${m[1].trim()}`, suggestion: '使用301重定向代替' });
    }
  }

  // JS劫持
  const jsPatterns = [/location\.href\s*=\s*["']https?:\/\//gi, /window\.location\.replace\s*\(/gi, /document\.location\s*=\s*["']/gi];
  let hijackCount = 0;
  $('script').each((_,el) => {
    const code = $(el).html()||'';
    jsPatterns.forEach(p => {
      if (p.test(code)) { hijackCount++; p.lastIndex=0; }
    });
  });
  if (hijackCount > 3) {
    score -= 30;
    findings.push({ type: 'fail', message: `${hijackCount}处JS跳转代码，存在劫持风险`, suggestion: '检查JS跳转用途' });
  } else if (hijackCount > 0) {
    score -= 10;
    findings.push({ type: 'warn', message: `${hijackCount}处JS跳转代码`, suggestion: '确认跳转合法' });
  }

  // 隐私窃取
  const privacyP = [/phone\s*=\s*["']?\d/gi, /getPhoneNumber/gi, /deviceId/gi];
  let privacyRisk = 0;
  const lowHtml = body.toLowerCase();
  privacyP.forEach(p => { if(p.test(lowHtml)) privacyRisk++; p.lastIndex=0; });
  if (privacyRisk > 1) {
    score -= 20;
    findings.push({ type: 'warn', message: `检测到隐私数据获取代码(${privacyRisk}处)，烽火2.0打击窃取用户隐私`, suggestion: '确保合规收集用户数据，添加隐私政策' });
  }

  if (findings.filter(f=>f.type==='fail').length===0) {
    findings.push({ type: 'pass', message: '无恶意跳转或劫持行为', suggestion: null });
  }

  return {
    name: '烽火算法',
    category: '安全与隐私',
    version: '1.0/2.0/3.0 (2017-2019)',
    description: '打击移动搜索页面劫持、窃取用户隐私、恶意跳转等危害用户安全的行为，违规后果：永久限制展现/整站清退',
    status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail',
    score: Math.max(0, score),
    findings,
  };
}

// ======================== 7. 石榴算法 ========================
function analyzePomegranate($) {
  const findings = [];
  let score = 100;

  // 弹窗检测
  let popupCount = 0;
  $('script').each((_,el) => {
    const code = $(el).html()||'';
    if (code.includes('window.open')||code.includes('showModalDialog')) popupCount++;
  });
  if (popupCount > 2) {
    score -= 25;
    findings.push({ type: 'fail', message: `${popupCount}处弹窗代码，石榴算法打击强制弹窗广告`, suggestion: '移除弹窗广告' });
  }

  // 广告/浮层元素
  const adElements = $('div[class*="ad"], div[class*="banner"], div[class*="popup"], div[class*="float"], div[id*="ad"], div[id*="banner"], div[id*="popup"]').length;
  if (adElements > 5) {
    score -= 20;
    findings.push({ type: 'fail', message: `${adElements}个广告/浮层元素可能遮挡正文`, suggestion: '减少广告确保不遮挡正文' });
  } else if (adElements > 2) {
    score -= 10;
    findings.push({ type: 'warn', message: `${adElements}个广告元素`, suggestion: '控制广告密度' });
  }

  // 广告位占位
  const adSlots = $('ins, [class*="adsense"], [class*="advertisement"], [data-ad]').length;
  if (adSlots > 3) {
    score -= 15;
    findings.push({ type: 'warn', message: `${adSlots}个广告位`, suggestion: '首屏广告面积不超过20%' });
  }

  if (findings.length === 0) {
    findings.push({ type: 'pass', message: '无恶意广告干扰', suggestion: null });
  }

  return {
    name: '石榴算法',
    category: '用户体验',
    version: '2013年5月',
    description: '打击页面恶劣广告干扰，强制弹窗、遮挡正文浮层广告、低俗悬浮广告',
    status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail',
    score: Math.max(0, score),
    findings,
  };
}

// ======================== 8. 冰桶算法 5.0 ========================
function analyzeIceBucket($) {
  const findings = [];
  let score = 100;

  // viewport
  const viewport = $('meta[name="viewport"]').attr('content')||'';
  if (viewport && viewport.includes('width=device-width')) {
    findings.push({ type: 'pass', message: 'viewport正确配置', suggestion: null });
  } else if (viewport) {
    score -= 15;
    findings.push({ type: 'warn', message: `viewport不规范: ${viewport}`, suggestion: '使用width=device-width, initial-scale=1.0' });
  } else {
    score -= 40;
    findings.push({ type: 'fail', message: '缺少viewport标签', suggestion: '添加viewport meta' });
  }

  // APP调起检测
  const appSchemes = $('a[href^="weixin://"], a[href^="alipays://"], a[href^="taobao://"], a[href^="intent://"], a[href^="tbopen://"]').length;
  if (appSchemes > 0) {
    score -= 35;
    findings.push({ type: 'fail', message: `${appSchemes}处APP调起代码，冰桶5.0严厉打击强制调起APP`, suggestion: '移除强制APP调起，提供网页内完整服务' });
  }

  // 固定宽度元素
  const fixedWide = $('[style*="width:"]').toArray().filter(el => {
    const s = $(el).attr('style')||'';
    const m = s.match(/width:\s*(\d+)px/i);
    return m && parseInt(m[1]) > 800;
  }).length;
  if (fixedWide > 3) {
    score -= 15;
    findings.push({ type: 'warn', message: `${fixedWide}个固定宽度(>800px)元素影响移动端`, suggestion: '使用响应式布局' });
  }

  if (findings.filter(f=>f.type==='fail').length===0 && findings.filter(f=>f.type==='pass').length>0 && findings.filter(f=>f.type==='warn').length===0) {
    findings.push({ type: 'pass', message: '移动端体验良好', suggestion: null });
  }

  return {
    name: '冰桶算法',
    category: '用户体验',
    version: '1.0-5.0 (2014-2020)',
    description: '聚焦移动端体验，5.0重点打击强制调起APP、诱导跳转APP等打断浏览行为',
    status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail',
    score: Math.max(0, score),
    findings,
  };
}

// ======================== 9. 劲风算法 ========================
function analyzeGale($) {
  const findings = [];
  let score = 100;

  const title = ($('title').text()||'').trim().toLowerCase();
  const bodyText = $('body').text()||'';

  const aggSignals = {
    tagPage: /tag|标签|tags/i.test(title) || $('[class*="tag-list"], [class*="tag-cloud"]').length>0,
    searchPage: /搜索结果|search\s*result/i.test(title),
    listingPage: $('article, .post-item, .list-item, .news-item').length>10,
  };
  const isAgg = Object.values(aggSignals).filter(Boolean).length >= 2;

  if (isAgg) {
    const items = $('article, .post-item, .list-item, .news-item, .card');
    let empty = 0;
    items.each((_,el) => { if ($(el).text().trim().length<30) empty++; });
    if (items.length>0 && empty/items.length>0.7) {
      score -= 35;
      findings.push({ type: 'fail', message: `聚合页${items.length}条目中${empty}个空洞(<30字)`, suggestion: '为聚合条目添加实质性描述' });
    } else if (items.length>0 && empty/items.length>0.4) {
      score -= 15;
      findings.push({ type: 'warn', message: '聚合页部分条目内容空洞', suggestion: '丰富聚合摘要' });
    }
    const linkTextRatio = $('a').text().replace(/\s+/g,' ').trim().length / (bodyText.replace(/\s+/g,' ').trim().length||1);
    if (linkTextRatio > 0.8) {
      score -= 25;
      findings.push({ type: 'fail', message: '页面以链接为主缺乏实质文本', suggestion: '增加原创介绍性内容' });
    }
  }

  if (findings.length===0) {
    findings.push({ type: 'pass', message: '无恶意聚合页特征', suggestion: null });
  }

  return {
    name: '劲风算法',
    category: '内容质量',
    version: '2020年2月',
    description: '打击恶意构造聚合页面，批量生成无实质价值的标签页、搜索结果页、分类聚合页',
    status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail',
    score: Math.max(0, score),
    findings,
  };
}

// ======================== 10. 绿萝算法 ========================
function analyzeGreenVine($, baseUrl) {
  const findings = [];
  let score = 100;

  let internalLinks = 0, externalLinks = 0, nofollowLinks = 0;
  let baseDomain = '';
  try { baseDomain = new URL(baseUrl).hostname; } catch(e) {}

  $('a[href]').each((_,el) => {
    const href = $(el).attr('href')||'';
    const rel = ($(el).attr('rel')||'').toLowerCase();
    if (href.startsWith('http://')||href.startsWith('https://')) {
      try {
        if (new URL(href).hostname !== baseDomain) {
          externalLinks++;
          if (rel.includes('nofollow')) nofollowLinks++;
        } else { internalLinks++; }
      } catch(e) {}
    } else if (href.startsWith('/')||href.startsWith('./')) {
      internalLinks++;
    }
  });

  if (externalLinks > 50) {
    score -= 30;
    findings.push({ type: 'fail', message: `外链${externalLinks}个过多`, suggestion: '控制外链添加nofollow' });
  } else if (externalLinks > 20) {
    score -= 15;
    findings.push({ type: 'warn', message: `外链${externalLinks}个偏多`, suggestion: '评估外链质量' });
  }

  findings.push({ type: 'info', message: `内链${internalLinks} 外链${externalLinks}(nofollow ${nofollowLinks})`, suggestion: null });

  if (findings.filter(f=>f.type==='fail').length===0) {
    findings.unshift({ type: 'pass', message: '链接结构正常', suggestion: null });
  }

  return {
    name: '绿萝算法',
    category: '链接与排名作弊',
    version: '1.0/2.0 (2013)',
    description: '打击外链买卖交易、软文外链，过滤无效外链权重',
    status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail',
    score: Math.max(0, score),
    findings,
  };
}

// ======================== 11. 技术SEO基础 ========================
function analyzeTechnicalSEO($, headers) {
  const findings = [];
  let score = 100;

  const desc = $('meta[name="description"]').attr('content')||'';
  if (!desc) {
    score -= 15;
    findings.push({ type: 'warn', message: '缺少meta description', suggestion: '添加60-120字描述' });
  } else if (desc.length < 30) {
    score -= 8;
    findings.push({ type: 'warn', message: `描述仅${desc.length}字过短`, suggestion: '补充描述' });
  } else {
    findings.push({ type: 'pass', message: `描述${desc.length}字`, suggestion: null });
  }

  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical) {
    score -= 5;
    findings.push({ type: 'info', message: '缺少canonical', suggestion: '添加canonical避免重复内容' });
  }

  const jsonLd = $('script[type="application/ld+json"]').length;
  if (jsonLd > 0) {
    findings.push({ type: 'pass', message: `${jsonLd}个结构化数据(JSON-LD)`, suggestion: null });
  } else {
    score -= 8;
    findings.push({ type: 'warn', message: '缺少结构化数据', suggestion: '添加Schema.org结构化数据提升展现' });
  }

  const imgs = $('img');
  const imgTotal = imgs.length;
  let noAlt = 0;
  imgs.each((_,el) => { if (!$(el).attr('alt')) noAlt++; });
  if (imgTotal > 0 && noAlt/imgTotal > 0.5) {
    score -= 10;
    findings.push({ type: 'warn', message: `${noAlt}/${imgTotal}图片缺alt`, suggestion: '添加alt属性' });
  }

  const h1 = $('h1').length;
  if (h1 === 0) {
    score -= 10;
    findings.push({ type: 'warn', message: '缺少H1', suggestion: '每页应有1个H1' });
  } else if (h1 > 1) {
    score -= 5;
    findings.push({ type: 'info', message: `${h1}个H1建议仅1个`, suggestion: null });
  }

  const robots = $('meta[name="robots"]').attr('content')||'';
  if (robots.includes('noindex')) {
    score -= 50;
    findings.push({ type: 'fail', message: '设置了noindex不予收录', suggestion: '移除noindex指令' });
  }

  return {
    name: '技术SEO基础',
    category: '技术优化',
    version: '通用规范',
    description: '页面基础SEO元素检测：TDK、结构化数据、图片alt、H标签、canonical等',
    status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail',
    score: Math.max(0, score),
    findings,
  };
}

// ======================== 12. EEAT权威性评估 ========================
function analyzeEEAT($, body, metrics) {
  const findings = [];
  // 降低基础分，让真实信号才能拉高评分（2026硬性门槛）
  let scores = { experience: 30, expertise: 30, authority: 25, trustworthiness: 35 };

  $('script, style, noscript').remove();
  const text = $('body').text().replace(/\s+/g,' ').trim();

  // Experience - 真实经验信号（最严格的维度，AI内容最易缺失）
  // 基础：内容长度只给少量加分，必须有真实经验才能高分
  if (text.length > 800) scores.experience += 5;
  if (text.length > 2000) scores.experience += 5;

  // 真实经验词（扩大词库，更严格判定）
  const expWords = ['实测', '亲测', '我使用', '我们', '笔者', '本人', '实践中', '经验分享', '踩坑', '案例', '实战', '实操', '上周', '昨天', '那次', '这次', '我发现', '我们认为', '我们的', '错误', '失败', '问题', '报错'];
  let expHits = 0;
  expWords.forEach(w => { if (text.includes(w)) expHits++; });
  if (expHits >= 5) scores.experience += 35;
  else if (expHits >= 3) scores.experience += 22;
  else if (expHits >= 1) scores.experience += 8;
  else {
    // 没有任何真实经验信号 - 严重扣分
    findings.push({
      type: 'fail',
      message: '经验(E)维度：未检测到任何真实经验信号（我/我们/实测/案例/踩坑等），EEAT经验维度不达标',
      suggestion: '2026年EEAT是硬性门槛，必须加入第一人称叙述、真实案例、实操经验',
    });
  }

  // 检测具体数据/数字（真实经验的强信号）
  const dataPoints = (text.match(/\d+%|\d+万|\d+亿|\d+元|\d+次|\d+小时|\d+分钟|\d{4}年/g) || []).length;
  if (dataPoints >= 5) scores.experience += 15;
  else if (dataPoints >= 2) scores.experience += 8;

  // Expertise - 专业度信号
  if (metrics.structuredData > 0) scores.expertise += 12;
  if (metrics.metaDescription) scores.expertise += 8;
  if (metrics.h1Count === 1) scores.expertise += 8;
  if (text.length > 1500) scores.expertise += 8;
  // 专业术语密度（扩大词库）
  const proWords = ['分析', '评估', '原理', '机制', '架构', '策略', '方法论', '规范', '标准', '指标', '算法', '模型', '框架', '协议', '接口', '部署', '配置', '优化', '测试', '监控', '诊断', '迭代', '架构设计', '技术选型'];
  let proHits = 0;
  proWords.forEach(w => { if (text.includes(w)) proHits++; });
  if (proHits >= 8) scores.expertise += 20;
  else if (proHits >= 4) scores.expertise += 12;
  else if (proHits < 2 && text.length > 800) {
    findings.push({
      type: 'warn',
      message: '专业度(E)维度：专业术语密度低，内容专业深度不足',
      suggestion: '增加专业术语和技术细节，体现专业度',
    });
  }

  // Authority - 权威性信号
  if (metrics.httpsEnabled) scores.authority += 12;
  if (metrics.canonical) scores.authority += 10;
  // 检测引用来源（扩大模式）
  const citePatterns = [/根据.*研究/gi, /参考文献/gi, /来源：/gi, /引用/gi, /数据显示/gi, /报告指出/gi, /官方文档/gi, /.*等.*认为/gi];
  let citeHits = 0;
  citePatterns.forEach(p => { if(p.test(text)) citeHits++; p.lastIndex=0; });
  if (citeHits >= 3) scores.authority += 20;
  else if (citeHits >= 1) scores.authority += 10;
  else if (text.length > 1000) {
    findings.push({
      type: 'warn',
      message: '权威性(A)维度：未检测到任何权威引用或数据来源',
      suggestion: '引用权威研究、官方文档、数据报告提升权威性',
    });
  }
  // 作者信息
  const authorEls = $('[class*="author"], [rel="author"], [itemprop="author"]').length;
  if (authorEls > 0) scores.authority += 15;
  // 资质认证信号
  if (text.includes('认证') || text.includes('资质') || text.includes('执业') || text.includes('ICP')) {
    scores.authority += 8;
  }

  // Trustworthiness - 可信度信号
  if (metrics.httpsEnabled) scores.trustworthiness += 12;
  if (metrics.httpStatus === 200) scores.trustworthiness += 8;
  // 检测隐私政策/免责声明
  if (text.includes('隐私政策') || text.includes('免责声明')) scores.trustworthiness += 12;
  // 检测联系方式(正面信号)
  if ($('[class*="contact"], [class*="about-us"], [class*="footer"]').length > 0) scores.trustworthiness += 8;
  // 检测备案信息
  if (text.includes('ICP备') || text.includes('公安备')) scores.trustworthiness += 10;
  // 检测更新时间（可信度信号）
  if (text.match(/\d{4}[-年]\d{1,2}[-月]\d{1,2}/) || text.includes('更新于') || text.includes('最后更新')) {
    scores.trustworthiness += 8;
  }

  // 限制范围
  Object.keys(scores).forEach(k => { scores[k] = Math.min(95, Math.max(5, scores[k])); });

  const overall = Math.round(Object.values(scores).reduce((a,b)=>a+b,0)/4);

  if (overall < 45) {
    findings.push({
      type: 'fail',
      message: `EEAT综合评分${overall}分（低），2026年百度将EEAT纳入硬性排名门槛，专业领域低EEAT内容直接降权`,
      suggestion: '全面补充：作者身份、专业背书、权威引用、真实经验、隐私政策、联系方式、备案信息',
    });
  } else if (overall < 65) {
    findings.push({
      type: 'warn',
      message: `EEAT综合评分${overall}分（一般），距离硬性门槛有差距`,
      suggestion: '重点增强经验维度（真实案例）和权威维度（引用来源）',
    });
  } else {
    findings.push({ type: 'pass', message: `EEAT综合评分${overall}分良好`, suggestion: null });
  }

  // 详细维度反馈
  if (scores.experience < 50) {
    findings.push({
      type: 'fail',
      message: `经验(E)评分${scores.experience}偏低，缺少真实实践经验表达`,
      suggestion: '加入实测体验、案例分享、个人经验等真实经验内容',
    });
  }
  if (scores.authority < 45) {
    findings.push({
      type: 'warn',
      message: `权威性(A)评分${scores.authority}偏低，缺少权威背书`,
      suggestion: '添加作者身份信息、引用权威来源、标注专业资质',
    });
  }

  return {
    name: 'EEAT权威性评估',
    category: '2026底层排序',
    version: '2026新增',
    description: '百度已将EEAT(经验/专业度/权威性/可信度)纳入正式评分体系，专业领域低EEAT内容直接降权',
    status: overall >= 70 ? 'pass' : overall >= 50 ? 'warn' : 'fail',
    score: overall,
    findings,
    eeatDetails: scores,
  };
}

// ======================== 13. 语义理解评估 ========================
function analyzeSemantic($, body) {
  const findings = [];
  let score = 100;

  $('script, style, noscript').remove();
  const text = $('body').text().replace(/\s+/g,' ').trim();
  const title = ($('title').text()||'').trim();
  const metaDesc = ($('meta[name="description"]').attr('content')||'').trim();

  // ========== 1. 关键词多样性检测 ==========
  if (text.length > 200) {
    const allWords = text.match(/[\u4e00-\u9fa5]{2,6}/g)||[];
    const uniqueWords = new Set(allWords);
    const diversity = allWords.length > 0 ? uniqueWords.size / allWords.length : 0;
    if (diversity < 0.3 && allWords.length > 50) {
      score -= 30;
      findings.push({
        type: 'fail',
        message: `词汇多样性仅${(diversity*100).toFixed(0)}%，语义同质化严重，ERNIE模型已全面替代关键词匹配`,
        suggestion: '2026年百度用ERNIE深度语义模型排名，内容是否完整准确解决用户需求是第一优先级',
      });
    } else if (diversity < 0.4 && allWords.length > 50) {
      score -= 15;
      findings.push({
        type: 'warn',
        message: `词汇多样性${(diversity*100).toFixed(0)}%偏低`,
        suggestion: '丰富词汇表达，用语义相关词自然替代重复词汇',
      });
    } else if (diversity < 0.5 && allWords.length > 100) {
      score -= 8;
      findings.push({
        type: 'warn',
        message: `词汇多样性${(diversity*100).toFixed(0)}%一般`,
        suggestion: '可进一步丰富词汇表达',
      });
    } else {
      findings.push({ type: 'pass', message: `词汇多样性${(diversity*100).toFixed(0)}%良好`, suggestion: null });
    }
  }

  // ========== 2. 内容完整性检测 - 标题与正文语义匹配 ==========
  if (title && text.length > 200) {
    const titleKeywords = (title.match(/[\u4e00-\u9fa5]{2,}/g)||[]);
    let coveredTopics = 0;
    titleKeywords.forEach(kw => {
      if (text.includes(kw)) coveredTopics++;
    });
    const relevance = titleKeywords.length > 0 ? coveredTopics / titleKeywords.length : 1;
    if (relevance < 0.3 && titleKeywords.length >= 2) {
      score -= 30;
      findings.push({
        type: 'fail',
        message: `标题与正文语义相关性仅${(relevance*100).toFixed(0)}%，AI文不对题特征明显`,
        suggestion: '确保标题承诺的内容在正文开头就有明确解答，ERNIE可深度识别语义匹配',
      });
    } else if (relevance < 0.5 && titleKeywords.length >= 2) {
      score -= 15;
      findings.push({
        type: 'warn',
        message: `标题与正文语义相关性${(relevance*100).toFixed(0)}%偏低`,
        suggestion: '增强标题与正文的内容关联性',
      });
    }

    // 检测标题承诺但正文未解答的关键词
    const unanswered = titleKeywords.filter(kw => !text.includes(kw));
    if (unanswered.length >= 2) {
      score -= 12;
      findings.push({
        type: 'warn',
        message: `标题中"${unanswered.slice(0,3).join('、')}"在正文未充分展开`,
        suggestion: '正文必须完整解答标题涉及的所有主题',
      });
    }
  }

  // ========== 3. 内容深度指标 - 句长分析 ==========
  const sentences = text.split(/[。！？.!?]/).filter(s=>s.trim().length>10);
  if (sentences.length > 0) {
    const avgSentLen = sentences.reduce((a,s)=>a+s.length,0) / sentences.length;
    if (avgSentLen < 20 && text.length > 200) {
      score -= 15;
      findings.push({
        type: 'warn',
        message: `平均句长${avgSentLen.toFixed(0)}字，内容碎片化`,
        suggestion: '每个段落提供完整信息，避免碎片化短句堆砌',
      });
    } else if (avgSentLen > 80) {
      score -= 10;
      findings.push({
        type: 'warn',
        message: `平均句长${avgSentLen.toFixed(0)}字过长，阅读困难`,
        suggestion: '适当断句，提升可读性',
      });
    }
  }

  // ========== 4. 信息密度检测 - 实质内容占比 ==========
  if (text.length > 500) {
    // 检测空洞内容：去除常见AI废话后的实质内容比例
    const fluffPatterns = [
      /随着[^，。]{2,10}的[^，。]{1,8}[，。]/g,
      /在当今[^，。]{2,8}[，。]/g,
      /众所周知[，。]/g,
      /总而言之[^。]*。/g,
      /综上所述[^。]*。/g,
      /值得注意的是[^。]*。/g,
      /需要指出的是[^。]*。/g,
      /不可[^，。]{0,3}的是[，。]/g,
    ];
    let fluffLen = 0;
    fluffPatterns.forEach(p => {
      const matches = text.match(p) || [];
      matches.forEach(m => fluffLen += m.length);
    });
    const fluffRatio = fluffLen / text.length;
    if (fluffRatio > 0.2) {
      score -= 25;
      findings.push({
        type: 'fail',
        message: `AI废话占比${(fluffRatio*100).toFixed(0)}%（套话/过渡句），信息密度低`,
        suggestion: '删除所有"随着...的发展"、"众所周知"、"总而言之"等废话，每句必须提供实质信息',
      });
    } else if (fluffRatio > 0.1) {
      score -= 12;
      findings.push({
        type: 'warn',
        message: `AI废话占比${(fluffRatio*100).toFixed(0)}%偏高`,
        suggestion: '压缩套话和过渡句',
      });
    }
  }

  // ========== 5. 内容独特性检测 - 是否有独特观点/数据/案例 ==========
  if (text.length > 800) {
    const uniqueElements = [
      // 独特观点表达
      /我认为|笔者认为|在我看来|个人认为|我的观点/g,
      // 具体数据
      /\d+%/g, /\d+万/g, /\d+亿/g,
      // 对比分析
      /相比|不同于|区别于|vs|VS/g,
      // 案例引用
      /案例|实例|例如|比如|举例/g,
      // 风险提醒
      /注意|提醒|警告|风险|陷阱|误区/g,
    ];
    let uniqueHits = 0;
    uniqueElements.forEach(p => {
      const m = text.match(p);
      if (m) uniqueHits += m.length;
    });
    if (uniqueHits < 3) {
      score -= 18;
      findings.push({
        type: 'fail',
        message: `独特内容元素仅${uniqueHits}处（观点/数据/案例/对比/提醒），内容中性描述过多`,
        suggestion: '加入独特观点、具体数据、案例对比、风险提醒等提升内容独特性',
      });
    } else if (uniqueHits < 6) {
      score -= 8;
      findings.push({
        type: 'warn',
        message: `独特内容元素${uniqueHits}处偏少`,
        suggestion: '增加独特观点和数据支撑',
      });
    }
  }

  // ========== 6. 结构化语义检测 ==========
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  const listCount = $('ul, ol').length;
  if (text.length > 1000 && h2Count === 0 && h3Count === 0) {
    score -= 12;
    findings.push({
      type: 'warn',
      message: '长文本缺少H2/H3小标题，结构化程度低',
      suggestion: '使用H2/H3划分内容结构，帮助ERNIE模型理解内容层次',
    });
  }
  if (text.length > 1500 && listCount === 0) {
    score -= 5;
    findings.push({
      type: 'info',
      message: '长文本未使用列表，可考虑用列表组织要点',
      suggestion: '使用ul/ol列表提升信息结构化',
    });
  }

  if (findings.length === 0) {
    findings.push({ type: 'pass', message: '语义理解维度良好', suggestion: null });
  }

  return {
    name: '语义理解评估',
    category: '2026底层排序',
    version: 'ERNIE模型(2026)',
    description: '2026年百度全面应用ERNIE深度语义模型，排名从关键词匹配转向用户意图识别+实体关系匹配，内容完整解决用户需求是第一优先级',
    status: score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail',
    score: Math.max(0, score),
    findings,
  };
}

// ======================== 综合评分计算 ========================

function calculateOverallScore(algorithms) {
  const weights = {
    '飓风算法': 0.14,
    '清风算法': 0.12,
    '蓝天算法': 0.08,
    '闪电算法': 0.10,
    '惊雷算法': 0.07,
    '烽火算法': 0.08,
    '石榴算法': 0.06,
    '冰桶算法': 0.08,
    '劲风算法': 0.04,
    '绿萝算法': 0.04,
    '技术SEO基础': 0.03,
    'EEAT权威性评估': 0.12,
    '语义理解评估': 0.08,
  };

  let totalScore = 0;
  let totalWeight = 0;
  algorithms.forEach(algo => {
    const w = weights[algo.name] || 0.05;
    totalScore += algo.score * w;
    totalWeight += w;
  });

  let overall = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

  // ===== 关键算法一票否决机制 =====
  // 2026年百度算法核心：AI低质内容和EEAT是硬性门槛
  const hurricane = algorithms.find(a => a.name === '飓风算法');
  const eeat = algorithms.find(a => a.name === 'EEAT权威性评估');
  const semantic = algorithms.find(a => a.name === '语义理解评估');
  const breeze = algorithms.find(a => a.name === '清风算法');

  // 飓风算法严重失败（AI内容）- 总分上限
  if (hurricane) {
    if (hurricane.score < 25) overall = Math.min(overall, 45);
    else if (hurricane.score < 40) overall = Math.min(overall, 55);
    else if (hurricane.score < 55) overall = Math.min(overall, 68);

    // AI概率极高，额外限制
    if (hurricane.aiDetails) {
      if (hurricane.aiDetails.aiLevel === 'high') overall = Math.min(overall, 50);
      else if (hurricane.aiDetails.aiLevel === 'medium') overall = Math.min(overall, 65);
    }
  }

  // EEAT严重失败 - 2026硬性门槛
  if (eeat) {
    if (eeat.score < 35) overall = Math.min(overall, 55);
    else if (eeat.score < 45) overall = Math.min(overall, 65);
    else if (eeat.score < 55) overall = Math.min(overall, 72);
  }

  // 语义理解失败
  if (semantic && semantic.score < 45) {
    overall = Math.min(overall, 60);
  }

  // 清风算法失败（AI文不对题/关键词堆砌）
  if (breeze && breeze.score < 45) {
    overall = Math.min(overall, 60);
  }

  // 多个核心算法同时失败 - 叠加限制
  const coreFailCount = [hurricane, eeat, semantic, breeze].filter(a => a && a.score < 50).length;
  if (coreFailCount >= 3) overall = Math.min(overall, 40);
  else if (coreFailCount >= 2) overall = Math.min(overall, 55);

  return overall;
}

function calculateInclusionProbability(overallScore, algorithms) {
  let probability;
  if (overallScore >= 90) probability = 85 + (overallScore-90)*1.3;
  else if (overallScore >= 80) probability = 65 + (overallScore-80)*2.0;
  else if (overallScore >= 70) probability = 47 + (overallScore-70)*1.8;
  else if (overallScore >= 60) probability = 30 + (overallScore-60)*1.7;
  else if (overallScore >= 50) probability = 17 + (overallScore-50)*1.3;
  else if (overallScore >= 40) probability = 6 + (overallScore-40)*1.1;
  else probability = Math.max(0, overallScore * 0.15);

  // 严重违规惩罚
  ['烽火算法','惊雷算法'].forEach(name => {
    const algo = algorithms.find(a => a.name === name);
    if (algo && algo.status === 'fail') probability *= 0.3;
  });

  // 飓风算法低分 - AI内容严重惩罚
  const hurricane = algorithms.find(a => a.name === '飓风算法');
  if (hurricane) {
    if (hurricane.score < 30) probability *= 0.2; // 严重AI低质内容
    else if (hurricane.score < 50) probability *= 0.4;
    else if (hurricane.score < 65) probability *= 0.7;

    // AI概率高，额外惩罚
    if (hurricane.aiDetails && hurricane.aiDetails.aiLevel === 'high') {
      probability *= 0.3;
    } else if (hurricane.aiDetails && hurricane.aiDetails.aiLevel === 'medium') {
      probability *= 0.6;
    }
  }

  // EEAT门槛惩罚 - 2026硬性门槛
  const eeat = algorithms.find(a => a.name === 'EEAT权威性评估');
  if (eeat) {
    if (eeat.score < 35) probability *= 0.3;
    else if (eeat.score < 50) probability *= 0.6;
  }

  // 语义理解低分惩罚
  const semantic = algorithms.find(a => a.name === '语义理解评估');
  if (semantic && semantic.score < 40) probability *= 0.5;

  // 多维度同时低分 - 叠加惩罚
  const lowScoreCount = algorithms.filter(a => a.score < 50).length;
  if (lowScoreCount >= 4) probability *= 0.4;
  else if (lowScoreCount >= 3) probability *= 0.7;

  return Math.round(Math.min(98, Math.max(0, probability)));
}

function getPreferenceLevel(score) {
  if (score >= 88) return { level: '优秀', color: '#52c41a', desc: '百度高度喜好，收录概率极高，排名优势明显' };
  if (score >= 75) return { level: '良好', color: '#1890ff', desc: '百度较喜好，收录概率较高，有一定排名优势' };
  if (score >= 60) return { level: '一般', color: '#faad14', desc: '百度偏好一般，收录需沙盒期考核，排名竞争力弱' };
  if (score >= 45) return { level: '较差', color: '#fa8c16', desc: '百度偏好低，收录困难，可能进入长沙盒期' };
  return { level: '很差', color: '#f5222d', desc: '百度不喜好，大概率不予收录或快速移出索引' };
}

// ======================== 蜘蛛视角提取 ========================

function extractSpiderView($) {
  const title = ($('title').text()||'').trim();
  const description = ($('meta[name="description"]').attr('content')||'').trim();
  const keywords = ($('meta[name="keywords"]').attr('content')||'').trim();

  const headings = [];
  $('h1, h2, h3').each((_,el) => { headings.push({ level: el.tagName, text: $(el).text().trim().substring(0,100) }); });

  const links = [];
  $('a[href]').each((_,el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim().substring(0,50);
    if (href && text) links.push({ href, text });
  });

  $('script, style, noscript').remove();
  const textContent = $('body').text().replace(/\s+/g,' ').trim().substring(0,2000);

  return { title, description, keywords, headings: headings.slice(0,20), links: links.slice(0,30), textContent };
}

// ======================== robots.txt检测 ========================

/**
 * 解析 robots.txt 内容，判断百度蜘蛛是否被禁止抓取全站
 * 正确逻辑：需要找到适用于 Baiduspider 或 * 的规则段，
 * 在该段内检查是否存在 Disallow: /（禁止全站），同时考虑 Allow 规则的覆盖
 */
function parseRobotsTxtForBaidu(content) {
  // 按 User-agent 分段解析
  const lines = content.split('\n');
  const groups = []; // 每个 group: { agents: [], rules: [] }
  let currentGroup = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    // 跳过注释和空行
    if (!line || line.startsWith('#')) continue;

    const agentMatch = line.match(/^User-agent:\s*(.+)$/i);
    if (agentMatch) {
      // 新的 User-agent 行，可能属于新段或延续当前段
      const agent = agentMatch[1].trim();
      if (!currentGroup || currentGroup._sealed) {
        // 开始新段
        currentGroup = { agents: [], rules: [], _sealed: false };
        groups.push(currentGroup);
      }
      currentGroup.agents.push(agent);
      continue;
    }

    // 非 User-agent 行出现时，当前段不再接受新 agent（进入规则区）
    if (currentGroup) {
      currentGroup._sealed = true;
      const disallowMatch = line.match(/^Disallow:\s*(.*)$/i);
      if (disallowMatch) {
        currentGroup.rules.push({ type: 'disallow', path: disallowMatch[1].trim() });
        continue;
      }
      const allowMatch = line.match(/^Allow:\s*(.*)$/i);
      if (allowMatch) {
        currentGroup.rules.push({ type: 'allow', path: allowMatch[1].trim() });
        continue;
      }
      // Sitemap 等其他行忽略（不影响抓取判断）
    }
  }

  // 查找适用于百度蜘蛛的规则
  // 优先级：Baiduspider 专属段 > 通配段 (*) > 默认（无规则=允许）
  let baiduGroup = groups.find(g => g.agents.some(a => /^Baiduspider/i.test(a)));
  if (!baiduGroup) {
    baiduGroup = groups.find(g => g.agents.some(a => a === '*'));
  }

  if (!baiduGroup) {
    // 没有任何针对百度蜘蛛或通配的规则 → 默认允许
    return { isDisallowed: false, hasBaiduRule: false, disallowPaths: [], allowPaths: [] };
  }

  const disallowPaths = baiduGroup.rules.filter(r => r.type === 'disallow').map(r => r.path);
  const allowPaths = baiduGroup.rules.filter(r => r.type === 'allow').map(r => r.path);

  // 判断是否全站禁止：Disallow: / 且没有更具体的 Allow: / 覆盖
  // robots.txt 规则：更具体的路径规则优先（Allow: / 优先于 Disallow: / 不太常见，
  // 但如果同时存在 Disallow: / 和 Allow: /，百度官方文档表示 Allow 优先级更高）
  const hasFullDisallow = disallowPaths.some(p => p === '/');
  const hasFullAllow = allowPaths.some(p => p === '/');

  // 如果有 Disallow: / 但也有 Allow: /，Allow 优先（百度官方确认）
  const isDisallowed = hasFullDisallow && !hasFullAllow;

  return {
    isDisallowed,
    hasBaiduRule: true,
    disallowPaths,
    allowPaths,
  };
}

async function checkRobotsTxt(targetUrl) {
  try {
    const u = new URL(targetUrl);
    const robotsUrl = `${u.protocol}//${u.hostname}/robots.txt`;
    const res = await axios.get(robotsUrl, {
      headers: { 'User-Agent': BAIDU_SPIDER_UA },
      timeout: 8000,
      validateStatus: () => true,
    });
    if (res.status === 200 && res.data) {
      const content = typeof res.data === 'string' ? res.data : String(res.data);
      const parsed = parseRobotsTxtForBaidu(content);
      return {
        exists: true,
        hasBaiduRule: parsed.hasBaiduRule || /User-agent:\s*Baiduspider/i.test(content) || /User-agent:\s*\*/i.test(content),
        isDisallowed: parsed.isDisallowed,
        baiduDisallowPaths: parsed.disallowPaths,
        baiduAllowPaths: parsed.allowPaths,
        hasSitemap: /Sitemap:/i.test(content),
        content: content.substring(0, 1000),
      };
    }
    return { exists: false, hasBaiduRule: false, isDisallowed: false, baiduDisallowPaths: [], baiduAllowPaths: [], hasSitemap: false };
  } catch(e) {
    return { exists: false, hasBaiduRule: false, isDisallowed: false, baiduDisallowPaths: [], baiduAllowPaths: [], hasSitemap: false, error: e.message };
  }
}

// ======================== API路由 ========================

app.post('/api/analyze', async (req, res) => {
  const { url: targetUrl } = req.body;
  if (!targetUrl) return res.status(400).json({ error: '请提供网址' });

  let normalizedUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = 'https://' + normalizedUrl;
  try { new URL(normalizedUrl); } catch(e) { return res.status(400).json({ error: '网址格式不正确' }); }

  const fetchResult = await fetchUrl(normalizedUrl, BAIDU_SPIDER_UA);

  if (!fetchResult.success) {
    return res.json({ success: false, url: normalizedUrl, error: `抓取失败: ${fetchResult.error}`, fetchTime: fetchResult.fetchTime });
  }
  if (fetchResult.status >= 400) {
    return res.json({ success: false, url: normalizedUrl, error: `HTTP ${fetchResult.status} 无法访问`, fetchTime: fetchResult.fetchTime });
  }

  const html = fetchResult.body;
  const $ = cheerio.load(html);
  const pageSize = Buffer.byteLength(html, 'utf-8');

  // 技术指标
  const technicalMetrics = {
    httpStatus: fetchResult.status,
    responseTime: fetchResult.fetchTime,
    pageSize,
    pageSizeKB: (pageSize/1024).toFixed(1) + ' KB',
    titleLength: ($('title').text()||'').length,
    metaDescription: !!$('meta[name="description"]').attr('content'),
    h1Count: $('h1').length,
    h2Count: $('h2').length,
    imageCount: $('img').length,
    httpsEnabled: normalizedUrl.startsWith('https://'),
    viewportConfigured: !!$('meta[name="viewport"]').attr('content'),
    structuredData: $('script[type="application/ld+json"]').length,
    canonical: !!$('link[rel="canonical"]').attr('href'),
    server: fetchResult.headers['server']||'未知',
  };

  // 运行所有算法检测
  const algorithms = [
    analyzeHurricane($, html),
    analyzeBreeze($),
    analyzeBlueSky($, normalizedUrl),
    analyzeLightning(fetchResult.fetchTime, pageSize, $),
    analyzeThunder($),
    analyzeBeacon(normalizedUrl, fetchResult.finalUrl, fetchResult.headers, $, html),
    analyzePomegranate($),
    analyzeIceBucket($),
    analyzeGale($),
    analyzeGreenVine($, normalizedUrl),
    analyzeTechnicalSEO($, fetchResult.headers),
    analyzeEEAT($, html, technicalMetrics),
    analyzeSemantic($, html),
  ];

  const robotsInfo = await checkRobotsTxt(normalizedUrl);
  const overallScore = calculateOverallScore(algorithms);
  let inclusionProbability = calculateInclusionProbability(overallScore, algorithms);
  const preference = getPreferenceLevel(overallScore);

  if (robotsInfo.isDisallowed) inclusionProbability = 0;

  const spiderView = extractSpiderView(cheerio.load(html));

  // 动态沙盒评估
  const sandboxEstimate = {
    estimatedPeriod: overallScore >= 80 ? '7-15天' : overallScore >= 60 ? '15-30天' : overallScore >= 40 ? '30-60天' : '1-3个月',
    crawlFrequency: overallScore >= 80 ? '高频(日级)' : overallScore >= 60 ? '中频(周级)' : overallScore >= 40 ? '低频(月级)' : '极低频/不抓取',
    riskLevel: overallScore >= 70 ? '低风险' : overallScore >= 50 ? '中等风险' : '高风险(可能被移出索引)',
  };

  // EEAT详情
  const eeatAlgo = algorithms.find(a => a.name === 'EEAT权威性评估');

  res.json({
    success: true,
    url: normalizedUrl,
    finalUrl: fetchResult.finalUrl,
    fetchTime: fetchResult.fetchTime,
    httpStatus: fetchResult.status,
    pageSize,
    overallScore,
    inclusionProbability,
    preferenceLevel: preference.level,
    preferenceColor: preference.color,
    preferenceDesc: preference.desc,
    algorithms,
    technicalMetrics,
    spiderView,
    robotsInfo,
    sandboxEstimate,
    eeatDetails: eeatAlgo ? eeatAlgo.eeatDetails : null,
    analyzedAt: new Date().toISOString(),
    spiderUA: BAIDU_SPIDER_UA,
  });
});

app.get('/api/health', (req, res) => { res.json({ status: 'ok' }); });

app.listen(PORT, () => { console.log(`百度SEO分析服务已启动: http://localhost:${PORT}`); });
