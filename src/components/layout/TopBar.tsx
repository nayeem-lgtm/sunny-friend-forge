import { useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Moon, Search, Sun } from "lucide-react";

import { pageTitles } from "@/lib/nav";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";

export function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const { signOut } = useAuth();
  const title = pageTitles[pathname] ?? "Overview";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur">
      <nav aria-label="Breadcrumb" className="text-sm">
        <span className="text-muted-foreground">ERP</span>
        <span className="mx-2 text-muted-foreground/60">›</span>
        <span className="font-medium text-foreground">{title}</span>
      </nav>

      <div className="ml-auto hidden w-72 items-center md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="h-9 rounded-full pl-9" />
        </div>
      </div>

      <button
        aria-label="Notifications"
        className="relative rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell className="size-4" />
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
          3
        </span>
      </button>

      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
    </header>
  );
}
