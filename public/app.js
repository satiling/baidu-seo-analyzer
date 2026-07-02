// ======================== 全局变量 ========================
const urlInput = document.getElementById('urlInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const btnText = analyzeBtn.querySelector('.btn-text');
const btnSpinner = analyzeBtn.querySelector('.btn-spinner');
const inputError = document.getElementById('inputError');
const loadingSection = document.getElementById('loadingSection');
const errorSection = document.getElementById('errorSection');
const resultSection = document.getElementById('resultSection');

let currentResult = null;

// ======================== 事件绑定 ========================

analyzeBtn.addEventListener('click', startAnalysis);
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') startAnalysis();
});

async function startAnalysis() {
  const url = urlInput.value.trim();
  if (!url) {
    showError('请输入网址');
    return;
  }

  hideError();
  resultSection.style.display = 'none';
  errorSection.style.display = 'none';
  loadingSection.style.display = 'block';

  setButtonLoading(true);
  startLoadingAnimation();

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!data.success) {
      showError(data.error || '检测失败，请检查网址是否正确');
      loadingSection.style.display = 'none';
      setButtonLoading(false);
      return;
    }

    currentResult = data;
    finishLoadingAnimation(() => {
      loadingSection.style.display = 'none';
      renderResults(data);
      resultSection.style.display = 'block';
      setButtonLoading(false);
    });
  } catch (err) {
    showError('网络错误，请稍后重试');
    loadingSection.style.display = 'none';
    setButtonLoading(false);
  }
}

// ======================== UI 辅助函数 ========================

function setButtonLoading(loading) {
  analyzeBtn.disabled = loading;
  btnText.textContent = loading ? '正在检测' : '开始检测';
  btnSpinner.style.display = loading ? 'inline-block' : 'none';
}

function showError(msg) {
  inputError.textContent = msg;
  inputError.style.display = 'block';
}
function hideError() { inputError.style.display = 'none'; }

function startLoadingAnimation() {
  const steps = [
    document.getElementById('step1'),
    document.getElementById('step2'),
    document.getElementById('step3'),
    document.getElementById('step4'),
  ];
  steps.forEach(s => { s.className = 'step'; });
  let current = 0;

  const interval = setInterval(() => {
    if (current < 4) {
      steps[current].classList.add('active');
      if (current > 0) {
        steps[current - 1].classList.remove('active');
        steps[current - 1].classList.add('done');
      }
      current++;
    }
  }, 800);

  window._loadingInterval = interval;
}

function finishLoadingAnimation(callback) {
  clearInterval(window._loadingInterval);
  const steps = [
    document.getElementById('step1'),
    document.getElementById('step2'),
    document.getElementById('step3'),
    document.getElementById('step4'),
  ];
  steps.forEach(s => { s.classList.remove('active'); s.classList.add('done'); });
  setTimeout(callback, 600);
}

// ======================== 结果渲染 ========================

function renderResults(data) {
  // 核心评分
  animateScoreGauge(data.overallScore, data.preferenceColor);
  document.getElementById('scoreText').setAttribute('fill', data.preferenceColor || '#1a1a1a');
  document.getElementById('preferenceLevel').textContent = data.preferenceLevel || '--';
  document.getElementById('preferenceLevel').style.color = data.preferenceColor || '#1a1a1a';
  document.getElementById('inclusionProb').textContent = data.inclusionProbability + '%';
  document.getElementById('preferenceDesc').textContent = data.preferenceDesc || '--';

  // 概览统计
  let passCount = 0, warnCount = 0, failCount = 0;
  data.algorithms.forEach(a => {
    if (a.status === 'pass') passCount++;
    else if (a.status === 'warn') warnCount++;
    else if (a.status === 'fail') failCount++;
  });
  document.getElementById('passCount').textContent = passCount;
  document.getElementById('warnCount').textContent = warnCount;
  document.getElementById('failCount').textContent = failCount;

  // URL信息
  document.getElementById('resultUrl').textContent = data.url;
  document.getElementById('resultStatus').textContent = data.httpStatus;
  document.getElementById('resultTime').textContent = data.fetchTime + 'ms';
  document.getElementById('resultSize').textContent = (data.pageSize / 1024).toFixed(1) + ' KB';
  document.getElementById('resultDate').textContent = new Date(data.analyzedAt).toLocaleString('zh-CN');

  // 算法卡片
  renderAlgorithms(data.algorithms);

  // 技术指标
  renderTechMetrics(data.technicalMetrics);

  // 蜘蛛视角
  renderSpiderView(data.spiderView);

  // robots.txt
  renderRobotsInfo(data.robotsInfo);

  // EEAT评估
  renderEEAT(data);

  // 沙盒评估
  renderSandbox(data);
}

