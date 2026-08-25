import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, Award, CheckCircle2, Clock, Target } from "lucide-react";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { startOfToday, useEmployeeSession } from "@/lib/employee-session";
import {
  buildDataset,
  computeEmployeeKpi,
  dateKey,
  defaultKpiSettings,
} from "@/lib/kpi-data";
import { absenceSummary } from "@/lib/absence-rules";
import { formatDate } from "@/lib/leave-data";

export const Route = createFileRoute("/me/kpi")({
  head: () => ({
    meta: [
      { title: "My KPI Report — OmniWork Employee Portal" },
      {
        name: "description",
        content:
          "Your monthly 100-point KPI report: attendance, work hours, breaks, work logs and task performance.",
      },
      { property: "og:title", content: "My KPI Report — OmniWork Employee Portal" },
      {
        property: "og:description",
        content: "See exactly how your monthly KPI score is calculated, category by category.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { employee, name } = useEmployeeSession();
  const today = useMemo(() => startOfToday(), []);
  const [offset, setOffset] = useState(0);

  const { from, to, label } = useMemo(() => {
    const start = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const end = offset === 0 ? today : monthEnd;
    return {
      from: start,
      to: end,
      label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  }, [today, offset]);

  const { kpi, tasks } = useMemo(() => {
    const dataset = buildDataset(today);
    const result = computeEmployeeKpi(name, dataset, from, to, defaultKpiSettings);
    const fromKey = dateKey(from);
    const toKey = dateKey(to);
    const mine = dataset.tasks
      .filter((t) => t.employee === name && t.assignedDate >= fromKey && t.assignedDate <= toKey)
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    return { kpi: result, tasks: mine };
  }, [name, today, from, to]);

  return (
    <EmployeeShell>
      <PageHeader
        title="My KPI Report"
        description={`${employee.designation} · ${employee.department} · reporting period ${label}`}
        actions={
          <div className="flex gap-1 rounded-full border border-border p-1">
            {[0, 1, 2, 3].map((m) => {
              const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
              return (
                <Button
                  key={m}
                  size="sm"
                  variant={offset === m ? "default" : "ghost"}
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={() => setOffset(m)}
                >
                  {d.toLocaleDateString("en-US", { month: "short" })}
                </Button>
              );
            })}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-6 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total score</p>
          <p className="mt-2 text-6xl font-semibold tracking-tight">{kpi.total.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">out of 100 points</p>
          <Badge className="mt-4" variant="outline">
            <Award className="mr-1.5 size-3.5" /> {kpi.tier.label}
          </Badge>
          <Progress className="mt-4 h-2" value={kpi.total} />
          <p className="mt-3 text-xs text-muted-foreground">{label}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Score breakdown</h2>
          <div className="space-y-4">
            {kpi.categories.map((c) => (
              <div key={c.key}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{c.label}</span>
                  <span className="text-muted-foreground">
                    {c.score.toFixed(1)} / {c.max}
                    {c.deducted > 0 && (
                      <span className="ml-2 text-destructive">−{c.deducted.toFixed(1)}</span>
                    )}
                  </span>
                </div>
                <Progress className="mt-1.5 h-2" value={(c.score / c.max) * 100} />
                <p className="mt-1 text-xs text-muted-foreground">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Target}
          label="Tasks assigned"
          value={kpi.tasks.assigned}
          caption={`${kpi.tasks.completed} completed`}
        />
        <StatCard
          icon={CheckCircle2}
          label="On-time rate"
          value={`${kpi.tasks.onTimeRate}%`}
          caption={`${kpi.tasks.late} late · ${kpi.tasks.overdue} overdue`}
        />
        <StatCard
          icon={Clock}
          label="Productive hours"
          value={`${kpi.productivity.productiveHours.toFixed(1)}h`}
          caption={`${kpi.productivity.productivityPct}% of ${kpi.productivity.actualHours.toFixed(0)}h logged`}
        />
        <StatCard
          icon={Activity}
          label="Quality score"
          value={`${kpi.tasks.quality}%`}
          caption="Reviewer rating average"
        />
      </div>

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance & absence</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="discipline">Breaks & worklogs</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Attendance</h3>
              <dl className="space-y-2 text-sm">
                {[
                  ["Scheduled days", kpi.attendance.scheduledDays],
                  ["Present days", kpi.attendance.presentDays],
                  ["Absent days", kpi.attendance.absentDays],
                  ["Late days", kpi.attendance.lateDays],
                  ["Late minutes", kpi.attendance.lateMinutes],
                  ["Early outs", kpi.attendance.earlyOuts],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Absence conversion rules</h3>
              <p className="text-3xl font-semibold">{kpi.attendance.equivalentAbsentDays}</p>
              <p className="text-xs text-muted-foreground">equivalent absent days this period</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {absenceSummary(kpi.attendance.absenceBreakdown) || "No absence conversions."}
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <li>2 late days = 1 absent day</li>
                <li>Each day under required hours = 1 absent day</li>
                <li>3 missing work logs = 1 absent day</li>
                <li>Denied leave with no show = 2 absent days</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Quality</th>
                </tr>
              </thead>
              <tbody>
                {tasks.slice(0, 40).map((t) => (
                  <tr key={t.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5">{t.title}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{t.project}</td>
                    <td className="px-4 py-2.5">
                      <StatusPill status={t.priority} />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{formatDate(t.dueDate)}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "text-xs",
                          t.status === "Overdue" || t.status === "Completed Late"
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">{t.qualityScore}%</td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No tasks in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="discipline" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Breaks</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Allowed per day</dt>
                  <dd className="font-medium">{kpi.breaks.allowedMinutes} min</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total taken</dt>
                  <dd className="font-medium">{kpi.breaks.actualMinutes} min</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Excess</dt>
                  <dd className="font-medium">{kpi.breaks.excessMinutes} min</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Violations</dt>
                  <dd className="font-medium">{kpi.breaks.violations}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Work logs</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Required</dt>
                  <dd className="font-medium">{kpi.workLogs.required}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Submitted</dt>
                  <dd className="font-medium">{kpi.workLogs.submitted}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Missing</dt>
                  <dd className="font-medium text-destructive">{kpi.workLogs.missing}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Late submissions</dt>
                  <dd className="font-medium">{kpi.workLogs.late}</dd>
                </div>
              </dl>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </EmployeeShell>
  );
}
