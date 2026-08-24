import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, ExternalLink, PanelLeftClose, PanelLeftOpen, MoreHorizontal } from "lucide-react";
import { useState } from "react";

import logoAsset from "@/assets/omniwork-mark.png.asset.json";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState<string[]>(() =>
    navItems
      .filter((i) => i.children?.some((c) => c.url === pathname))
      .map((i) => i.title),
  );

  const toggleGroup = (title: string) =>
    setOpen((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-[248px]",
      )}
    >
      <div className="flex h-16 items-center gap-2 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/15">
          <img src={logoAsset.url} alt="WorkBoard logo" className="size-6 object-contain" />
        </div>
        {!collapsed && (
          <span className="truncate text-[15px] font-semibold tracking-tight">WorkBoard</span>
        )}
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="ml-auto rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <nav className="scrollbar-slim flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.external) {
            return (
              <a
                key={item.title}
                href={item.external}
                target="_blank"
                rel="noreferrer"
                title={item.title}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Icon className="size-[18px] shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.title}</span>
                    <ExternalLink className="ml-auto size-3.5 opacity-50" />
                  </>
                )}
              </a>
            );
          }

          if (item.children) {
            const expanded = open.includes(item.title) && !collapsed;
            const groupActive = item.children.some((c) => c.url === pathname);
            return (
              <div key={item.title}>
                <button
                  onClick={() => (collapsed ? onToggle() : toggleGroup(item.title))}
                  title={item.title}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    groupActive
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate">{item.title}</span>
                      <ChevronDown
                        className={cn(
                          "ml-auto size-4 transition-transform",
                          expanded && "rotate-180",
                        )}
                      />
                    </>
                  )}
                </button>
                {expanded && (
                  <div className="mt-1 space-y-0.5 border-l border-sidebar-border pl-3 ml-5">
                    {item.children.map((child) => (
                      <Link
                        key={child.url}
                        to={child.url}
                        className={cn(
                          "block rounded-md px-3 py-1.5 text-[13px] transition-colors",
                          pathname === child.url
                            ? "bg-sidebar-primary/15 font-medium text-sidebar-primary"
                            : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const active = pathname === item.url;
          return (
            <Link
              key={item.title}
              to={item.url!}
              title={item.title}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-primary/15 font-medium text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent">
          <Avatar className="size-9">
            <AvatarImage src="https://i.pravatar.cc/80?img=47" alt="Arlene Lane" />
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Arlene Lane</p>
                <p className="truncate text-xs text-sidebar-foreground/55">Super Admin</p>
              </div>
              <MoreHorizontal className="ml-auto size-4 text-sidebar-foreground/50" />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
