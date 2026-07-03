import { Link } from "react-router-dom";
import { Radar } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-radar-500/10 bg-void-950/60">
      <div className="container py-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center border border-radar-500/40">
              <Radar className="h-4 w-4 text-radar-400" />
            </span>
            <div>
              <div className="font-display text-xs font-bold tracking-widest text-radar-200">
                SPIDER RADAR
              </div>
              <div className="font-mono text-[10px] text-slate-500">
                依据 2026 百度最新算法体系 · 帮助站长提升权重与排名
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-slate-400">
            <Link to="/" className="hover:text-radar-300 transition-colors">
              检测入口
            </Link>
            <Link to="/ai-detect" className="hover:text-radar-300 transition-colors">
              AI 内容检测
            </Link>
            <Link to="/algorithms" className="hover:text-radar-300 transition-colors">
              算法中心
            </Link>
            <span className="text-slate-600">·</span>
            <span>本平台检测为前端模拟，结果仅供优化参考</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 font-mono text-[10px] text-slate-600">
          {[
            "飓风4.0",
            "清风5.0",
            "蓝天3.0",
            "闪电3.0",
            "惊雷算法",
            "ERNIE语义",
            "EEAT门槛",
            "动态沙盒",
          ].map((t) => (
            <span key={t} className="border border-slate-700/50 px-2 py-0.5">
              {t}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
