/**
 * 测试AI内容检测引擎
 */
const cheerio = require('cheerio');
const { detectAIContent } = require('./ai-detector');

function make$(text) {
  return cheerio.load('<html><body>' + text.replace(/\n/g, '</p><p>') + '</p></body></html>');
}

// 测试用例1：典型AI生成低质文章（套话堆砌，无真实经验）
const aiContent1 = `随着科技的不断发展，在当今社会中，人工智能技术正日益成熟。众所周知，AI已经深入到我们生活的方方面面。值得注意的是，AI技术的发展对于推动社会进步具有重要意义。

首先，AI技术在医疗领域发挥着重要作用。通过AI辅助诊断，医生可以更高效地完成工作。其次，在教育领域，AI也起到了关键作用。此外，在金融领域，AI的应用也越来越广泛。另外，在交通领域，AI同样具有重要意义。

不可否认的是，AI技术的发展不仅可以帮助人们提高工作效率，还可以为人们提供更加便捷的服务。毋庸置疑，AI技术将在未来发挥更加重要的作用。显而易见，AI技术的发展是一个长期的过程。

总而言之，AI技术的发展对于我们来说具有重要意义。综上所述，我们应该积极拥抱AI技术，让AI技术更好地服务于人类社会。毫无疑问，AI技术必将成为未来发展的重要方向。`;

// 测试用例2：人类真实写作的高质文章（有具体数据、经验、案例）
const humanContent1 = `上周我在部署一个Node.js项目时踩了个大坑，花了整整3个小时才定位到问题。这里记录下完整的排查过程，希望对大家有帮助。

事情是这样的：我们在AWS EC2上用PM2跑Node服务，上线2周一直正常，但昨天突然报502错误。我第一时间看了下PM2日志，发现是内存溢出（OOM）。

具体操作步骤：
1. 用free -h查看内存，发现4GB的实例只剩200MB可用
2. 用top命令发现有一个node进程占了2.8GB内存
3. 用--inspect参数启动Node，连Chrome DevTools做heap snapshot对比
4. 定位到一个定时器每5分钟创建一个大数组但没有清理

修复方案很简单，在定时器回调里加了arr.length = 0清空数组。上线后内存稳定在800MB左右，问题解决。

这次踩坑让我意识到：V8的GC对闭包引用的数组不会自动回收，特别是定时器里的引用。建议大家在用setInterval时务必注意闭包内的变量清理。

根据V8官方文档，Node.js 18以上的内存管理有改进，但闭包引用依然是内存泄漏的高发点。我们团队后续打算引入heapdump做定期快照监控，避免再出现类似问题。`;

// 测试用例3：AI生成但稍作改写（伪原创）
const aiContent2 = `随着互联网的快速发展，在数字化时代，网站优化已经成为企业推广的重要手段。众所周知，SEO优化对于提升网站排名具有重要作用。需要指出的是，优质的SEO优化不仅可以提升流量，还可以带来更多转化。

一方面，关键词优化是SEO的基础。通过合理布局关键词，可以有效提升页面相关性。另一方面，内容质量同样重要。高质量的原创内容能够吸引更多用户访问。与此同时，外链建设也不容忽视。优质的外链可以显著提升网站权重。

首先，我们要做好关键词研究。其次，需要优化网站结构。再次，要持续产出优质内容。最后，要建立高质量外链。此外，还需要关注用户体验。另外，移动端优化也十分重要。

通过以上分析，我们可以看出，SEO优化是一个系统工程。不难看出，只有全面做好各个环节，才能取得良好效果。总的来说，SEO优化需要长期坚持，才能看到明显成效。`;

// 测试用例4：短内容（应该返回较低AI概率）
const shortContent = `这是一个简单的测试页面，内容较少。`;

