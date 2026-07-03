/** URL 解析器：提取域名、协议、路径深度、备案推断 */

export interface ParsedUrl {
  valid: boolean;
  raw: string;
  protocol: "http" | "https";
  domain: string;
  path: string;
  pathDepth: number;
  isRegistered: boolean;
  error?: string;
}

/** 常见已备案域名后缀（演示用推断规则） */
const REGISTERED_TLDS = new Set([".cn", ".com.cn", ".com", ".net.cn"]);

export function parseUrl(input: string): ParsedUrl {
  const raw = input.trim();
  if (!raw) {
    return {
      valid: false,
      raw,
      protocol: "https",
      domain: "",
      path: "",
      pathDepth: 0,
      isRegistered: false,
      error: "URL 不能为空",
    };
  }

  let withProto = raw;
  if (!/^https?:\/\//i.test(withProto)) {
    withProto = "https://" + withProto;
  }

  try {
    const u = new URL(withProto);
    const protocol = u.protocol === "http:" ? "http" : "https";
    const domain = u.hostname;
    const path = u.pathname || "/";
    const pathDepth = path.split("/").filter(Boolean).length;

    // 备案推断：.cn/.com.cn 大概率已备案；.com/.net.cn 中等概率
    const tld = domain.match(/\.[a-z]+$/i)?.[0]?.toLowerCase() || "";
    const isRegistered = REGISTERED_TLDS.has(tld) || domain.endsWith(".cn");

    return {
      valid: true,
      raw,
      protocol,
      domain,
      path,
      pathDepth,
      isRegistered,
    };
  } catch {
    return {
      valid: false,
      raw,
      protocol: "https",
      domain: "",
      path: "",
      pathDepth: 0,
      isRegistered: false,
      error: "URL 格式无效，请输入完整的网页地址",
    };
  }
}
