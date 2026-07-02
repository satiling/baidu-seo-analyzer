# 百度搜索算法违规检测工具 - 服务器部署指南

## 项目概述

本工具是一个基于 Node.js 的 Web 应用，通过模拟百度蜘蛛（Baiduspider/2.0）访问目标网站，检测 13 项百度搜索算法合规性，计算百度喜好度和收录概率。

## 项目结构

```
baidu-seo-analyzer/
├── server.js          # 后端分析引擎（核心逻辑）
├── package.json       # 项目配置
├── package-lock.json  # 依赖锁定
├── node_modules/      # 依赖包（部署时重新安装）
└── public/            # 前端静态文件
    ├── index.html     # 主页面
    ├── style.css      # 样式表
    └── app.js         # 前端交互逻辑
```

## 一、服务器环境要求

- **Node.js**: 18.x 或以上（推荐 20.x/22.x）
- **npm**: 9.x 或以上
- **内存**: 建议 512MB 以上（分析大页面时需要）
- **网络**: 服务器需要能访问外网（用于抓取目标网站）
- **OS**: Linux（推荐 Ubuntu 20.04+ / CentOS 7+）

## 二、快速部署步骤

### 步骤 1：上传项目到服务器

```bash
# 方式一：直接上传整个项目目录
scp -r baidu-seo-analyzer/ user@your-server:/opt/baidu-seo-analyzer/

# 方式二：只上传源码（不含 node_modules），在服务器上重新安装依赖
scp server.js package.json user@your-server:/opt/baidu-seo-analyzer/
scp -r public/ user@your-server:/opt/baidu-seo-analyzer/public/
```

### 步骤 2：安装 Node.js（如果服务器没有）

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node -v   # 应输出 v20.x.x
npm -v    # 应输出 9.x.x+
```

### 步骤 3：安装依赖

```bash
cd /opt/baidu-seo-analyzer
npm install
```

这会安装三个核心依赖：
- `express` — Web 服务框架
- `axios` — HTTP 请求库（用于模拟百度蜘蛛抓取）
- `cheerio` — HTML 解析库（用于分析页面内容）

### 步骤 4：启动服务

```bash
# 前台启动（测试用）
node server.js

# 指定端口启动（默认3002，可自定义）
PORT=8080 node server.js
```

启动后会输出：
```
百度SEO分析服务已启动: http://localhost:3002
```

## 三、生产环境部署（推荐）

### 方案 A：使用 PM2 进程守护（最简单）

PM2 可以自动重启崩溃的进程、管理日志、支持集群模式。

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
cd /opt/baidu-seo-analyzer
pm2 start server.js --name "baidu-seo-analyzer"

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs baidu-seo-analyzer

# 重启
pm2 restart baidu-seo-analyzer

# 停止
pm2 stop baidu-seo-analyzer
```

**自定义端口启动：**
```bash
pm2 start server.js --name "baidu-seo-analyzer" -- --port 8080
```

### 方案 B：使用 systemd 服务（更正式）

创建 systemd 服务文件，实现开机自启和自动重启。

```bash
sudo nano /etc/systemd/system/baidu-seo-analyzer.service
```

写入以下内容：

```ini
[Unit]
Description=Baidu SEO Analyzer Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/baidu-seo-analyzer
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
Environment=PORT=3002
Environment=NODE_ENV=production

# 安全限制
LimitNOFILE=65536
MemoryLimit=512M

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable baidu-seo-analyzer
sudo systemctl start baidu-seo-analyzer

# 查看状态
sudo systemctl status baidu-seo-analyzer

# 查看日志
sudo journalctl -u baidu-seo-analyzer -f
```

### 方案 C：使用 Nginx 反向代理（推荐生产方案）

如果服务器已有 Nginx，建议用反向代理暴露服务，同时可以加 HTTPS。

```bash
sudo nano /etc/nginx/conf.d/baidu-seo-analyzer.conf
```

写入：

