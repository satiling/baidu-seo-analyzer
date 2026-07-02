const http = require('http');
const path = require('path');
const fs = require('fs');

// 启动测试内容服务器
const testHtml = fs.readFileSync(path.join(__dirname, 'test-ai-content.html'), 'utf-8');
const testServer = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
  res.end(testHtml);
});

testServer.listen(4567, async () => {
  console.log('测试服务器: http://127.0.0.1:4567');

  // 等待分析服务器
  await new Promise(r => setTimeout(r, 1000));

  // 调用分析API
  const data = JSON.stringify({url:'http://127.0.0.1:4567'});
  const req = http.request({
    hostname:'127.0.0.1',
    port:3002,
    path:'/api/analyze',
    method:'POST',
    headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)},
    timeout: 20000,
  }, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      try {
        const r = JSON.parse(body);
        console.log('\n========== 分析结果 ==========');
        console.log('总评分:', r.overallScore);
        console.log('偏好等级:', r.preferenceLevel);
        console.log('收录概率:', r.inclusionProbability + '%');
        console.log('\n--- 各算法得分 ---');
        r.algorithms.forEach(a => {
          console.log('  ' + a.name + ': ' + a.score + ' (' + a.status + ')');
        });
        const hurricane = r.algorithms.find(a => a.name === '飓风算法');
        if (hurricane && hurricane.aiDetails) {
          console.log('\n--- AI检测详情（飓风算法）---');
          console.log('  AI概率:', hurricane.aiDetails.aiProbability + '%');
          console.log('  AI等级:', hurricane.aiDetails.aiLevel);
          console.log('  套话命中:', hurricane.aiDetails.templateHits + '处 (' + hurricane.aiDetails.templateDensity + '/千字)');
          console.log('  信息密度:', hurricane.aiDetails.infoDensity);
          console.log('  具体数据密度:', hurricane.aiDetails.specificDensity + '/千字');
          console.log('  真实经验信号:', hurricane.aiDetails.experienceHits + '处');
        }
        console.log('\n--- 飓风算法发现项 ---');
        if (hurricane) {
          hurricane.findings.forEach(f => console.log('  [' + f.type + '] ' + f.message.substring(0, 90)));
        }
      } catch(e) {
        console.log('解析失败:', e.message);
        console.log('原始数据前500字:', body.substring(0,500));
      }
      testServer.close();
      process.exit(0);
    });
  });
  req.on('error', e => { console.log('请求错误:', e.message); testServer.close(); process.exit(1); });
  req.on('timeout', () => { console.log('请求超时'); req.destroy(); testServer.close(); process.exit(1); });
  req.write(data);
  req.end();
});
