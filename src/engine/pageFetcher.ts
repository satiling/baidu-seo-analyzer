/**
 * 页面抓取器
 * 通过 CORS 代理抓取目标 URL 的 HTML，提取正文文本
 * 解决纯前端无法跨域抓取的问题
 */

/** 抓取结果 */
export interface FetchResult {
  success: boolean;
  /** 提取的正文文本 */
  content: string;
  /** 原始 HTML */
  html?: string;
  /** 页面标题 */
  title: string;
  /** 字数 */
  charCount: number;
  /** 使用的代理 */
  proxyUsed?: string;
  /** 错误信息 */
  error?: string;
  /** 耗时 ms */
  elapsed: number;
}

/** CORS 代理列表（按优先级，多代理回退） */
const CORS_PROXIES = [
  {
    name: "r.jina.ai",
    build: (url: string) => `https://r.jina.ai/${url}`,
    /** jina 返回的是 Markdown 纯文本，无需再 extractContent */
    isMarkdown: true,
  },
  {
    name: "allorigins",
    build: (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    isMarkdown: false,
  },
  {
    name: "codetabs",
    build: (url: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
    isMarkdown: false,
  },
  {
    name: "thingproxy",
    build: (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
    isMarkdown: false,
  },
];

/** 需要移除的标签 */
const REMOVE_TAGS = [
  "script", "style", "nav", "header", "footer", "aside",
  "noscript", "iframe", "form", "button", "svg", "canvas",
];

/** 正文容器选择器（按优先级） */
const CONTENT_SELECTORS = [
  "article",
  "main",
  ".post-content",
  ".article-content",
  ".entry-content",
  ".content",
  "#content",
  ".post",
  ".article",
  ".main-content",
  ".entry",
];

/**
 * 从 HTML 提取正文文本
 * 策略：先尝试语义化容器，失败则全局清理
 */
export function extractContent(html: string): { content: string; title: string } {
  let title = "";
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = decodeHtml(titleMatch[1].trim()).slice(0, 200);
  }

  // 同时尝试 og:title
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (ogTitleMatch && !title) {
    title = decodeHtml(ogTitleMatch[1]).slice(0, 200);
  }

  // 移除不需要的标签
  let cleaned = html;
  for (const tag of REMOVE_TAGS) {
    const regex = new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, "gi");
    cleaned = cleaned.replace(regex, " ");
  }
  // 移除 HTML 注释
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, " ");

  // 尝试从语义化容器提取
  let contentHtml = "";
  for (const selector of CONTENT_SELECTORS) {
    const pattern = selector.startsWith("#")
      ? new RegExp(`id=["']${selector.slice(1)}["'][^>]*>([\\s\\S]*?)(?=<\\/div|<\\/section|<\\/article|$)`, "i")
      : new RegExp(`<${selector.replace(".", "")}[\\s\\S]*?>([\\s\\S]*?)<\\/${selector.replace(".", "")}>`, "i");
    const m = cleaned.match(pattern);
    if (m && m[1] && m[1].length > 200) {
      contentHtml = m[1];
      break;
    }
  }

  // 若未匹配到容器，用整个 cleaned
  if (!contentHtml) contentHtml = cleaned;

  // 移除所有剩余标签
  let text = contentHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/g, " ");

  text = decodeHtml(text);

  // 清理空白
  text = text
    .replace(/[\t\r\f\v]+/g, " ")
    .replace(/ {2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join("\n");

  // 若文本过长截断（AIGC 检测 5000 字足够）
  if (text.length > 8000) text = text.slice(0, 8000);

  return { content: text, title };
}

/** HTML 实体解码 */
function decodeHtml(s: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'",
    "&ldquo;": "\u201C", "&rdquo;": "\u201D", "&mdash;": "\u2014", "&ndash;": "\u2013",
    "&hellip;": "\u2026", "&middot;": "\u00B7", "&laquo;": "\u00AB", "&raquo;": "\u00BB",
    "&nbsp;": " ",
  };
  return s.replace(/&[a-z#0-9]+;/gi, (e) => entities[e.toLowerCase()] || e);
}

/**
 * 抓取页面并提取正文
 * 多代理回退，单代理超时 15 秒
 */
export async function fetchPageContent(url: string, timeoutMs = 15000): Promise<FetchResult> {
  const start = Date.now();

  // 时间戳破坏浏览器与代理缓存，保证每次抓取都是最新页面
  const cacheBuster = `?_t=${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  for (const proxy of CORS_PROXIES) {
    const proxyUrl = proxy.build(url) + cacheBuster;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(proxyUrl, {
        signal: controller.signal,
        cache: "no-store",
        headers: {
          Accept: proxy.isMarkdown
            ? "text/plain,text/markdown,*/*"
            : "text/html,application/xhtml+xml,*/*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          // jina.ai 服务端有内部缓存，加这个头强制实时抓取，绕过 jina 缓存
          "X-No-Cache": "true",
        },
      });
      clearTimeout(timer);

      if (!res.ok) {
        continue;
      }

      const raw = await res.text();
      if (!raw || raw.length < 200) {
        continue;
      }

      let content: string;
      let title = "";

      if (proxy.isMarkdown) {
        // jina.ai 返回 Markdown，清理后直接用
        const cleaned = cleanMarkdown(raw);
        content = cleaned.content;
        title = cleaned.title;
      } else {
        // 其他代理返回 HTML，需提取正文
        const extracted = extractContent(raw);
        content = extracted.content;
        title = extracted.title;
      }

      if (content.length < 50) {
        continue;
      }

      return {
        success: true,
        content,
        title,
        charCount: content.length,
        proxyUsed: proxy.name,
        elapsed: Date.now() - start,
      };
    } catch {
      // 继续尝试下一个代理
      continue;
    }
  }

  return {
    success: false,
    content: "",
    title: "",
    charCount: 0,
    elapsed: Date.now() - start,
    error: "所有代理均抓取失败，可能是目标站点限制访问或网络问题，请手动粘贴正文",
  };
}

/** 清理 jina.ai 返回的 Markdown，提取标题与正文 */
function cleanMarkdown(raw: string): { content: string; title: string } {
  let title = "";
  const titleMatch = raw.match(/^Title:\s*(.+)$/m);
  if (titleMatch) title = titleMatch[1].trim();

  // 移除 URL Source / Published Time 等元数据行
  let text = raw
    .replace(/^Title:.+$/m, "")
    .replace(/^URL Source:.+$/m, "")
    .replace(/^Published Time:.+$/m, "")
    .replace(/^Markdown Content:/m, "");

  // 移除图片、链接的 Markdown 语法（保留文字）
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  // 链接保留文本，删除 URL 部分
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // 删除剩余的 URL（纯 http/https 链接整行）
  text = text.replace(/^[\s]*https?:\/\/\S+[\s]*$/gm, "");
  // 删除任何括号中的 URL
  text = text.replace(/\([\s]*https?:\/\/[^\)]*\)[\s]*/g, "");
  // 删除所有剩余的裸 URL
  text = text.replace(/https?:\/\/\S+/g, "");
  // 移除标题标记 #
  text = text.replace(/^#{1,6}\s+/gm, "");
  // 移除列表标记
  text = text.replace(/^[\s]*[-*+]\s+/gm, "");
  // 移除引用
  text = text.replace(/^>\s+/gm, "");
  // 移除水平线
  text = text.replace(/^---+$/gm, "");
  // 移除代码块
  text = text.replace(/```[\s\S]*?```/g, "");
  // 移除残留的空链接标记 []
  text = text.replace(/\[\]\s*/g, "");

  // 清理空白
  text = text
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join("\n");

  // 截断
  if (text.length > 8000) text = text.slice(0, 8000);

  return { content: text, title };
}
