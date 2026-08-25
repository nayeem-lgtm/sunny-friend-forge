import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Check,
  Clock,
  Coffee,
  FileText,
  Gauge,
  ListChecks,
  Mail,
  Send,

  Scale,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { departments, employees } from "@/lib/employee-data";
import {
  buildKpiEmailHtml,
  buildKpiEmailText,
  defaultKpiEmailSettings,
  employeeEmail,
  fillSubject,
  loadKpiEmailHistory,
  loadKpiEmailSettings,
  nextSendDate,
  saveKpiEmailHistory,
  saveKpiEmailSettings,
  type KpiEmailRecord,
  type KpiEmailSettings,
} from "@/lib/kpi-email";
import { cn } from "@/lib/utils";

import {
  buildAlerts,
  buildDataset,
  computeAll,
  defaultKpiSettings,
  formatDate,
  formatDateTime,
  kpiTrend,
  loadAdjustments,
  loadAudit,
  loadDisputes,
  loadKpiSettings,
  periodPresets,
  resolvePeriod,
  saveAdjustments,
  saveAudit,
  saveDisputes,
  saveKpiSettings,
  tierFor,
  trendDirection,
  type AuditEntry,
  type EmployeeKpi,
  type KpiAdjustment,
  type KpiDispute,
  type KpiSettings,
  type PeriodPreset,
} from "@/lib/kpi-data";