// 测试用例5：典型AI营销文案（堆砌形容词）
const aiMarketing = `我们致力于打造高效、便捷、智能的创新产品，为用户提供优质的卓越服务。我们的团队具有全方位、多层次、多维度的深度专业优势，能够满足不同客户的广泛需求。

通过构建强大的技术架构，我们推动行业发展，促进产业升级，提升用户体验，完善服务体系，加强安全保障。我们的目标是赋能企业数字化转型，助力商业创新，打造生态闭环。

我们的服务不仅可以提升效率，还可以降低成本。既能满足大企业需求，也能服务中小企业。在某种程度上，我们的解决方案已经达到了行业领先水平。从宏观角度看，这将对整个行业产生深远影响。

我们需要不断创新，我们应该持续优化，我们要追求卓越。在未来的发展中，我们将继续致力于为用户创造更大价值，推动行业向前发展，为社会进步贡献力量。`;

console.log('========== 测试1：典型AI生成低质文章 ==========');
const r1 = detectAIContent(aiContent1, make$(aiContent1));
console.log('AI概率:', r1.aiProbability + '%', '等级:', r1.aiLevel);
console.log('套话命中:', r1.templateHits, '密度:', r1.templateDensity + '/千字');
console.log('信息密度:', r1.infoDensity);
console.log('具体数据密度:', r1.specificDensity + '/千字');
console.log('真实经验信号:', r1.experienceHits + '处');
console.log('发现项数量:', r1.findings.length);
r1.findings.forEach(f => console.log(' -', f.type, ':', f.message.substring(0, 80)));

console.log('\n========== 测试2：人类真实写作高质文章 ==========');
const r2 = detectAIContent(humanContent1, make$(humanContent1));
console.log('AI概率:', r2.aiProbability + '%', '等级:', r2.aiLevel);
console.log('套话命中:', r2.templateHits, '密度:', r2.templateDensity + '/千字');
console.log('信息密度:', r2.infoDensity);
console.log('具体数据密度:', r2.specificDensity + '/千字');
console.log('真实经验信号:', r2.experienceHits + '处');
console.log('发现项数量:', r2.findings.length);
r2.findings.forEach(f => console.log(' -', f.type, ':', f.message.substring(0, 80)));

console.log('\n========== 测试3：AI伪原创改写 ==========');
const r3 = detectAIContent(aiContent2, make$(aiContent2));
console.log('AI概率:', r3.aiProbability + '%', '等级:', r3.aiLevel);
console.log('套话命中:', r3.templateHits, '密度:', r3.templateDensity + '/千字');
console.log('信息密度:', r3.infoDensity);
console.log('具体数据密度:', r3.specificDensity + '/千字');
console.log('真实经验信号:', r3.experienceHits + '处');

console.log('\n========== 测试4：短内容 ==========');
const r4 = detectAIContent(shortContent, make$(shortContent));
console.log('AI概率:', r4.aiProbability + '%', '等级:', r4.aiLevel);
console.log('原因:', r4.reason || '正常检测');

console.log('\n========== 测试5：AI营销文案 ==========');
const r5 = detectAIContent(aiMarketing, make$(aiMarketing));
console.log('AI概率:', r5.aiProbability + '%', '等级:', r5.aiLevel);
console.log('套话命中:', r5.templateHits, '密度:', r5.templateDensity + '/千字');
console.log('信息密度:', r5.infoDensity);
console.log('真实经验信号:', r5.experienceHits + '处');

console.log('\n========== 期望结果验证 ==========');
console.log('测试1（AI低质）: 期望高AI概率（>50%） - 实际:', r1.aiProbability + '%', r1.aiProbability > 50 ? '✓ 通过' : '✗ 失败');
console.log('测试2（人类高质）: 期望低AI概率（<30%） - 实际:', r2.aiProbability + '%', r2.aiProbability < 30 ? '✓ 通过' : '✗ 失败');
console.log('测试3（AI伪原创）: 期望中高AI概率（>40%） - 实际:', r3.aiProbability + '%', r3.aiProbability > 40 ? '✓ 通过' : '✗ 失败');
console.log('测试5（AI营销）: 期望高AI概率（>50%） - 实际:', r5.aiProbability + '%', r5.aiProbability > 50 ? '✓ 通过' : '✗ 失败');
