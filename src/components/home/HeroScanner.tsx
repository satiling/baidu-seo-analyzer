import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Radar, ChevronRight, AlertCircle } from "lucide-react";
import { parseUrl } from "@/engine";
import RadarBg from "@/components/ui/RadarBg";

const TYPING_LINES = [
  "> 初始化 Baiduspider 引擎...",
  "> 加载 2026 算法指纹库 [8/8]",
  "> 模式：URL 特征分析 + 风险信号检测_",
];

export default function HeroScanner() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError("请输入需要检测的网页 URL");
      return;
    }
    const parsed = parseUrl(trimmed);
    if (!parsed.valid) {
      setError(parsed.error || "URL 格式无效");
      return;
    }
    setError("");
    navigate(`/report?u=${encodeURIComponent(parsed.raw)}`);
  };

  return (
    <section className="relative overflow-hidden">
      {/* 雷达背景 */}
      <div className="pointer-events-none absolute inset-0">
        <RadarBg density={50} />
      </div>

      {/* 大型雷达环装饰 */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-0 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
        aria-hidden
      >
        <RadarRings />
      </div>

      <div className="container relative z-10 py-20 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 border border-radar-500/30 bg-radar-500/5 px-3 py-1 font-mono text-xs tracking-wider text-radar-300"
          >
            <span className="h-1.5 w-1.5 animate-pulse bg-pass-500" />
            2026 百度算法全量生效 · 实时检测
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display text-4xl font-black leading-tight tracking-tight text-white md:text-6xl"
          >
            <span className="text-gradient-radar">百度算法</span>
            <br className="md:hidden" />
            <span className="mx-2 text-slate-500">·</span>
            网页合规检测台
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 mb-10 inline-block bg-void-950/70 px-4 py-2 font-mono text-xs text-pass-400 shadow-glow-sm md:text-sm"
          >
            <Typewriter lines={TYPING_LINES} />
          </motion.div>

          {/* URL 输入框 */}
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-2xl flex-col gap-3"
          >
            <div className="panel panel-corner flex items-center gap-2 p-2">
              <Search className="ml-2 h-5 w-5 shrink-0 text-radar-500" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="输入网页 URL，例如 https://your-site.com/article"
                className="min-w-0 flex-1 bg-transparent py-3 font-mono text-sm text-radar-100 placeholder:text-slate-600 focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit" className="btn-primary shrink-0">
                <Radar className="h-4 w-4" />
                启动扫描
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 border border-alert-500/40 bg-alert-500/10 px-4 py-2 font-mono text-xs text-alert-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] text-slate-500">
              <span>示例：</span>
              {["example.com", "blog.yoursite.cn/guide", "shop.demo.net"].map(
                (s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setUrl(s)}
                    className="border border-slate-700/60 px-2 py-0.5 text-radar-500/80 transition-colors hover:border-radar-500/40 hover:text-radar-300"
                  >
                    {s}
                  </button>
                ),
              )}
            </div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs text-slate-500"
          >
            <span className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-radar-500" /> 八大算法全覆盖
            </span>
            <span className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-radar-500" /> 蜘蛛喜好度模拟
            </span>
            <span className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-radar-500" /> 收录与关键词预测
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/** 雷达环装饰 */
function RadarRings() {
  return (
    <div className="relative h-[640px] w-[640px]">
      {[200, 320, 440, 560].map((size, i) => (
        <div
          key={size}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-radar-500/15"
          style={{ width: size, height: size }}
        />
      ))}
      {/* 扫描线 */}
      <div
        className="absolute left-1/2 top-1/2 h-280 w-280 origin-left animate-radar-sweep"
        style={{
          width: 280,
          height: 1,
          background:
            "linear-gradient(90deg, rgba(0,229,255,0.6), transparent 80%)",
          transformOrigin: "left center",
        }}
      />
      {/* 中心点 */}
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-radar-400 shadow-glow" />
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-pulse-ring rounded-full border border-radar-400" />
    </div>
  );
}

/** 终端打字机 */
function Typewriter({ lines }: { lines: string[] }) {
  return (
    <div className="text-left">
      {lines.map((line, i) => (
        <div key={i} className="leading-relaxed">
          {line}
          {i === lines.length - 1 && (
            <span className="ml-0.5 inline-block h-3 w-1.5 animate-blink-cursor bg-pass-400 align-middle" />
          )}
        </div>
      ))}
    </div>
  );
}
