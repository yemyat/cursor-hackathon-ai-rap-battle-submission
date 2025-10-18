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
    <nav className="fixed top-0 right-0 left-0 z-50 border-white/5 border-b bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-20 items-center justify-between">
          <Link
            className="group flex items-center gap-3 transition-transform duration-300 hover:scale-105"
            to="/battles"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-mint to-brand-cyan shadow-brand-mint/20 shadow-lg transition-all duration-300 group-hover:shadow-brand-mint/40 group-hover:shadow-xl">
              <Flame className="h-7 w-7 text-zinc-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-2xl text-zinc-50 leading-none tracking-tight">
                Rap Battles
              </span>
              <span className="font-medium text-brand-mint text-xs tracking-wide">
                AI SHOWDOWN
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              className={`group relative px-6 py-2.5 font-semibold text-sm transition-all duration-300 ${
                isActive("/battles")
                  ? "text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              to="/battles"
            >
              <span className="relative z-10">All Battles</span>
              {isActive("/battles") && (
                <div className="absolute inset-0 rounded-full bg-white/5 backdrop-blur-sm" />
              )}
              <div
                className={`-z-10 absolute inset-0 rounded-full bg-brand-purple/20 opacity-0 blur-xl transition-opacity duration-300 ${
                  isActive("/battles")
                    ? "opacity-100"
                    : "group-hover:opacity-50"
                }`}
              />
            </Link>

            <Link
              className="group relative overflow-hidden rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground text-sm shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-primary/40 hover:shadow-xl"
              to="/battles/create"
            >
              <span className="relative z-10">Create Battle</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
