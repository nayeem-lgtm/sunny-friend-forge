import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { roleTypes } from "@/lib/employee-data";
import { cn } from "@/lib/utils";

type Action = "view" | "create" | "update" | "delete" | "base";

type Feature = {
  key: string;
  name: string;
  slug: string;
  /** actions that do not apply to this feature */
  disabled?: Action[];
  legacy?: boolean;
};

const features: Feature[] = [
  { key: "announcements", name: "Announcements", slug: "feature-announcements", legacy: true },
  { key: "attendance", name: "Attendance", slug: "feature-attendance", legacy: true },
  { key: "worklogs", name: "Worklogs", slug: "feature-worklogs", legacy: true },
  { key: "departments", name: "Departments & Role", slug: "feature-department-role", legacy: true },
  { key: "employee", name: "Employee", slug: "feature-employee", legacy: true },
  { key: "leave", name: "Leave", slug: "feature-leave", legacy: true },
  {
    key: "monitoring",
    name: "Monitoring",
    slug: "feature-monitoring",
    disabled: ["create", "update", "delete"],
    legacy: true,
  },
  { key: "payroll", name: "Payroll", slug: "feature-payroll", legacy: true },
  { key: "workboard", name: "Workboard", slug: "feature-workboard", legacy: true },
  { key: "schedules", name: "Schedules", slug: "feature-schedules", legacy: true },
  { key: "kpi", name: "Employee KPI", slug: "feature-kpi", legacy: true },
  {
    key: "monitoring-elevated",
    name: "Monitoring (elevated)",
    slug: "feature-monitoring:elevated",
    disabled: ["view", "create", "update", "delete"],
  },
  {
    key: "user-access",
    name: "User Access",
    slug: "feature-user-access",
    disabled: ["create", "delete"],
  },
];

const actions: { key: Action; label: string }[] = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "update", label: "Update" },
  { key: "delete", label: "Delete" },
  { key: "base", label: "Base access" },
];

type Matrix = Record<string, Record<Action, boolean>>;

function defaultsFor(role: string): Matrix {
  const admin = role === "Admin";
  const manager = role === "Manager";
  const out: Matrix = {};
  for (const f of features) {
    out[f.key] = {
      view: admin || manager || !["payroll", "monitoring-elevated", "user-access"].includes(f.key),
      create: admin || (manager && ["workboard", "announcements", "schedules"].includes(f.key)),
      update: admin || (manager && ["workboard", "attendance", "leave"].includes(f.key)),
      delete: admin,
      base: admin || manager || !["payroll", "monitoring-elevated", "user-access"].includes(f.key),
    };
  }
  return out;
}

function Page() {
  const [role, setRole] = useState<string>("Manager");
  const [query, setQuery] = useState("");
  const [state, setState] = useState<Record<string, Matrix>>(() => ({
    Manager: defaultsFor("Manager"),
  }));

  const matrix = state[role] ?? defaultsFor(role);

  const rows = useMemo(
    () =>
      features.filter(
        (f) =>
          f.name.toLowerCase().includes(query.toLowerCase()) ||
          f.slug.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const setMatrix = (next: Matrix) => setState((s) => ({ ...s, [role]: next }));

  const toggle = (featureKey: string, action: Action) => {
    const current = matrix[featureKey]!;
    const value = !current[action];
    const updated: Record<Action, boolean> =
      action === "base" && !value
        ? { view: false, create: false, update: false, delete: false, base: false }
        : { ...current, [action]: value, ...(value && action !== "base" ? { base: true } : {}) };
    setMatrix({ ...matrix, [featureKey]: updated });
  };

  const bulk = (action: Action, value: boolean) => {
    const next: Matrix = { ...matrix };
    for (const f of rows) {
      if (f.disabled?.includes(action)) continue;
      next[f.key] = { ...next[f.key]!, [action]: value };
      if (value) next[f.key]!.base = true;
    }
    setMatrix(next);
  };

  const enabledCount = Object.values(matrix).filter((m) => m.base).length;

  return (
    <AppShell>
      <PageHeader
        title="User Access"
        description="Turn feature access on or off per role across every OmniWork module."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="h-9 w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleTypes.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search feature"
            className="h-9 w-60 pl-8"
          />
        </div>

        <Badge variant="secondary" className="gap-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          {enabledCount}/{features.length} features enabled
        </Badge>

        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => bulk("base", true)}>
            Enable all
          </Button>
          <Button variant="outline" size="sm" onClick={() => bulk("base", false)}>
            Disable all
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMatrix(defaultsFor(role))}>
            Reset
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[minmax(200px,1.6fr)_repeat(5,minmax(110px,1fr))] items-center gap-2 border-b border-border bg-muted/40 px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <div>Feature</div>
          {actions.map((a) => (
            <div key={a.key} className="flex items-center justify-center gap-2">
              <span>{a.label}</span>
              <button
                type="button"
                onClick={() => bulk(a.key, true)}
                className="text-[10px] normal-case text-primary hover:underline"
              >
                all
              </button>
            </div>
          ))}
        </div>

        {rows.map((f) => (
          <div
            key={f.key}
            className="grid grid-cols-[minmax(200px,1.6fr)_repeat(5,minmax(110px,1fr))] items-center gap-2 border-b border-border/60 px-4 py-3 last:border-0 hover:bg-muted/20"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{f.name}</div>
              <div className="truncate text-xs text-muted-foreground">{f.slug}</div>
            </div>
            {actions.map((a) => {
              const off = f.disabled?.includes(a.key);
              if (off) {
                return (
                  <div key={a.key} className="text-center text-sm text-muted-foreground">
                    —
                  </div>
                );
              }
              const on = matrix[f.key]![a.key];
              return (
                <div key={a.key} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <Switch checked={on} onCheckedChange={() => toggle(f.key, a.key)} />
                    <span
                      className={cn(
                        "w-7 text-xs font-medium",
                        on ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {on ? "ON" : "OFF"}
                    </span>
                  </div>
                  {a.key === "base" && f.legacy ? (
                    <Badge variant="outline" className="h-4 px-1 text-[9px] text-muted-foreground">
                      Legacy
                    </Badge>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/user-access")({
  head: () => ({
    meta: [
      { title: "User Access — OmniWork" },
      { name: "description", content: "Toggle feature-level access for every role in OmniWork." },
      { property: "og:title", content: "User Access — OmniWork" },
      {
        property: "og:description",
        content: "Toggle feature-level access for every role in OmniWork.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
