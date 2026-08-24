import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlarmClock,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Coffee,
  Megaphone,
  Plane,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { announcementTone, announcements, relativeDay, shortDate } from "@/lib/dashboard-data";
import { formatDuration, generateAttendance, toDateKey } from "@/lib/attendance-data";
import { createSeedBoards, initials } from "@/lib/board-data";
import { employees } from "@/lib/employee-data";
import { generateLeaveRequests } from "@/lib/leave-data";
import { generateWorklogs } from "@/lib/worklog-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — OmniWork Operations Dashboard" },
      {
        name: "description",
        content:
          "Live agency pulse: attendance, who is on leave, pending approvals, project delivery, EOD reports, announcements and new hires.",
      },
      { property: "og:title", content: "Command Center — OmniWork Operations Dashboard" },
      {
        property: "og:description",
        content: "Attendance, leave, projects, EOD reports and announcements in one live view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const CHART = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Dashboard() {
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
  }, []);

  const data = useMemo(() => {
    if (!today) return null;
    const key = toDateKey(today);
    const attendance = generateAttendance(today);
    const leave = generateLeaveRequests(today);
    const worklogs = generateWorklogs(today);
    const boards = createSeedBoards();

    const todayRows = attendance.filter((r) => r.date === key);
    const present = todayRows.filter((r) => r.status !== "Absent");
    const late = todayRows.filter((r) => r.status === "Late");
    const onBreak = todayRows.filter((r) => r.status === "On Break");
    const avgWork = present.length
      ? Math.round(present.reduce((s, r) => s + r.workedMinutes, 0) / present.length)
      : 0;
    const avgIdle = present.length
      ? Math.round(present.reduce((s, r) => s + r.idleMinutes, 0) / present.length)
      : 0;

    // 14 most recent working days, oldest first
    const days = Array.from(new Set(attendance.map((r) => r.date))).sort().slice(-14);
    const trend = days.map((d) => {
      const rows = attendance.filter((r) => r.date === d);
      const p = rows.filter((r) => r.status !== "Absent");
      return {
        day: shortDate(d),
        rate: rows.length ? Math.round((p.length / rows.length) * 100) : 0,
        work: p.length ? +(p.reduce((s, r) => s + r.workedMinutes, 0) / p.length / 60).toFixed(1) : 0,
        idle: p.length ? +(p.reduce((s, r) => s + r.idleMinutes, 0) / p.length / 60).toFixed(1) : 0,
      };
    });

    const onLeaveToday = leave.filter(
      (l) => l.status === "Approved" && l.from <= key && l.to >= key,
    );
    const pendingLeave = leave.filter((l) => l.status === "Pending");
    const upcomingLeave = leave
      .filter((l) => l.status === "Approved" && l.from > key)
      .sort((a, b) => a.from.localeCompare(b.from))
      .slice(0, 4);

    const wlToday = worklogs.filter((w) => w.date === key);
    const submitted = wlToday.filter((w) => w.status === "Submitted");
    const deptSubmission = Object.entries(
      wlToday.reduce<Record<string, { total: number; done: number }>>((acc, w) => {
        const short = w.department.replace(" Department", "").replace("Business Development", "Biz Dev");
        acc[short] = acc[short] ?? { total: 0, done: 0 };
        acc[short].total += 1;
        if (w.status === "Submitted") acc[short].done += 1;
        return acc;
      }, {}),
    ).map(([dept, v]) => ({ dept, rate: Math.round((v.done / v.total) * 100) }));

    const items = boards.flatMap((b) => b.groups.flatMap((g) => g.items));
    const isDone = (s: string) => ["done", "completed"].includes(s.toLowerCase());
    const doneItems = items.filter((i) => isDone(i.status));
    const stuckItems = items.filter((i) => ["stuck", "blocked"].includes(i.status.toLowerCase()));
    const overdue = items.filter((i) => i.dueDate && i.dueDate < key && !isDone(i.status));
    const statusSplit = Object.entries(
      items.reduce<Record<string, number>>((acc, i) => {
        acc[i.status] = (acc[i.status] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }));

    const headcount = Object.entries(
      employees.reduce<Record<string, number>>((acc, e) => {
        const short = e.department.replace(" Department", "");
        acc[short] = (acc[short] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }));

    const newHires = [...employees]
      .sort((a, b) => b.joiningDate.localeCompare(a.joiningDate))
      .slice(0, 4);

    const topPerformers = Object.entries(
      attendance
        .filter((r) => days.includes(r.date))
        .reduce<Record<string, { mins: number; dept: string; days: number }>>((acc, r) => {
          const cur = acc[r.employee] ?? { mins: 0, dept: r.department, days: 0 };
          cur.mins += r.workedMinutes;
          if (r.status !== "Absent") cur.days += 1;
          acc[r.employee] = cur;
          return acc;
        }, {}),
    )
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.mins - a.mins)
      .slice(0, 5);

    const monthPrefix = key.slice(0, 7);
    const leaveByDept = Object.entries(
      leave
        .filter((l) => l.status === "Approved" && l.from.startsWith(key.slice(0, 4)))
        .reduce<Record<string, number>>((acc, l) => {
          const short = l.department.replace(" Department", "");
          acc[short] = (acc[short] ?? 0) + l.days;
          return acc;
        }, {}),
    )
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const payrollTotal = employees
      .filter((e) => e.status !== "Inactive")
      .reduce((s, e) => s + e.monthlySalary, 0);
    const onProbation = employees.filter((e) => e.onProbation && e.status === "Active").length;

    const lateList = data0(todayRows.filter((r) => r.status === "Late"));
    function data0<T>(v: T) {
      return v;
    }

    const missingEod = wlToday.filter((w) => w.status !== "Submitted").slice(0, 6);

    const upcomingDue = items
      .filter((i) => i.dueDate && i.dueDate >= key && !isDone(i.status))
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
      .slice(0, 6);

    const workloadByAssignee = Object.entries(
      items.reduce<Record<string, { open: number; done: number }>>((acc, i) => {
        (i.assignees?.length ? i.assignees : ["Unassigned"]).forEach((a: string) => {
          acc[a] = acc[a] ?? { open: 0, done: 0 };
          if (isDone(i.status)) acc[a].done += 1;
          else acc[a].open += 1;
        });
        return acc;
      }, {}),
    )
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.open + b.done - (a.open + a.done))
      .slice(0, 6);

    return {
      key,
      monthPrefix,
      todayRows,
      present,
      late,
      onBreak,
      avgWork,
      avgIdle,
      trend,
      onLeaveToday,
      pendingLeave,
      upcomingLeave,
      wlToday,
      submitted,
      deptSubmission,
      items,
      doneItems,
      stuckItems,
      overdue,
      statusSplit,
      headcount,
      newHires,
      topPerformers,
      leaveByDept,
      payrollTotal,
      onProbation,
      lateList,
      missingEod,
      upcomingDue,
      workloadByAssignee,
    };

  }, [today]);

  const activeCount = employees.filter((e) => e.status === "Active").length;

  return (
    <AppShell>
      <PageHeader
        title="Hi Arlene! Here is today at a glance"
        description={
          today
            ? today.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : "Loading live agency data…"
        }
        actions={
          <Button asChild className="gap-2">
            <Link to="/projects">
              Open work board <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        }
      />

      {!data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Hero KPI strip */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <HeroCard
              icon={Clock3}
              label="Present today"
              value={`${data.present.length}/${data.todayRows.length}`}
              caption={`${data.late.length} late · ${data.onBreak.length} on break`}
              accent="primary"
              progress={
                data.todayRows.length
                  ? Math.round((data.present.length / data.todayRows.length) * 100)
                  : 0
              }
            />
            <HeroCard
              icon={Plane}
              label="On leave today"
              value={data.onLeaveToday.length}
              caption={`${data.pendingLeave.length} requests waiting approval`}
              accent="info"
            />
            <HeroCard
              icon={ClipboardList}
              label="EOD reports"
              value={`${data.submitted.length}/${data.wlToday.length}`}
              caption={`${data.wlToday.length - data.submitted.length} still pending tonight`}
              accent="warning"
              progress={
                data.wlToday.length
                  ? Math.round((data.submitted.length / data.wlToday.length) * 100)
                  : 0
              }
            />
            <HeroCard
              icon={CheckCircle2}
              label="Tasks completed"
              value={`${data.doneItems.length}/${data.items.length}`}
              caption={`${data.overdue.length} overdue · ${data.stuckItems.length} stuck`}
              accent="success"
              progress={
                data.items.length
                  ? Math.round((data.doneItems.length / data.items.length) * 100)
                  : 0
              }
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel
              className="lg:col-span-2"
              title="Attendance & productivity"
              subtitle="Last 14 working days"
              action={
                <Link to="/attendance" className="text-xs text-primary hover:underline">
                  View logs
                </Link>
              }
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ left: -18, right: 6, top: 8 }}>
                    <defs>
                      <linearGradient id="gRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gWork" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="rate"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="hours"
                      orientation="right"
                      domain={[0, 12]}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    <Tooltip content={<ChartTip suffixes={{ rate: "%", work: "h", idle: "h" }} />} />
                    <Area
                      yAxisId="rate"
                      type="monotone"
                      dataKey="rate"
                      name="Attendance"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      fill="url(#gRate)"
                    />
                    <Area
                      yAxisId="hours"
                      type="monotone"
                      dataKey="work"
                      name="Avg work"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      fill="url(#gWork)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 border-t border-border pt-3">
                <MiniStat icon={TrendingUp} label="Avg work / person" value={formatDuration(data.avgWork)} />
                <MiniStat icon={Coffee} label="Avg idle / person" value={formatDuration(data.avgIdle)} />
                <MiniStat icon={AlarmClock} label="Late arrivals" value={`${data.late.length} today`} />
              </div>
            </Panel>

            <Panel title="Task status" subtitle="Across every board">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusSplit}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {data.statusSplit.map((_, i) => (
                        <Cell key={i} fill={CHART[i % CHART.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {data.statusSplit.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: CHART[i % CHART.length] }}
                    />
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="ml-auto font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* People row */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel
              title="Who is out today"
              subtitle={`${data.onLeaveToday.length} teammate${data.onLeaveToday.length === 1 ? "" : "s"} on approved leave`}
              action={
                <Link to="/leave" className="text-xs text-primary hover:underline">
                  Leave module
                </Link>
              }
            >
              {data.onLeaveToday.length === 0 ? (
                <Empty text="Everyone is in today." />
              ) : (
                <ul className="space-y-2.5">
                  {data.onLeaveToday.slice(0, 5).map((l) => (
                    <li key={l.id} className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-primary/15 text-[11px] text-primary">
                          {initials(l.employee)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{l.employee}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {l.department.replace(" Department", "")} · back {shortDate(l.to)}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                        {l.type}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
              {data.upcomingLeave.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Upcoming
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.upcomingLeave.map((l) => (
                      <span
                        key={l.id}
                        className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {l.employee.split(" ")[0]} · {shortDate(l.from)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Panel>

            <Panel
              title="Leave approvals"
              subtitle={`${data.pendingLeave.length} pending your decision`}
              action={
                <Link to="/leave" className="text-xs text-primary hover:underline">
                  Review all
                </Link>
              }
            >
              {data.pendingLeave.length === 0 ? (
                <Empty text="No requests waiting." />
              ) : (
                <ul className="space-y-2">
                  {data.pendingLeave.slice(0, 5).map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2"
                    >
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-warning/20 text-[10px] text-warning">
                          {initials(l.employee)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{l.employee}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {l.type} · {shortDate(l.from)} → {shortDate(l.to)}
                        </p>
                      </div>
                      <span className="ml-auto shrink-0 text-xs font-medium text-warning">
                        {l.days}d
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Newly onboarded"
              subtitle="Latest joiners and onboarding progress"
              action={
                <Link to="/employees" className="text-xs text-primary hover:underline">
                  Directory
                </Link>
              }
            >
              <ul className="space-y-3">
                {data.newHires.map((e) => (
                  <li key={e.id} className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-info/15 text-[11px] text-info">
                          {initials(`${e.firstName} ${e.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {e.firstName} {e.lastName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {e.designation} · joined {shortDate(e.joiningDate)}
                        </p>
                      </div>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {e.onboardingProgress}%
                      </span>
                    </div>
                    <Progress value={e.onboardingProgress} className="h-1.5" />
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-primary">
                <UserPlus className="size-3.5" />
                {activeCount} active teammates across {data.headcount.length} departments
              </div>
            </Panel>
          </div>

          {/* Bottom row */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel
              title="EOD submissions by department"
              subtitle="Share of reports submitted today"
              action={
                <Link to="/worklogs" className="text-xs text-primary hover:underline">
                  Work logs
                </Link>
              }
            >
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.deptSubmission} margin={{ left: -20, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="dept"
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTip suffixes={{ rate: "%" }} />} />
                    <Bar dataKey="rate" name="Submitted" radius={[6, 6, 0, 0]} maxBarSize={38}>
                      {data.deptSubmission.map((_, i) => (
                        <Cell key={i} fill={CHART[i % CHART.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel
              title="Announcements"
              subtitle="Latest company updates"
              action={
                <Link to="/announcements" className="text-xs text-primary hover:underline">
                  All posts
                </Link>
              }
            >
              <ul className="space-y-3">
                {announcements.slice(0, 4).map((a) => (
                  <li key={a.id} className="rounded-lg border border-border bg-secondary/40 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[10px]", announcementTone[a.category])}>
                        {a.category}
                      </Badge>
                      {a.pinned && <Megaphone className="size-3.5 text-primary" />}
                      <span className="ml-auto text-[11px] text-muted-foreground">
                        {relativeDay(a.daysAgo)}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-snug">{a.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">by {a.author}</p>
                  </li>
                ))}
              </ul>
            </Panel>

            <div className="space-y-4">
              <Panel title="Top contributors" subtitle="Most hours logged this fortnight">
                <ul className="space-y-2.5">
                  {data.topPerformers.map((p, i) => (
                    <li key={p.name} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold",
                          i === 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.dept.replace(" Department", "")} · {p.days} days present
                        </p>
                      </div>
                      <span className="ml-auto shrink-0 text-xs font-medium text-primary">
                        {Math.round(p.mins / 60)}h
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Headcount by department" subtitle="Active directory split">
                <ul className="space-y-2.5">
                  {data.headcount.map((h, i) => {
                    const max = Math.max(...data.headcount.map((x) => x.value));
                    return (
                      <li key={h.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{h.name}</span>
                          <span className="font-medium">{h.value}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(h.value / max) * 100}%`,
                              background: CHART[i % CHART.length],
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function HeroCard({
  icon: Icon,
  label,
  value,
  caption,
  accent,
  progress,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  caption?: string;
  accent: "primary" | "info" | "warning" | "success";
  progress?: number;
}) {
  const tone = {
    primary: "text-primary bg-primary/15",
    info: "text-info bg-info/15",
    warning: "text-warning bg-warning/15",
    success: "text-success bg-success/15",
  }[accent];
  const bar = {
    primary: "bg-primary",
    info: "bg-info",
    warning: "bg-warning",
    success: "bg-success",
  }[accent];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-12 size-32 rounded-full opacity-20 blur-2xl",
          bar,
        )}
      />
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("flex size-9 items-center justify-center rounded-xl", tone)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {caption && <p className="mt-1.5 text-xs text-muted-foreground">{caption}</p>}
      {typeof progress === "number" && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className={cn("h-full rounded-full", bar)} style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-24 items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground">
      <Sparkles className="size-3.5" /> {text}
    </div>
  );
}

function ChartTip({
  active,
  payload,
  label,
  suffixes = {},
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; dataKey?: string; color?: string }[];
  label?: string;
  suffixes?: Record<string, string>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}
          <span className="ml-auto font-medium text-foreground">
            {p.value}
            {suffixes[p.dataKey ?? ""] ?? ""}
          </span>
        </p>
      ))}
    </div>
  );
}
