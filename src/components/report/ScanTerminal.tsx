import { useEffect, useRef, useState } from "react";
import { Terminal } from "lucide-react";

interface LogLine {
  text: string;
  type: "info" | "ok" | "warn" | "block";
}

/** 扫描终端：模拟蜘蛛抓取过程的逐行日志输出 */
export default function ScanTerminal({
  url,
  stage,
  progress,
  onDone,
}: {
  url: string;
  stage: string;
  progress: number;
  onDone?: () => void;
}) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  // 基于进度生成日志
  useEffect(() => {
    const target = buildLogs(url, progress, stage);
    setLines(target);
  }, [url, progress, stage]);

  useEffect(() => {
    if (progress >= 100 && !doneRef.current) {
      doneRef.current = true;
      onDone?.();
    }
  }, [progress, onDone]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="panel panel-corner overflow-hidden">
      <div className="flex items-center justify-between border-b border-radar-500/15 bg-void-950/60 px-4 py-2">
        <div className="flex items-center gap-2 font-mono text-xs text-radar-300">
          <Terminal className="h-4 w-4" />
          baiduspider@scan:~$
        </div>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-alert-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-glow/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-pass-500/70" />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-56 overflow-y-auto bg-void-950/80 p-4 font-mono text-xs leading-relaxed scanline-overlay"
      >
        {lines.map((line, i) => (
          <div key={i} className={colorFor(line.type)}>
            <span className="text-slate-600">{`[${String(i + 1).padStart(2, "0")}]`}</span>{" "}
            {line.text}
          </div>
        ))}
        {progress < 100 && (
          <div className="text-radar-300">
            <span className="animate-blink-cursor">▊</span>
          </div>
        )}
      </div>

      <div className="border-t border-radar-500/15 px-4 py-2">
        <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
          <span>{stage}</span>
          <span className="text-radar-400">{progress}%</span>
        </div>
        <div className="mt-1.5 h-1 w-full bg-void-700">
          <div
            className="h-full bg-gradient-to-r from-radar-600 to-radar-300 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function colorFor(type: LogLine["type"]): string {
  switch (type) {
    case "ok":
      return "text-pass-400";
    case "warn":
      return "text-amber-glow";
    case "block":
      return "text-alert-400";
    default:
      return "text-radar-200";
  }
}

function buildLogs(url: string, progress: number, stage: string): LogLine[] {
  const logs: LogLine[] = [];
  let domain = url;
  try {
    domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    /* keep raw */
  }

  logs.push({ text: `$ baiduspider --url="${url}" --algo=2026full`, type: "info" });
  logs.push({ text: `> 解析目标域名 ${domain} ...`, type: "info" });

  if (progress >= 8) logs.push({ text: `✓ DNS 解析成功，TTL 3600s`, type: "ok" });
  if (progress >= 22) logs.push({ text: `> 建立 HTTPS 连接，抓取首页 ...`, type: "info" });
  if (progress >= 22) logs.push({ text: `✓ HTTP/2 200 OK (text/html; charset=utf-8)`, type: "ok" });
  if (progress >= 38) logs.push({ text: `> 加载算法规则库 [8/8] ...`, type: "info" });
  if (progress >= 38) logs.push({ text: `· 飓风4.0 / 清风5.0 / 蓝天3.0 / 闪电3.0`, type: "info" });
  if (progress >= 38) logs.push({ text: `· 惊雷 / ERNIE / EEAT / 动态沙盒`, type: "info" });
  if (progress >= 54) logs.push({ text: `> 执行规则匹配，计算综合评分 ...`, type: "info" });
  if (progress >= 68) logs.push({ text: `> 模拟 Baiduspider 抓取行为序列 ...`, type: "info" });
  if (progress >= 82) logs.push({ text: `> 推演收录概率与沙盒状态 ...`, type: "info" });
  if (progress >= 92) logs.push({ text: `> 派生关键词并预测排名区间 ...`, type: "info" });
  if (progress >= 96) logs.push({ text: `> 生成整改清单 ...`, type: "info" });
  if (progress >= 100) {
    logs.push({ text: `✓ 检测完成，报告已生成`, type: "ok" });
    logs.push({ text: `$ ${stage}`, type: "info" });
  }
  return logs;
}
