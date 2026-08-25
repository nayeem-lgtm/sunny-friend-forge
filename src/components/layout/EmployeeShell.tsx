import { type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeftRight, LogOut, Moon, Sun } from "lucide-react";

import logoAsset from "@/assets/omniwork-mark.png.asset.json";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/use-theme";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initials } from "@/lib/leave-data";
import {
  activeEmployees,
  employeeNav,
  employeePageTitles,
  fullName,
  useEmployeeSession,
} from "@/lib/employee-session";
import { usePortalRole } from "@/lib/portal-role";

export function EmployeeShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { employee, name, select } = useEmployeeSession();
  const { theme, toggle } = useTheme();
  const { signOut } = useAuth();
  const { isEmployee } = usePortalRole();
  const title = employeePageTitles[pathname] ?? "My Dashboard";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 z-30 hidden h-screen w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-16 items-center gap-2 px-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/15">
            <img src={logoAsset.url} alt="OmniWork logo" className="size-6 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight">OmniWork</p>
            <p className="truncate text-[11px] text-sidebar-foreground/55">Employee Portal</p>
          </div>
        </div>

        <nav className="scrollbar-slim flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {employeeNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.url;
            return (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary/15 font-medium text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          {!isEmployee && (
            <Link
              to="/"
              className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <ArrowLeftRight className="size-4" /> Switch to admin panel
            </Link>
          )}
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="size-9">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
              <AvatarFallback>{initials(name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-sidebar-foreground/55">{employee.designation}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <nav aria-label="Breadcrumb" className="min-w-0 text-sm">
            <span className="text-muted-foreground">Employee</span>
            <span className="mx-2 text-muted-foreground/60">›</span>
            <span className="font-medium text-foreground">{title}</span>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {isEmployee ? (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {name} · {employee.department}
              </span>
            ) : (
              <Select value={employee.id} onValueChange={select}>
                <SelectTrigger className="h-9 w-[190px]" aria-label="Viewing as employee">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {activeEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {fullName(e)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-destructive"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 lg:hidden">
          {employeeNav.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs",
                pathname === item.url
                  ? "bg-primary/15 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
