import { Link, NavLink } from "react-router-dom";
import { Radar, BookOpen, FileSearch, ScanText } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "检测入口", icon: FileSearch },
  { to: "/ai-detect", label: "AI 内容检测", icon: ScanText },
  { to: "/algorithms", label: "算法中心", icon: BookOpen },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-radar-500/15 bg-void-950/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="group flex items-center gap-3">
          <span className="relative grid h-9 w-9 place-items-center border border-radar-500/40 bg-radar-500/5">
            <Radar className="h-5 w-5 text-radar-400 animate-radar-sweep" />
            <span className="absolute inset-0 border border-radar-400/0 group-hover:border-radar-400/40 transition-colors" />
          </span>
          <div className="leading-tight">
            <div className="font-display text-sm font-bold tracking-widest text-radar-100">
              SPIDER RADAR
            </div>
            <div className="font-mono text-[10px] text-radar-700 tracking-wider">
              百度算法检测平台
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-4 py-2 font-mono text-sm tracking-wide transition-colors",
                  isActive
                    ? "text-radar-300 border-b border-radar-400"
                    : "text-slate-400 hover:text-radar-300 border-b border-transparent",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
