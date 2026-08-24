import { createFileRoute } from "@tanstack/react-router";
import { CalendarIcon, Clock, Coffee, MoonStar, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  formatDuration,
  generateAttendance,
  rangePresets,
  resolveRange,
  toDateKey,
  type AttendanceRecord,
  type RangePreset,
} from "@/lib/attendance-data";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance Logs — Ray ERP" },
      {
        name: "description",
        content:
          "See clock-in, break and clock-out times per employee with worked and idle hours for any date range.",
      },
      { property: "og:title", content: "Attendance Logs — Ray ERP" },
      {
        property: "og:description",
        content: "Clock-in, break, clock-out, worked and idle time for every employee.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const fmt = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function Page() {
  const [today, setToday] = useState<Date | null>(null);
  const [preset, setPreset] = useState<RangePreset>("today");
  const [custom, setCustom] = useState<DateRange | undefined>();

  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
  }, []);

  const all = useMemo(() => (today ? generateAttendance(today) : []), [today]);

  const range = useMemo(() => {
    if (!today) return null;
    if (preset === "custom") {
      if (!custom?.from) return null;
      return { from: custom.from, to: custom.to ?? custom.from };
    }
    return resolveRange(preset, today);
  }, [preset, custom, today]);

  const rows = useMemo(() => {
    if (!range) return [];
    const from = toDateKey(range.from);
    const to = toDateKey(range.to);
    return all
      .filter((r) => r.date >= from && r.date <= to)
      .sort((a, b) => (a.date === b.date ? a.employee.localeCompare(b.employee) : b.date.localeCompare(a.date)));
  }, [all, range]);

  const totals = useMemo(() => {
    const present = rows.filter((r) => r.status !== "Absent");
    return {
      records: rows.length,
      present: present.length,
      worked: present.reduce((s, r) => s + r.workedMinutes, 0),
      idle: present.reduce((s, r) => s + r.idleMinutes, 0),
      breaks: present.reduce((s, r) => s + r.breakMinutes, 0),
    };
  }, [rows]);

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "employee",
      header: "Employee",
      searchable: true,
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.employee}</p>
          <p className="text-xs text-muted-foreground">{r.department}</p>
        </div>
      ),
    },
    { key: "date", header: "Date", accessor: (r) => r.date },
    { key: "clockIn", header: "Clock In", cell: (r) => r.clockIn ?? "—" },
    { key: "breakStart", header: "Break Start", cell: (r) => r.breakStart ?? "—" },
    { key: "breakEnd", header: "Break End", cell: (r) => r.breakEnd ?? "—" },
    {
      key: "breakMinutes",
      header: "Break",
      accessor: (r) => r.breakMinutes,
      cell: (r) => (r.breakMinutes ? formatDuration(r.breakMinutes) : "—"),
    },
    { key: "clockOut", header: "Clock Out", cell: (r) => r.clockOut ?? "—" },
    {
      key: "workedMinutes",
      header: "Worked",
      accessor: (r) => r.workedMinutes,
      cell: (r) => (
        <span className="font-medium text-foreground">{formatDuration(r.workedMinutes)}</span>
      ),
    },
    {
      key: "idleMinutes",
      header: "Idle",
      accessor: (r) => r.idleMinutes,
      cell: (r) => (
        <span className={cn(r.idleMinutes > 45 ? "text-warning" : "text-muted-foreground")}>
          {formatDuration(r.idleMinutes)}
        </span>
      ),
    },
    { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status} /> },
  ];

  const departments = useMemo(
    () => Array.from(new Set(all.map((r) => r.department))).sort(),
    [all],
  );

  return (
    <AppShell>
      <PageHeader
        title="Attendance Logs"
        description="Clock-in, break and clock-out times with worked vs idle hours per employee."
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {rangePresets.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant={preset === p.key ? "default" : "outline"}
            onClick={() => setPreset(p.key)}
          >
            {p.label}
          </Button>
        ))}

        {preset === "custom" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <CalendarIcon className="size-4" />
                {custom?.from
                  ? `${fmt(custom.from)} — ${custom.to ? fmt(custom.to) : "…"}`
                  : "Pick date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={custom}
                onSelect={setCustom}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        )}

        {range && (
          <span className="ml-auto text-sm text-muted-foreground">
            {fmt(range.from)} — {fmt(range.to)}
          </span>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Clock} label="Attendance Records" value={totals.records} caption={`${totals.present} clocked in`} highlight />
        <StatCard icon={Timer} label="Total Worked" value={formatDuration(totals.worked)} caption="Across selected range" />
        <StatCard icon={MoonStar} label="Total Idle" value={formatDuration(totals.idle)} caption="Inactive during shift" />
        <StatCard icon={Coffee} label="Total Break" value={formatDuration(totals.breaks)} caption="Logged break time" />
      </div>

      {!today ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
          Loading attendance…
        </div>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          filters={[
            { key: "department", label: "Departments", options: departments },
            { key: "status", label: "Status", options: ["Present", "Late", "On Break", "Absent"] },
          ]}
          emptyMessage={
            preset === "custom" && !custom?.from
              ? "Pick a custom date range to see attendance."
              : "No attendance records in this range."
          }
        />
      )}
    </AppShell>
  );
}