export const Route = createFileRoute("/kpi-reports")({
  head: () => ({
    meta: [
      { title: "Employee KPI — OmniWork" },
      {
        name: "description",
        content:
          "100-point employee KPI scoring across attendance, work hours, breaks, work logs and task performance.",
      },
      { property: "og:title", content: "Employee KPI — OmniWork" },
      {
        property: "og:description",
        content:
          "100-point employee KPI scoring across attendance, work hours, breaks, work logs and task performance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const CATEGORY_ICONS: Record<string, typeof Clock> = {
  attendance: Clock,
  workHours: Gauge,
  breaks: Coffee,
  workLogs: FileText,
  tasks: ListChecks,
};

function ScoreRing({ score, size = 132 }: { score: number; size?: number }) {
  const tier = tierFor(score);
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={10} className="stroke-secondary" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={10}
          strokeLinecap="round"
          fill="none"
          className="stroke-primary transition-[stroke-dashoffset] duration-500"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight">{score.toFixed(1)}</span>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">/ 100</span>
        <span className="mt-0.5 text-[11px] font-medium text-primary">{tier.label}</span>
      </div>
    </div>
  );
}

function TierPill({ score }: { score: number }) {
  const t = tierFor(score);
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-medium", t.tone)}>
      Tier {t.tier} · {t.label}
    </span>
  );
}

function CategoryCard({
  icon: Icon,
  label,
  score,
  max,
  detail,
}: {
  icon: typeof Clock;
  label: string;
  score: number;
  max: number;
  detail: string;
}) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {score.toFixed(1)}
        <span className="ml-1 text-sm font-normal text-muted-foreground">/ {max}</span>
      </p>
      <Progress value={pct} className="mt-3 h-1.5" />
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function Page() {
  const today = useMemo(() => new Date(), []);
  const dataset = useMemo(() => buildDataset(today), [today]);

  const [settings, setSettings] = useState<KpiSettings>(defaultKpiSettings);
  const [disputes, setDisputes] = useState<KpiDispute[]>([]);
  const [adjustments, setAdjustments] = useState<KpiAdjustment[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  useEffect(() => {
    setSettings(loadKpiSettings());
    setDisputes(loadDisputes());
    setAdjustments(loadAdjustments());
    setAudit(loadAudit());
  }, []);

  const [preset, setPreset] = useState<PeriodPreset>("thisMonth");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [dept, setDept] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<EmployeeKpi | null>(null);

  const range = useMemo(() => {
    if (preset === "custom" && customFrom && customTo)
      return { from: new Date(`${customFrom}T00:00:00`), to: new Date(`${customTo}T00:00:00`) };
    return resolvePeriod(preset, today);
  }, [preset, customFrom, customTo, today]);

  const all = useMemo(
    () => computeAll(dataset, range.from, range.to, settings, adjustments),
    [dataset, range, settings, adjustments],
  );

  const filtered = useMemo(
    () =>
      all.filter(
        (k) =>
          (dept === "all" || k.department === dept) &&
          (employeeFilter === "all" || k.name === employeeFilter) &&
          k.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [all, dept, employeeFilter, search],
  );

  const teamAvg = filtered.length
    ? +(filtered.reduce((a, k) => a + k.total, 0) / filtered.length).toFixed(1)
    : 0;

  const focus = detail ?? filtered[0] ?? all[0];
  const trend = useMemo(
    () => (focus ? kpiTrend(focus.name, dataset, today, settings) : []),
    [focus, dataset, today, settings],
  );
  const direction = trendDirection(trend);
  const alerts = useMemo(() => buildAlerts(filtered, settings), [filtered, settings]);

  const catAvg = ["attendance", "workHours", "breaks", "workLogs", "tasks"].map((key) => {
    const rows = filtered.map((k) => k.categories.find((c) => c.key === key)!);
    const max = rows[0]?.max ?? 0;
    const score = rows.length ? rows.reduce((a, c) => a + c.score, 0) / rows.length : 0;
    return { key, label: rows[0]?.label ?? key, score: +score.toFixed(1), max };
  });

  /* --------------------------- actions --------------------------- */

  const logAudit = (action: string, target: string) => {
    const entry: AuditEntry = {
      id: `aud-${Date.now()}`,
      actor: "Arlene Lane",
      action,
      target,
      at: new Date().toISOString(),
    };
    const next = [entry, ...audit];
    setAudit(next);
    saveAudit(next);
  };

  const decideDispute = (id: string, status: "Approved" | "Rejected", note: string) => {
    const next = disputes.map((d) =>
      d.id === id ? { ...d, status, decisionNote: note, decidedAt: new Date().toISOString() } : d,
    );
    setDisputes(next);
    saveDisputes(next);
    const d = disputes.find((x) => x.id === id)!;
    logAudit(`Dispute ${status.toLowerCase()}: ${d.subject}`, d.employee);
    toast.success(`Dispute ${status.toLowerCase()}`, {
      description:
        status === "Approved" ? "KPI recalculated for the affected event." : "No KPI change applied.",
    });
    if (status === "Approved") addAdjustment(d.employee, settings.deductionUnit, `Approved dispute: ${d.subject}`);
  };

  const addAdjustment = (employee: string, amount: number, reason: string) => {
    const adj: KpiAdjustment = {
      id: `adj-${Date.now()}`,
      employee,
      amount,
      reason,
      adjustedBy: "Arlene Lane",
      at: new Date().toISOString(),
      status: "Applied",
    };
    const next = [adj, ...adjustments];
    setAdjustments(next);
    saveAdjustments(next);
    logAudit(`KPI adjustment ${amount > 0 ? "+" : ""}${amount}`, employee);
  };

  const revertAdjustment = (id: string) => {
    const next = adjustments.map((a) => (a.id === id ? { ...a, status: "Reverted" as const } : a));
    setAdjustments(next);
    saveAdjustments(next);
    const a = adjustments.find((x) => x.id === id)!;
    logAudit("Reverted KPI adjustment", a.employee);
    toast.success("Adjustment reverted");
  };

  const updateSettings = (patch: Partial<KpiSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveKpiSettings(next);
  };

  const exportCsv = () => {
    const head = [
      "Employee",
      "Employee ID",
      "Department",
      "Attendance",
      "Work Hours",
      "Breaks",
      "Work Logs",
      "Tasks",
      "Total",
      "Tier",
    ];
    const rows = filtered.map((k) => [
      k.name,
      k.employeeId,
      k.department,
      ...k.categories.map((c) => c.score),
      k.total,
      k.tier.label,
    ]);
    const csv = [head, ...rows].map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `kpi-${formatDate(range.from)}-${formatDate(range.to)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("KPI report exported");
  };

  /* --------------------------- render ---------------------------- */

  return (
    <AppShell>
      <PageHeader
        title="Employee KPI"
        description="Automatic 100-point scoring from attendance, work hours, breaks, work logs and task performance."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <BarChart3 className="mr-2 size-4" /> Export report
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          {periodPresets.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                preset === p.key
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-[160px]"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-[160px]"
              />
            </div>
          )}
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              {employees
                .filter((e) => e.status !== "Inactive")
                .map((e) => (
                  <SelectItem key={e.id} value={`${e.firstName} ${e.lastName}`}>
                    {e.firstName} {e.lastName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search employee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[220px]"
          />
          <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {formatDate(range.from)} → {formatDate(range.to)}
          </span>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-5 flex flex-wrap">
          <TabsTrigger value="dashboard">KPI Dashboard</TabsTrigger>
          <TabsTrigger value="employees">Employee KPI</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments & Audit</TabsTrigger>
          <TabsTrigger value="email">Email Reports</TabsTrigger>
          <TabsTrigger value="settings">KPI Settings</TabsTrigger>
        </TabsList>


        {/* ---------------- Dashboard ---------------- */}
        <TabsContent value="dashboard" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                {focus ? focus.name : "Team"} · overall score
              </p>
              <div className="mt-4 flex justify-center">
                <ScoreRing score={focus?.total ?? teamAvg} />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Team average</span>
                <span className="font-medium">{teamAvg} / 100</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Trend</span>
                <span
                  className={cn(
                    "flex items-center gap-1 font-medium",
                    direction === "Improving"
                      ? "text-success"
                      : direction === "Declining"
                        ? "text-destructive"
                        : "text-muted-foreground",
                  )}
                >
                  {direction === "Improving" ? (
                    <TrendingUp className="size-3.5" />
                  ) : direction === "Declining" ? (
                    <TrendingDown className="size-3.5" />
                  ) : (
                    <Activity className="size-3.5" />
                  )}
                  {direction}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(focus?.categories ?? []).map((c) => (
                <CategoryCard
                  key={c.key}
                  icon={CATEGORY_ICONS[c.key] ?? Activity}
                  label={c.label}
                  score={c.score}
                  max={c.max}
                  detail={c.detail}
                />
              ))}
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Performance tier</p>
                  <Sparkles className="size-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {focus ? focus.tier.label : "—"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Deduction unit {settings.deductionUnit} pts · tiers 95 / 90 / 80
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-4 text-sm font-medium">KPI trend — {focus?.name}</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="kpiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis domain={[60, 100]} tickLine={false} axisLine={false} className="text-xs" />
                  <RTooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#kpiGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-4 text-sm font-medium">Category averages across selection</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={catAvg}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    className="text-[10px]"
                    tickFormatter={(v: string) => v.split(" ")[0]!}
                  />
                  <YAxis tickLine={false} axisLine={false} className="text-xs" />
                  <RTooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {catAvg.map((c) => (
                      <Cell
                        key={c.key}
                        fill={
                          c.score / c.max > 0.9 ? "hsl(var(--primary))" : "hsl(var(--warning))"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {focus && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-4 text-sm font-medium">
                Task &amp; work performance breakdown — {focus.name} (60 pts)
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ["On-time completion", focus.taskBreakdown.onTime, settings.taskWeights.onTime],
                  ["Completion rate", focus.taskBreakdown.completion, settings.taskWeights.completion],
                  ["Work quality", focus.taskBreakdown.quality, settings.taskWeights.quality],
                  ["Priority compliance", focus.taskBreakdown.priority, settings.taskWeights.priority],
                  ["Task efficiency", focus.taskBreakdown.efficiency, settings.taskWeights.efficiency],
                ].map(([label, score, max]) => (
                  <div key={label as string} className="rounded-lg border border-border bg-secondary/40 p-4">
                    <p className="text-xs text-muted-foreground">{label as string}</p>
                    <p className="mt-1 text-xl font-semibold">
                      {(score as number).toFixed(1)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        / {max as number}
                      </span>
                    </p>
                    <Progress
                      value={((score as number) / (max as number)) * 100}
                      className="mt-2 h-1.5"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ---------------- Employee KPI ---------------- */}
        <TabsContent value="employees">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-3 py-3 text-right">Attend.</th>
                  <th className="px-3 py-3 text-right">Hours</th>
                  <th className="px-3 py-3 text-right">Breaks</th>
                  <th className="px-3 py-3 text-right">Logs</th>
                  <th className="px-3 py-3 text-right">Tasks</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Tier</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((k) => (
                  <tr
                    key={k.name}
                    onClick={() => setDetail(k)}
                    className="cursor-pointer border-t border-border transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{k.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {k.employeeId} · {k.designation}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{k.department}</td>
                    {k.categories.map((c) => (
                      <td key={c.key} className="px-3 py-3 text-right tabular-nums">
                        {c.score.toFixed(1)}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                      {k.total.toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      <TierPill score={k.total} />
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      No employees match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ---------------- Rankings ---------------- */}
        <TabsContent value="rankings">
          <div className="grid gap-4 lg:grid-cols-3">
            {filtered.slice(0, 3).map((k, i) => (
              <div
                key={k.name}
                className={cn(
                  "rounded-xl border p-5",
                  i === 0 ? "border-primary/40 bg-primary/10" : "border-border bg-card",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Rank #{i + 1}</span>
                  <Trophy className={cn("size-4", i === 0 ? "text-primary" : "text-muted-foreground")} />
                </div>
                <p className="mt-2 text-lg font-semibold">{k.name}</p>
                <p className="text-xs text-muted-foreground">{k.department}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{k.total.toFixed(1)}</p>
                <div className="mt-2">
                  <TierPill score={k.total} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Rank</th>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Position</th>
                  <th className="px-4 py-3 text-right">KPI</th>
                  <th className="px-4 py-3 text-left">Performance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((k, i) => (
                  <tr key={k.name} className="border-t border-border">
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{k.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{k.department}</td>
                    <td className="px-4 py-3 text-muted-foreground">{k.designation}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {k.total.toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      <TierPill score={k.total} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ---------------- Alerts ---------------- */}
        <TabsContent value="alerts">
          <div className="space-y-2">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                    a.severity === "high"
                      ? "bg-destructive/15 text-destructive"
                      : a.severity === "medium"
                        ? "bg-warning/15 text-warning"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  <AlertTriangle className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {a.employee} · <span className="text-muted-foreground">{a.type} alert</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{a.message}</p>
                </div>
              </div>
            ))}
            {!alerts.length && (
              <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                No KPI alerts for this period.
              </div>
            )}
          </div>
        </TabsContent>

        {/* ---------------- Disputes ---------------- */}
        <TabsContent value="disputes">
          <DisputeList disputes={disputes} onDecide={decideDispute} />
        </TabsContent>

        {/* ---------------- Adjustments & audit ---------------- */}
        <TabsContent value="adjustments" className="space-y-5">
          <AdjustmentForm onAdd={(e, amt, reason) => {
            addAdjustment(e, amt, reason);
            toast.success("KPI adjustment applied");
          }} />
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-right">Adjustment</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-left">Adjusted by</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{a.employee}</td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-semibold tabular-nums",
                        a.amount >= 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {a.amount > 0 ? "+" : ""}
                      {a.amount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.reason}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.adjustedBy}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(a.at)}</td>
                    <td className="px-4 py-3 text-right">
                      {a.status === "Applied" ? (
                        <Button size="sm" variant="outline" onClick={() => revertAdjustment(a.id)}>
                          Revert
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Reverted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 text-primary" /> KPI audit log
            </p>
            <div className="space-y-2">
              {audit.map((a) => (
                <div key={a.id} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0">
                  <span>
                    <span className="font-medium">{a.actor}</span>{" "}
                    <span className="text-muted-foreground">{a.action} —</span>{" "}
                    <span>{a.target}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(a.at)}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ---------------- Email reports ---------------- */}
        <TabsContent value="email">
          <EmailReportsPanel
            kpis={filtered}
            periodLabel={`${formatDate(range.from)} → ${formatDate(range.to)}`}
            today={today}
            previousScore={(name) => {
              const t = kpiTrend(name, dataset, today, settings);
              return t.length > 1 ? t[t.length - 2]!.score : null;
            }}
            onLog={(count) => logAudit(`Emailed KPI report to ${count} employee(s)`, "KPI reports")}
          />
        </TabsContent>

        {/* ---------------- Settings ---------------- */}
        <TabsContent value="settings">
          <KpiSettingsPanel settings={settings} onChange={updateSettings} />
        </TabsContent>
      </Tabs>


      {/* Employee detail */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {detail.name} — monthly KPI report
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
                <div className="flex flex-col items-center gap-2">
                  <ScoreRing score={detail.total} size={150} />
                  <TierPill score={detail.total} />
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <Field label="Employee ID" value={detail.employeeId} />
                  <Field label="Position" value={detail.designation} />
                  <Field label="Department" value={detail.department} />
                  <Field label="Manager" value="Arlene Lane" />
                  <Field
                    label="Reporting period"
                    value={`${formatDate(range.from)} → ${formatDate(range.to)}`}
                  />
                  <Field label="Trend" value={direction} />
                </div>
              </div>

              <ReportBlock title="Attendance" rows={[
                ["Scheduled days", detail.attendance.scheduledDays],
                ["Present days", detail.attendance.presentDays],
                ["Absent days", detail.attendance.absentDays],
                ["Equivalent absent days (rules)", detail.attendance.equivalentAbsentDays],
                ["From late days (2 late = 1 absent)", detail.attendance.absenceBreakdown.fromLate],
                ["From incomplete hours", detail.attendance.absenceBreakdown.fromShortHours],
                ["From missing work logs (3 = 1 absent)", detail.attendance.absenceBreakdown.fromWorkLogs],
                ["From denied-leave no-shows (×2)", detail.attendance.absenceBreakdown.fromDeniedLeave],
                ["Late days", detail.attendance.lateDays],
                ["Total late minutes", detail.attendance.lateMinutes],
                ["Early clock-outs", detail.attendance.earlyOuts],
                ["Total early minutes", detail.attendance.earlyMinutes],
              ]} />
              <ReportBlock title="Productivity" rows={[
                ["Scheduled hours", detail.productivity.scheduledHours],
                ["Actual hours", detail.productivity.actualHours],
                ["Productive hours", detail.productivity.productiveHours],
                ["Idle hours", detail.productivity.idleHours],
                ["Productivity %", `${detail.productivity.productivityPct}%`],
              ]} />
              <ReportBlock title="Breaks" rows={[
                ["Total breaks", detail.breaks.total],
                ["Allowed break time", `${detail.breaks.allowedMinutes}m`],
                ["Actual break time", `${detail.breaks.actualMinutes}m`],
                ["Excess break time", `${detail.breaks.excessMinutes}m`],
                ["Break violations", detail.breaks.violations],
              ]} />
              <ReportBlock title="Work logs" rows={[
                ["Required", detail.workLogs.required],
                ["Submitted", detail.workLogs.submitted],
                ["Missing", detail.workLogs.missing],
                ["Late", detail.workLogs.late],
              ]} />
              <ReportBlock title="Tasks" rows={[
                ["Assigned", detail.tasks.assigned],
                ["Completed", detail.tasks.completed],
                ["Completed on time", detail.tasks.onTime],
                ["Completed late", detail.tasks.late],
                ["Overdue", detail.tasks.overdue],
                ["Cancelled", detail.tasks.cancelled],
                ["Completion rate", `${detail.tasks.completionRate}%`],
                ["On-time rate", `${detail.tasks.onTimeRate}%`],
                ["Quality score", `${detail.tasks.quality}%`],
              ]} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function ReportBlock({ title, rows }: { title: string; rows: [string, string | number][] }) {
  return (
    <div className="mt-4 rounded-xl border border-border p-4">
      <p className="mb-3 text-sm font-medium">{title}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-1.5 text-sm">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-medium tabular-nums">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DisputeList({
  disputes,
  onDecide,
}: {
  disputes: KpiDispute[];
  onDecide: (id: string, status: "Approved" | "Rejected", note: string) => void;
}) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  return (
    <div className="space-y-3">
      {disputes.map((d) => (
        <div key={d.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{d.subject}</p>
              <p className="text-xs text-muted-foreground">
                {d.employee} · {d.category} · submitted {formatDateTime(d.submittedAt)}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                d.status === "Pending"
                  ? "border-warning/30 bg-warning/15 text-warning"
                  : d.status === "Approved"
                    ? "border-success/30 bg-success/15 text-success"
                    : "border-destructive/30 bg-destructive/15 text-destructive",
              )}
            >
              {d.status}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{d.reason}</p>
          {d.status === "Pending" ? (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Decision note for the employee…"
                value={notes[d.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onDecide(d.id, "Approved", notes[d.id] ?? "")}>
                  <Check className="mr-1.5 size-4" /> Approve & recalculate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDecide(d.id, "Rejected", notes[d.id] ?? "")}
                >
                  <X className="mr-1.5 size-4" /> Reject
                </Button>
              </div>
            </div>
          ) : (
            d.decisionNote && (
              <p className="mt-3 rounded-md bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                {d.decisionNote} · decided {d.decidedAt ? formatDateTime(d.decidedAt) : "—"}
              </p>
            )
          )}
        </div>
      ))}
      {!disputes.length && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No KPI disputes submitted.
        </div>
      )}
    </div>
  );
}

function AdjustmentForm({
  onAdd,
}: {
  onAdd: (employee: string, amount: number, reason: string) => void;
}) {
  const active = employees.filter((e) => e.status !== "Inactive");
  const [employee, setEmployee] = useState(`${active[0]?.firstName} ${active[0]?.lastName}`);
  const [amount, setAmount] = useState("4.9");
  const [reason, setReason] = useState("");

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Scale className="size-4 text-primary" /> Apply a manager KPI adjustment
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={employee} onValueChange={setEmployee}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {active.map((e) => (
              <SelectItem key={e.id} value={`${e.firstName} ${e.lastName}`}>
                {e.firstName} {e.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          step="0.1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-[120px]"
        />
        <Input
          placeholder="Reason (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-w-[260px] flex-1"
        />
        <Button
          onClick={() => {
            const amt = Number(amount);
            if (!reason.trim() || Number.isNaN(amt)) {
              toast.error("Enter a valid amount and reason");
              return;
            }
            onAdd(employee, amt, reason.trim());
            setReason("");
          }}
        >
          Apply adjustment
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Employees cannot modify their own KPI. Every adjustment is written to the audit log.
      </p>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">
        <Input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-8 w-24 text-right"
        />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </span>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-32"
      />
    </label>
  );
}

function KpiSettingsPanel({
  settings,
  onChange,
}: {
  settings: KpiSettings;
  onChange: (patch: Partial<KpiSettings>) => void;
}) {
  const weightTotal =
    settings.weights.attendance +
    settings.weights.workHours +
    settings.weights.breaks +
    settings.weights.workLogs +
    settings.weights.tasks;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Settings2 className="size-4 text-primary" /> Category weights
        </p>
        <div className="space-y-2">
          <NumberField
            label="Attendance & punctuality"
            value={settings.weights.attendance}
            onChange={(v) => onChange({ weights: { ...settings.weights, attendance: v } })}
          />
          <NumberField
            label="Work hours & idle time"
            value={settings.weights.workHours}
            onChange={(v) => onChange({ weights: { ...settings.weights, workHours: v } })}
          />
          <NumberField
            label="Break management"
            value={settings.weights.breaks}
            onChange={(v) => onChange({ weights: { ...settings.weights, breaks: v } })}
          />
          <NumberField
            label="Work logs"
            value={settings.weights.workLogs}
            onChange={(v) => onChange({ weights: { ...settings.weights, workLogs: v } })}
          />
          <NumberField
            label="Task & work performance"
            value={settings.weights.tasks}
            onChange={(v) => onChange({ weights: { ...settings.weights, tasks: v } })}
          />
          <NumberField
            label="Deduction unit"
            step={0.1}
            value={settings.deductionUnit}
            onChange={(v) => onChange({ deductionUnit: v })}
            suffix="pts"
          />
        </div>
        <p
          className={cn(
            "mt-3 text-xs",
            weightTotal === 100 ? "text-muted-foreground" : "text-warning",
          )}
        >
          Total weight: {weightTotal} points {weightTotal !== 100 && "(should equal 100)"}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-medium">Task KPI components (60 pts)</p>
        <div className="space-y-2">
          <NumberField
            label="On-time completion"
            value={settings.taskWeights.onTime}
            onChange={(v) => onChange({ taskWeights: { ...settings.taskWeights, onTime: v } })}
          />
          <NumberField
            label="Completion rate"
            value={settings.taskWeights.completion}
            onChange={(v) => onChange({ taskWeights: { ...settings.taskWeights, completion: v } })}
          />
          <NumberField
            label="Work quality"
            value={settings.taskWeights.quality}
            onChange={(v) => onChange({ taskWeights: { ...settings.taskWeights, quality: v } })}
          />
          <NumberField
            label="Priority & deadline compliance"
            value={settings.taskWeights.priority}
            onChange={(v) => onChange({ taskWeights: { ...settings.taskWeights, priority: v } })}
          />
          <NumberField
            label="Task efficiency"
            value={settings.taskWeights.efficiency}
            onChange={(v) => onChange({ taskWeights: { ...settings.taskWeights, efficiency: v } })}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-medium">Attendance rules</p>
        <div className="space-y-2">
          <TextField
            label="Scheduled clock-in"
            value={settings.attendance.scheduleIn}
            onChange={(v) => onChange({ attendance: { ...settings.attendance, scheduleIn: v } })}
          />
          <TextField
            label="Scheduled clock-out"
            value={settings.attendance.scheduleOut}
            onChange={(v) => onChange({ attendance: { ...settings.attendance, scheduleOut: v } })}
          />
          <NumberField
            label="Grace period"
            suffix="min"
            value={settings.attendance.graceMinutes}
            onChange={(v) => onChange({ attendance: { ...settings.attendance, graceMinutes: v } })}
          />
          <NumberField
            label="Late violations before deduction"
            value={settings.attendance.allowedLate}
            onChange={(v) => onChange({ attendance: { ...settings.attendance, allowedLate: v } })}
          />
          <NumberField
            label="Early clock-outs before deduction"
            value={settings.attendance.allowedEarly}
            onChange={(v) => onChange({ attendance: { ...settings.attendance, allowedEarly: v } })}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-medium">Work hours, breaks & work logs</p>
        <div className="space-y-2">
          <NumberField
            label="Required daily hours"
            value={settings.workHours.requiredHours}
            onChange={(v) => onChange({ workHours: { ...settings.workHours, requiredHours: v } })}
            suffix="h"
          />
          <NumberField
            label="Idle threshold"
            suffix="min"
            value={settings.workHours.idleThresholdMinutes}
            onChange={(v) =>
              onChange({ workHours: { ...settings.workHours, idleThresholdMinutes: v } })
            }
          />
          <TextField
            label="Break window start"
            value={settings.breaks.windowStart}
            onChange={(v) => onChange({ breaks: { ...settings.breaks, windowStart: v } })}
          />
          <TextField
            label="Break window end"
            value={settings.breaks.windowEnd}
            onChange={(v) => onChange({ breaks: { ...settings.breaks, windowEnd: v } })}
          />
          <NumberField
            label="Allowed break duration"
            suffix="min"
            value={settings.breaks.allowedMinutes}
            onChange={(v) => onChange({ breaks: { ...settings.breaks, allowedMinutes: v } })}
          />
          <TextField
            label="Work log submission deadline"
            value={settings.workLogs.deadline}
            onChange={(v) => onChange({ workLogs: { ...settings.workLogs, deadline: v } })}
          />
          <NumberField
            label="Missing logs before deduction"
            value={settings.workLogs.allowedMissing}
            onChange={(v) => onChange({ workLogs: { ...settings.workLogs, allowedMissing: v } })}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
        <p className="mb-3 text-sm font-medium">Performance tiers</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <NumberField
            label="Exceptional from"
            value={settings.tiers.exceptional}
            onChange={(v) => onChange({ tiers: { ...settings.tiers, exceptional: v } })}
          />
          <NumberField
            label="Good from"
            value={settings.tiers.good}
            onChange={(v) => onChange({ tiers: { ...settings.tiers, good: v } })}
          />
          <NumberField
            label="Needs improvement from"
            value={settings.tiers.needsImprovement}
            onChange={(v) => onChange({ tiers: { ...settings.tiers, needsImprovement: v } })}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Below the last threshold the employee is classified Tier 4 — Unsatisfactory. Settings are
          saved automatically and applied to every recalculation.
        </p>
      </div>
    </div>
  );
}

/* ------------------------- Email reports ------------------------- */

function EmailReportsPanel({
  kpis,
  periodLabel,
  today,
  previousScore,
  onLog,
}: {
  kpis: EmployeeKpi[];
  periodLabel: string;
  today: Date;
  previousScore: (name: string) => number | null;
  onLog: (count: number) => void;
}) {
  const [settings, setSettings] = useState<KpiEmailSettings>(defaultKpiEmailSettings);
  const [history, setHistory] = useState<KpiEmailRecord[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<EmployeeKpi | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setSettings(loadKpiEmailSettings());
    setHistory(loadKpiEmailHistory());
  }, []);

  useEffect(() => {
    setSelected(kpis.map((k) => k.name));
  }, [kpis]);

  const patch = (p: Partial<KpiEmailSettings>) => {
    const next = { ...settings, ...p };
    setSettings(next);
    saveKpiEmailSettings(next);
  };

  const toggle = (name: string) =>
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  const recipients = kpis.filter((k) => selected.includes(k.name));

  const send = () => {
    if (!recipients.length) {
      toast.error("Select at least one employee");
      return;
    }
    setSending(true);
    window.setTimeout(() => {
      const rows: KpiEmailRecord[] = recipients.map((k) => ({
        id: `mail-${Date.now()}-${k.employeeId}`,
        employee: k.name,
        employeeId: k.employeeId,
        email: employeeEmail(k.name),
        subject: fillSubject(settings.subject, periodLabel, k),
        period: periodLabel,
        score: k.total,
        tier: k.tier.label,
        sentAt: new Date().toISOString(),
        status: "Sent",
      }));
      const next = [...rows, ...history];
      setHistory(next);
      saveKpiEmailHistory(next);
      onLog(rows.length);
      setSending(false);
      toast.success(`KPI report sent to ${rows.length} employee(s)`, {
        description: `Period ${periodLabel}${settings.ccManagement ? ` · copy to ${settings.ccManagement}` : ""}`,
      });
    }, 600);
  };

  const downloadOne = (k: EmployeeKpi) => {
    const html = buildKpiEmailHtml(k, periodLabel, settings, {
      previousScore: previousScore(k.name),
    });
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `kpi-report-${k.employeeId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const next = nextSendDate(settings, today);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      {/* recipients */}
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Recipients</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {recipients.length} of {kpis.length} employees in the current filter · period {periodLabel}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelected(kpis.map((k) => k.name))}>
                Select all
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelected([])}>
                Clear
              </Button>
              <Button size="sm" onClick={send} disabled={sending}>
                <Send className="mr-2 size-4" />
                {sending ? "Sending…" : `Send report (${recipients.length})`}
              </Button>
            </div>
          </div>

          <div className="mt-4 max-h-[420px] overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-secondary/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2" />
                  <th className="px-3 py-2 text-left">Employee</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-right">Score</th>
                  <th className="px-3 py-2 text-right">Report</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map((k) => (
                  <tr key={k.employeeId} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selected.includes(k.name)}
                        onCheckedChange={() => toggle(k.name)}
                        aria-label={`Select ${k.name}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium">{k.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {k.employeeId} · {k.department}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {employeeEmail(k.name)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{k.total.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setPreview(k)}>
                        Preview
                      </Button>
                    </td>
                  </tr>
                ))}
                {!kpis.length && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">
                      No employees in the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* history */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Send history</h3>
          {history.length ? (
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Mail className="size-4 text-primary" />
                    <span className="font-medium">{h.employee}</span>
                    <span className="text-xs text-muted-foreground">{h.email}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {h.score.toFixed(1)} · {h.tier} · {formatDateTime(h.sentAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No KPI emails sent yet.</p>
          )}
        </div>
      </div>

      {/* settings */}
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Monthly schedule</h3>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm">Auto-send at month end</p>
              <p className="text-xs text-muted-foreground">
                Next dispatch {formatDate(next)}
              </p>
            </div>
            <Switch
              checked={settings.autoSend}
              onCheckedChange={(v) => patch({ autoSend: v })}
            />
          </div>
          <div className="mt-4">
            <label className="text-xs text-muted-foreground">Send day</label>
            <Select
              value={String(settings.sendDay)}
              onValueChange={(v) => patch({ sendDay: Number(v) })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Last day of month</SelectItem>
                {[1, 5, 10, 15, 25, 28].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    Day {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Email content</h3>
          <div>
            <label className="text-xs text-muted-foreground">
              Subject — {"{period} {name} {score} {tier}"}
            </label>
            <Input
              className="mt-1"
              value={settings.subject}
              onChange={(e) => patch({ subject: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Intro message</label>
            <Textarea
              className="mt-1"
              rows={4}
              value={settings.intro}
              onChange={(e) => patch({ intro: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Signature</label>
            <Input
              className="mt-1"
              value={settings.signature}
              onChange={(e) => patch({ signature: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Copy to management</label>
            <Input
              className="mt-1"
              value={settings.ccManagement}
              onChange={(e) => patch({ ccManagement: e.target.value })}
            />
          </div>
          {(
            [
              ["includeAttendance", "Attendance, work hours, breaks & work logs"],
              ["includeTaskBreakdown", "Task & work performance breakdown"],
              ["includeTrendNote", "Comparison with previous period"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="text-sm">{label}</span>
              <Switch checked={settings[key]} onCheckedChange={(v) => patch({ [key]: v })} />
            </div>
          ))}
        </div>
      </div>

      {/* preview */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle>{fillSubject(settings.subject, periodLabel, preview)}</DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground">
                To {employeeEmail(preview.name)}
                {settings.ccManagement ? ` · cc ${settings.ccManagement}` : ""}
              </p>
              <iframe
                title="KPI email preview"
                className="h-[520px] w-full rounded-lg border border-border bg-white"
                srcDoc={buildKpiEmailHtml(preview, periodLabel, settings, {
                  previousScore: previousScore(preview.name),
                })}
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard?.writeText(buildKpiEmailText(preview, periodLabel));
                    toast.success("Plain-text summary copied");
                  }}
                >
                  Copy summary
                </Button>
                <Button variant="outline" onClick={() => downloadOne(preview)}>
                  Download HTML
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
