import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  Megaphone,
  Target,
  TrendingUp,
} from "lucide-react";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { startOfToday, useEmployeeSession } from "@/lib/employee-session";
import { generateAttendance, formatDuration, toDateKey } from "@/lib/attendance-data";
import { generateWorklogs } from "@/lib/worklog-data";
import {
  ANNUAL_ALLOWANCE,
  formatDate,
  generateLeaveRequests,
  leaveTypeTone,
  usedDays,
} from "@/lib/leave-data";
import {
  buildDataset,
  computeEmployeeKpi,
  defaultKpiSettings,
  dateKey as kpiDateKey,
} from "@/lib/kpi-data";
import {
  categoryStyles,
  initialAnnouncements,
  relativeTime,
  stripHtml,
} from "@/lib/announcement-data";

export const Route = createFileRoute("/me/")({
  head: () => ({
    meta: [
      { title: "My Dashboard — OmniWork Employee Portal" },
      {
        name: "description",
        content:
          "Personal OmniWork dashboard: attendance, work logs, leave balance, KPI score, tasks and company announcements.",
      },
      { property: "og:title", content: "My Dashboard — OmniWork Employee Portal" },
      {
        property: "og:description",
        content: "Your attendance, work logs, leave balance, KPI score and assigned tasks in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Panel({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon: typeof Clock;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function Page() {
  const { employee, name } = useEmployeeSession();
  const today = useMemo(() => startOfToday(), []);

  const data = useMemo(() => {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const attendance = generateAttendance(today).filter((a) => a.employee === name);
    const worklogs = generateWorklogs(today).filter((w) => w.employee === name);
    const leaves = generateLeaveRequests(today).filter((l) => l.employeeId === employee.id);
    const dataset = buildDataset(today);
    const kpi = computeEmployeeKpi(name, dataset, monthStart, today, defaultKpiSettings);

    const monthKeyPrefix = kpiDateKey(monthStart).slice(0, 7);
    const monthAttendance = attendance.filter((a) => a.date.startsWith(monthKeyPrefix));
    const todayKey = toDateKey(today);
    const todayRecord = attendance.find((a) => a.date === todayKey) ?? null;

    const myTasks = dataset.tasks
      .filter(
        (t) =>
          t.employee === name &&
          t.status !== "Completed" &&
          t.status !== "Completed Late" &&
          t.status !== "Cancelled",
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 6);

    const recentLogs = worklogs
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    const news = initialAnnouncements
      .filter((a) => a.audience === "Everyone" || a.audience === employee.department)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4);

    const upcomingLeave = leaves
      .filter((l) => l.to >= todayKey && (l.status === "Approved" || l.status === "Pending"))
      .sort((a, b) => a.from.localeCompare(b.from));

    return {
      kpi,
      monthAttendance,
      todayRecord,
      myTasks,
      recentLogs,
      news,
      leaves: leaves.slice(0, 5),
      upcomingLeave,
      used: usedDays(leaves, employee.id, today.getFullYear()),
    };
  }, [name, employee.id, employee.department, today]);

  const monthHours = data.monthAttendance.reduce((s, a) => s + a.workedMinutes, 0) / 60;
  const presentDays = data.monthAttendance.filter((a) => a.status !== "Absent").length;
  const monthName = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <EmployeeShell>
      <div className="mb-6 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-6">
        <p className="text-xs uppercase tracking-widest text-primary">
          {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
          Welcome back, {employee.firstName}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {employee.designation} · {employee.department} · ID {employee.employeeId}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/me/worklogs">Submit today's worklog</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/me/leave">Apply for leave</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/me/kpi">View my KPI report</Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={Target}
          label={`KPI score · ${monthName}`}
          value={data.kpi.total.toFixed(1)}
          caption={data.kpi.tier.label}
          highlight
        />
        <StatCard
          icon={CalendarCheck}
          label="Present days"
          value={presentDays}
          caption={`of ${data.monthAttendance.length} working days`}
        />
        <StatCard
          icon={Clock}
          label="Hours logged"
          value={`${monthHours.toFixed(1)}h`}
          caption={`${data.kpi.productivity.productivityPct}% productive`}
        />
        <StatCard
          icon={CalendarCheck}
          label="Leave balance"
          value={Math.max(0, ANNUAL_ALLOWANCE - data.used)}
          caption={`${data.used} of ${ANNUAL_ALLOWANCE} days used`}
        />
        <StatCard
          icon={CheckCircle2}
          label="Tasks completed"
          value={data.kpi.tasks.completed}
          caption={`${data.kpi.tasks.onTimeRate}% on time`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Today's attendance" icon={Clock}>
          {data.todayRecord ? (
            <div className="space-y-3">
              <StatusPill status={data.todayRecord.status} />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Clock in</p>
                  <p className="font-medium">{data.todayRecord.clockIn ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clock out</p>
                  <p className="font-medium">{data.todayRecord.clockOut ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Worked</p>
                  <p className="font-medium">{formatDuration(data.todayRecord.workedMinutes)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Break</p>
                  <p className="font-medium">{formatDuration(data.todayRecord.breakMinutes)}</p>
                </div>
              </div>
              <Progress value={Math.min(100, (data.todayRecord.workedMinutes / (9 * 60)) * 100)} />
              <p className="text-xs text-muted-foreground">Target 9h shift</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No attendance recorded today — it's a non-working day or you haven't clocked in yet.
            </p>
          )}
        </Panel>

        <Panel
          title="KPI breakdown"
          icon={Activity}
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/me/kpi">Details</Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {data.kpi.categories.map((c) => (
              <div key={c.key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-medium">
                    {c.score.toFixed(1)}/{c.max}
                  </span>
                </div>
                <Progress className="mt-1 h-2" value={(c.score / c.max) * 100} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="My upcoming leave"
          icon={CalendarCheck}
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/me/leave">Apply</Link>
            </Button>
          }
        >
          {data.upcomingLeave.length ? (
            <ul className="space-y-3">
              {data.upcomingLeave.slice(0, 4).map((l) => (
                <li key={l.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={leaveTypeTone[l.type]}>
                      {l.type}
                    </Badge>
                    <StatusPill status={l.status} />
                  </div>
                  <p className="mt-2 text-sm">
                    {formatDate(l.from)} → {formatDate(l.to)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {l.days} day{l.days === 1 ? "" : "s"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming leave scheduled.</p>
          )}
        </Panel>

        <Panel title="My tasks due next" icon={Target} className="lg:col-span-2">
          {data.myTasks.length ? (
            <ul className="divide-y divide-border">
              {data.myTasks.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {t.project}
                  </Badge>
                  <StatusPill status={t.priority} />
                  <span
                    className={cn(
                      "text-xs",
                      t.dueDate < kpiDateKey(today) ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    due {formatDate(t.dueDate)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing open — you're all caught up.</p>
          )}
        </Panel>

        <Panel
          title="Worklog streak"
          icon={FileText}
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/me/worklogs">Open</Link>
            </Button>
          }
        >
          <div className="space-y-2">
            {data.recentLogs.map((w) => (
              <div key={w.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{formatDate(w.date)}</span>
                <StatusPill status={w.status} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Announcements"
          icon={Megaphone}
          className="lg:col-span-2"
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/me/announcements">See all</Link>
            </Button>
          }
        >
          <ul className="space-y-3">
            {data.news.map((a) => (
              <li key={a.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={categoryStyles[a.category]}>
                    {a.category}
                  </Badge>
                  <span className="text-sm font-medium">{a.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {relativeTime(a.createdAt)}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                  {stripHtml(a.html)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Performance snapshot" icon={TrendingUp}>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tier</dt>
              <dd className="font-medium">{data.kpi.tier.label}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Late days</dt>
              <dd className="font-medium">{data.kpi.attendance.lateDays}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Absent (equivalent)</dt>
              <dd className="font-medium">{data.kpi.attendance.equivalentAbsentDays}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Worklogs missing</dt>
              <dd className="font-medium">{data.kpi.workLogs.missing}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Break violations</dt>
              <dd className="font-medium">{data.kpi.breaks.violations}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </EmployeeShell>
  );
}