```nginx
server {
    listen 80;
    server_name seo.yourdomain.com;

    # 反向代理到 Node.js 服务
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 分析请求可能耗时较长，设置超时
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;
    }
}
```

启用配置：

```bash
sudo nginx -t          # 测试配置
sudo systemctl reload nginx  # 重载 Nginx
```

**添加 HTTPS（可选但推荐）：**

```bash
# 使用 Let's Encrypt 免费证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seo.yourdomain.com
```

完成后访问 `https://seo.yourdomain.com` 即可使用。

## 四、Docker 部署（最便携）

### 创建 Dockerfile

```bash
nano /opt/baidu-seo-analyzer/Dockerfile
```

写入：

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY server.js ./
COPY public/ ./public/
EXPOSE 3002
ENV PORT=3002
CMD ["node", "server.js"]
```

### 构建和运行

```bash
# 构建镜像
docker build -t baidu-seo-analyzer .

# 运行容器
docker run -d \
  --name baidu-seo-analyzer \
  -p 3002:3002 \
  --restart unless-stopped \
  baidu-seo-analyzer

# 查看日志
docker logs -f baidu-seo-analyzer

# 停止
docker stop baidu-seo-analyzer

# 重启
docker restart baidu-seo-analyzer
```

### 使用 Docker Compose（推荐）

```bash
nano /opt/baidu-seo-analyzer/docker-compose.yml
```

写入：

```yaml
version: '3.8'
services:
  baidu-seo-analyzer:
    build: .
    ports:
      - "3002:3002"
    environment:
      - PORT=3002
      - NODE_ENV=production
    restart: unless-stopped
    mem_limit: 512m
```

```bash
docker-compose up -d       # 启动
docker-compose logs -f     # 查看日志
docker-compose restart     # 重启
docker-compose down        # 停止并删除
```

## 五、配置调优

### 端口配置

默认端口为 3002，可通过环境变量修改：

```bash
# PM2 方式
pm2 start server.js --name "baidu-seo" -- --port 8080

# systemd 方式 — 修改 Environment=PORT=8080

# Docker 方式 — 修改 -p 8080:8080 和 ENV PORT=8080

# 直接运行
PORT=8080 node server.js
```

### 超时设置

分析某些网站可能耗时较长（10-30秒），Nginx 反向代理需要调整超时：

```nginx
proxy_read_timeout 60s;       # 建议设为 60s
proxy_connect_timeout 15s;
```

### 并发限制

如果担心滥用，可以在 Nginx 层限制并发请求：

```nginx
limit_req_zone $binary_remote_addr zone=analyze:10m rate=5r/m;

location /api/analyze {
    limit_req zone=analyze burst=10 nodelay;
    proxy_pass http://127.0.0.1:3002;
}
```

## 六、安全注意事项

1. **不要以 root 运行** — 使用 `www-data` 或创建专用用户
2. **设置防火墙** — 如果不用 Nginx 代理，只暴露必要端口：
   ```bash
   sudo ufw allow 3002/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```
3. **日志监控** — 定期检查异常请求
4. **HTTPS** — 生产环境务必启用 HTTPS
5. **请求频率限制** — 防止滥用扫描

## 七、常见问题

### Q: 启动后无法访问？
```bash
# 检查服务是否运行
ps aux | grep node
netstat -tlnp | grep 3002

# 检查防火墙
sudo ufw status
```

### Q: 分析某些网站超时？
- 部分网站响应较慢，是正常现象
- 调整 Nginx `proxy_read_timeout`
- 目标网站可能有反爬机制阻止抓取

### Q: 如何更新代码？
```bash
# 上传新的 server.js 或 public/ 文件后
pm2 restart baidu-seo-analyzer
# 或
sudo systemctl restart baidu-seo-analyzer
# 或
docker-compose restart
```

### Q: 服务器内存不足？
- 分析大页面时可能占用较多内存
- Docker 方式可限制 `mem_limit: 512m`
- systemd 方式可设置 `MemoryLimit=512M`

---

部署完成后，访问 `http://your-server-ip:3002` 或配置的域名即可使用。