function animateScoreGauge(score, color) {
  const circle = document.getElementById('scoreCircle');
  const text = document.getElementById('scoreText');
  const circumference = 2 * Math.PI * 85; // ~534
  const offset = circumference - (score / 100) * circumference;

  circle.style.stroke = color || '#2932E1';
  circle.setAttribute('stroke-dashoffset', circumference);

  // 动画
  let current = 0;
  const duration = 1200;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    current = Math.round(eased * score);
    text.textContent = current;
    const currentOffset = circumference - (eased * score / 100) * circumference;
    circle.setAttribute('stroke-dashoffset', currentOffset);
    if (progress < 1) requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

function renderAlgorithms(algorithms) {
  const grid = document.getElementById('algorithmGrid');
  grid.innerHTML = '';

  algorithms.forEach(algo => {
    const card = document.createElement('div');
    card.className = `algo-card status-${algo.status}`;
    card.onclick = () => card.classList.toggle('expanded');

    const badgeClass = algo.status === 'pass' ? 'badge-pass' :
                       algo.status === 'warn' ? 'badge-warn' : 'badge-fail';
    const badgeText = algo.status === 'pass' ? '合规' :
                      algo.status === 'warn' ? '警告' : '违规';

    const barClass = algo.score >= 80 ? 'pass' :
                     algo.score >= 50 ? 'warn' : 'fail';

    let findingsHtml = '';
    algo.findings.forEach(f => {
      const iconClass = f.type;
      const iconSymbol = f.type === 'pass' ? '\u2713' :
                         f.type === 'warn' ? '\u25B2' :
                         f.type === 'fail' ? '\u2717' : '\u25CF';
      findingsHtml += `
        <div class="finding-item">
          <span class="finding-icon ${iconClass}">${iconSymbol}</span>
          <div class="finding-text">
            <div class="finding-msg">${f.message}</div>
            ${f.suggestion ? `<div class="finding-suggestion">\u2192 整改建议：${f.suggestion}</div>` : ''}
          </div>
        </div>`;
    });

    // AI检测详情（飓风算法专属）
    let aiDetailsHtml = '';
    if (algo.aiDetails) {
      const ai = algo.aiDetails;
      const aiColor = ai.aiLevel === 'high' ? 'var(--color-fail)' :
                       ai.aiLevel === 'medium' ? 'var(--color-warn)' :
                       ai.aiLevel === 'low' ? 'var(--color-warn)' : 'var(--color-pass)';
      const aiLabel = ai.aiLevel === 'high' ? 'AI生成特征极强' :
                       ai.aiLevel === 'medium' ? '疑似AI生成' :
                       ai.aiLevel === 'low' ? '轻度AI特征' : '人类写作特征';
      aiDetailsHtml = `
        <div style="margin:12px 0;padding:14px;background:#f9f9f9;border-radius:8px;border-left:4px solid ${aiColor};">
          <div style="font-size:14px;font-weight:600;margin-bottom:10px;color:${aiColor};">
            AI内容检测详情 - ${aiLabel}
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-size:12px;">
            <div><span style="color:var(--text-secondary);">AI生成概率：</span><strong style="color:${aiColor};">${ai.aiProbability}%</strong></div>
            <div><span style="color:var(--text-secondary);">套话模板命中：</span><strong>${ai.templateHits}处 (${ai.templateDensity}/千字)</strong></div>
            <div><span style="color:var(--text-secondary);">信息密度：</span><strong>${ai.infoDensity}</strong></div>
            <div><span style="color:var(--text-secondary);">具体数据密度：</span><strong>${ai.specificDensity}/千字</strong></div>
            <div><span style="color:var(--text-secondary);">真实经验信号：</span><strong>${ai.experienceHits}处</strong></div>
            <div><span style="color:var(--text-secondary);">AI等级：</span><strong style="color:${aiColor};">${ai.aiLevel}</strong></div>
          </div>
        </div>`;
    }

    card.innerHTML = `
      <div class="algo-header">
        <span class="algo-name">${algo.name}</span>
        <span class="algo-badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="algo-category">${algo.category}</div>
      <div class="algo-version">${algo.version}</div>
      <div class="algo-score-bar">
        <div class="score-bar-bg"><div class="score-bar-fill ${barClass}" style="width:${algo.score}%"></div></div>
        <div class="algo-score-num">评分: ${algo.score}/100</div>
      </div>
      <div class="algo-details">
        <div class="algo-desc">${algo.description}</div>
        ${aiDetailsHtml}
        ${findingsHtml}
      </div>`;
    grid.appendChild(card);
  });
}

function renderTechMetrics(metrics) {
  const container = document.getElementById('techMetrics');
  const items = [
    { label: 'HTTP状态', value: metrics.httpStatus, status: metrics.httpStatus === 200 ? 'good' : 'bad' },
    { label: '响应时间', value: metrics.responseTime + 'ms', status: metrics.responseTime < 2000 ? 'good' : metrics.responseTime < 3000 ? 'mid' : 'bad' },
    { label: '页面大小', value: metrics.pageSizeKB, status: parseFloat(metrics.pageSizeKB) < 300 ? 'good' : parseFloat(metrics.pageSizeKB) < 512 ? 'mid' : 'bad' },
    { label: 'HTTPS', value: metrics.httpsEnabled ? '已启用' : '未启用', status: metrics.httpsEnabled ? 'good' : 'bad' },
    { label: '标题长度', value: metrics.titleLength + '字', status: metrics.titleLength >= 10 && metrics.titleLength <= 60 ? 'good' : 'mid' },
    { label: 'Meta描述', value: metrics.metaDescription ? '已设置' : '未设置', status: metrics.metaDescription ? 'good' : 'bad' },
    { label: 'H1标签', value: metrics.h1Count + '个', status: metrics.h1Count === 1 ? 'good' : metrics.h1Count === 0 ? 'bad' : 'mid' },
    { label: '图片数量', value: metrics.imageCount + '张', status: 'mid' },
    { label: 'Viewport', value: metrics.viewportConfigured ? '已配置' : '未配置', status: metrics.viewportConfigured ? 'good' : 'bad' },
    { label: '结构化数据', value: metrics.structuredData + '个', status: metrics.structuredData > 0 ? 'good' : 'mid' },
    { label: 'Canonical', value: metrics.canonical ? '已设置' : '未设置', status: metrics.canonical ? 'good' : 'mid' },
    { label: '服务器', value: metrics.server, status: 'mid' },
  ];

  let html = '<div class="metrics-grid">';
  items.forEach(item => {
    html += `
      <div class="metric-item">
        <div class="metric-label">${item.label}</div>
        <div class="metric-value">${item.value}</div>
        <div class="metric-status ${item.status}">
          ${item.status === 'good' ? '\u2713 良好' : item.status === 'bad' ? '\u2717 需改进' : '\u25CF 一般'}
        </div>
      </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderSpiderView(view) {
  const container = document.getElementById('spiderView');

  let headingsHtml = '';
  if (view.headings && view.headings.length > 0) {
    headingsHtml = '<ul class="spider-headings-list">';
    view.headings.forEach(h => {
      headingsHtml += `<li><span class="h-tag">${h.level.toUpperCase()}</span>${h.text}</li>`;
    });
    headingsHtml += '</ul>';
  } else {
    headingsHtml = '<p style="color:#999;font-size:13px;">未检测到标题标签</p>';
  }

  let linksHtml = '';
  if (view.links && view.links.length > 0) {
    linksHtml = '<ul class="spider-links-list">';
    view.links.slice(0, 15).forEach(l => {
      linksHtml += `<li><span class="link-text">${l.text}</span><span class="link-url">${l.href}</span></li>`;
    });
    linksHtml += '</ul>';
  } else {
    linksHtml = '<p style="color:#999;font-size:13px;">未检测到链接</p>';
  }

  container.innerHTML = `
    <div class="spider-block">
      <div class="spider-block-title">页面标题 (Title)</div>
      <div class="spider-title-display">${view.title || '(无标题)'}</div>
    </div>
    <div class="spider-block">
      <div class="spider-block-title">Meta描述 (Description)</div>
      <div class="spider-desc-display">${view.description || '(无描述)'}</div>
    </div>
    <div class="spider-block">
      <div class="spider-block-title">标题层级结构 (H1-H3)</div>
      ${headingsHtml}
    </div>
    <div class="spider-block">
      <div class="spider-block-title">关键链接 (前15个)</div>
      ${linksHtml}
    </div>
    <div class="spider-block">
      <div class="spider-block-title">正文文本摘要</div>
      <div class="spider-text-display">${view.textContent || '(无文本内容)'}</div>
    </div>`;
}

function renderRobotsInfo(info) {
  const container = document.getElementById('robotsSection');

  if (!info) {
    container.innerHTML = '';
    return;
  }

  let statusHtml = '';
  if (info.isDisallowed) {
    statusHtml = '<span class="algo-badge badge-fail">百度蜘蛛被禁止抓取全站</span>';
  } else if (info.exists) {
    const hasPaths = (info.baiduDisallowPaths && info.baiduDisallowPaths.length > 0);
    statusHtml = hasPaths
      ? `<span class="algo-badge badge-warn">百度蜘蛛部分目录受限</span>`
      : '<span class="algo-badge badge-pass">百度蜘蛛可正常抓取</span>';
  } else {
    statusHtml = '<span class="algo-badge badge-warn">未找到 robots.txt</span>';
  }

  // 百度蜘蛛禁止/允许路径详情
  let pathsHtml = '';
  const disallowPaths = info.baiduDisallowPaths || [];
  const allowPaths = info.baiduAllowPaths || [];
  if (info.exists && (disallowPaths.length > 0 || allowPaths.length > 0)) {
    const disallowItems = disallowPaths.map(p =>
      `<span class="algo-badge badge-fail" style="font-size:12px;margin:2px;">禁止: ${escapeHtml(p || '(空=允许全部)')}</span>`
    ).join('');
    const allowItems = allowPaths.map(p =>
      `<span class="algo-badge badge-pass" style="font-size:12px;margin:2px;">允许: ${escapeHtml(p)}</span>`
    ).join('');
    pathsHtml = `
      <div style="margin-top:12px;padding:10px;background:#f9f9f9;border-radius:6px;">
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:6px;">百度蜘蛛适用规则：</div>
        ${disallowItems}${allowItems}
      </div>`;
  }

  let contentHtml = '';
  if (info.content) {
    contentHtml = `<div class="robots-content">${escapeHtml(info.content)}</div>`;
  }

  container.innerHTML = `
    <div class="robots-header">
      <h3>robots.txt 检测</h3>
      <div class="robots-status">${statusHtml}</div>
    </div>
    <div class="metrics-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="metric-item">
        <div class="metric-label">文件是否存在</div>
        <div class="metric-value">${info.exists ? '是' : '否'}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">百度蜘蛛规则</div>
        <div class="metric-value">${info.hasBaiduRule ? '有' : '无'}</div>
      </div>
      <div class="metric-item">
        <div class="metric-label">是否禁止抓取</div>
        <div class="metric-value" style="color:${info.isDisallowed ? 'var(--color-fail)' : 'var(--color-pass)'}">${info.isDisallowed ? '全站禁止' : '允许抓取'}</div>
      </div>
    </div>
    ${pathsHtml}
    ${contentHtml}`;
}

function renderEEAT(data) {
  // EEAT评估 - 基于页面内容信号推断
  const container = document.createElement('div');
  container.className = 'eeat-section';

  // 简易EEAT推断逻辑
  const spiderView = data.spiderView || {};
  const metrics = data.technicalMetrics || {};
  const algorithms = data.algorithms || [];

  const hurricaneAlgo = algorithms.find(a => a.name === '飓风算法');
  const breezeAlgo = algorithms.find(a => a.name === '清风算法');

  // Experience: 内容是否体现实际经验
  let expScore = 50;
  if (spiderView.textContent && spiderView.textContent.length > 500) expScore += 15;
  if (spiderView.headings && spiderView.headings.length > 3) expScore += 10;
  if (hurricaneAlgo && hurricaneAlgo.score >= 70) expScore += 10;

  // Expertise: 专业度信号
  let exp2Score = 40;
  if (metrics.structuredData > 0) exp2Score += 15;
  if (metrics.metaDescription) exp2Score += 10;
  if (spiderView.textContent && spiderView.textContent.length > 800) exp2Score += 10;
  if (metrics.h1Count === 1) exp2Score += 10;

  // Authority: 权威性信号
  let authScore = 30;
  if (metrics.httpsEnabled) authScore += 20;
  if (metrics.canonical) authScore += 15;
  if (breezeAlgo && breezeAlgo.score >= 70) authScore += 15;

  // Trustworthiness: 可信度信号
  let trustScore = 40;
  if (metrics.httpsEnabled) trustScore += 20;
  if (!data.robotsInfo?.isDisallowed) trustScore += 15;
  if (metrics.httpStatus === 200) trustScore += 10;

  expScore = Math.min(95, expScore);
  exp2Score = Math.min(95, exp2Score);
  authScore = Math.min(95, authScore);
  trustScore = Math.min(95, trustScore);

  const eeatOverall = Math.round((expScore + exp2Score + authScore + trustScore) / 4);

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="font-size:16px;">EEAT 权威性评估</h3>
      <div>
        <span style="font-size:13px;color:var(--text-secondary);">综合EEAT评分：</span>
        <span style="font-size:24px;font-weight:700;color:${eeatOverall >= 70 ? 'var(--color-pass)' : eeatOverall >= 50 ? 'var(--color-warn)' : 'var(--color-fail)'}">${eeatOverall}</span>
      </div>
    </div>
    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;background:#f9f9f9;padding:10px;border-radius:6px;">
      2026年百度已将EEAT纳入正式评分体系。医疗/金融/法律等专业领域，无权威资质的内容直接降权。
    </p>
    <div class="eeat-grid">
      <div class="eeat-item">
        <div class="eeat-letter e">E</div>
        <div class="eeat-name">经验 Experience</div>
        <div class="eeat-desc">内容是否体现真实实践经验</div>
        <div class="eeat-score" style="color:${expScore >= 70 ? 'var(--color-pass)' : expScore >= 50 ? 'var(--color-warn)' : 'var(--color-fail)'}">${expScore}</div>
      </div>
      <div class="eeat-item">
        <div class="eeat-letter e1">E</div>
        <div class="eeat-name">专业度 Expertise</div>
        <div class="eeat-desc">内容是否专业、结构化</div>
        <div class="eeat-score" style="color:${exp2Score >= 70 ? 'var(--color-pass)' : exp2Score >= 50 ? 'var(--color-warn)' : 'var(--color-fail)'}">${exp2Score}</div>
      </div>
      <div class="eeat-item">
        <div class="eeat-letter a">A</div>
        <div class="eeat-name">权威性 Authority</div>
        <div class="eeat-desc">是否有权威背书和引用</div>
        <div class="eeat-score" style="color:${authScore >= 70 ? 'var(--color-pass)' : authScore >= 50 ? 'var(--color-warn)' : 'var(--color-fail)'}">${authScore}</div>
      </div>
      <div class="eeat-item">
        <div class="eeat-letter t">T</div>
        <div class="eeat-name">可信度 Trust</div>
        <div class="eeat-desc">站点是否安全可信</div>
        <div class="eeat-score" style="color:${trustScore >= 70 ? 'var(--color-pass)' : trustScore >= 50 ? 'var(--color-warn)' : 'var(--color-fail)'}">${trustScore}</div>
      </div>
    </div>`;

  resultSection.appendChild(container);
}

function renderSandbox(data) {
  const container = document.createElement('div');
  container.className = 'sandbox-section';

  // 动态沙盒机制评估
  const isNewSite = data.httpStatus === 200 && data.overallScore < 60;
  const sandboxDays = isNewSite ? '30-90天' : '7-30天';
  const estimatedCrawlFreq = data.overallScore >= 80 ? '高频(日级)' :
                              data.overallScore >= 60 ? '中频(周级)' :
                              data.overallScore >= 40 ? '低频(月级)' : '极低频/不抓取';

  container.innerHTML = `
    <div class="sandbox-header">
      <h3 style="font-size:16px;">动态沙盒与收录评估</h3>
      <div></div>
    </div>
    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;background:#f9f9f9;padding:10px;border-radius:6px;">
      2026年百度上线动态沙盒机制：新页面收录后进入沙盒期，通过用户行为数据（点击率、停留时长、跳出率）考核，数据不达标会被移出索引。
    </p>
    <div class="sandbox-info-grid">
      <div class="sandbox-item">
        <div class="sandbox-label">预估收录概率</div>
        <div class="sandbox-value" style="color:${data.inclusionProbability >= 70 ? 'var(--color-pass)' : data.inclusionProbability >= 40 ? 'var(--color-warn)' : 'var(--color-fail)'}">${data.inclusionProbability}%</div>
      </div>
      <div class="sandbox-item">
        <div class="sandbox-label">预估沙盒周期</div>
        <div class="sandbox-value">${sandboxDays}</div>
      </div>
      <div class="sandbox-item">
        <div class="sandbox-label">预估抓取频率</div>
        <div class="sandbox-value">${estimatedCrawlFreq}</div>
      </div>
    </div>`;

  resultSection.appendChild(container);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ======================== 初始化 ========================
urlInput.focus();
