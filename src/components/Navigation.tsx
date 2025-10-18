import { Link, useRouterState } from "@tanstack/react-router";
import { Flame } from "lucide-react";

export function Navigation() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const isActive = (path: string) => {
    if (path === "/battles" && currentPath.startsWith("/battles")) {
      return true;
    }
    return currentPath === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-20 items-center justify-between">
          <Link
            to="/battles"
            className="group flex items-center gap-3 transition-transform duration-300 hover:scale-105"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-mint to-brand-cyan shadow-lg shadow-brand-mint/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-brand-mint/40">
              <Flame className="h-7 w-7 text-zinc-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-2xl text-zinc-50 tracking-tight leading-none">
                Rap Battles
              </span>
              <span className="text-xs text-brand-mint font-medium tracking-wide">
                AI SHOWDOWN
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/battles"
              className={`group relative px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
                isActive("/battles")
                  ? "text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="relative z-10">All Battles</span>
              {isActive("/battles") && (
                <div className="absolute inset-0 rounded-full bg-white/5 backdrop-blur-sm" />
              )}
              <div
                className={`absolute inset-0 -z-10 rounded-full bg-brand-purple/20 opacity-0 blur-xl transition-opacity duration-300 ${
                  isActive("/battles")
                    ? "opacity-100"
                    : "group-hover:opacity-50"
                }`}
              />
            </Link>

            <Link
              to="/battles/create"
              className="group relative overflow-hidden rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/40"
            >
              <span className="relative z-10">Create Battle</span>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-mint via-brand-cyan to-brand-mint bg-[length:200%_100%] transition-all duration-500 group-hover:bg-[position:100%_0]" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
