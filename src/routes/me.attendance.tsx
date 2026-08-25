import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarCheck, Clock, Coffee, TimerOff } from "lucide-react";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { startOfToday, useEmployeeSession } from "@/lib/employee-session";
import {
  formatDuration,
  generateAttendance,
  type AttendanceRecord,
} from "@/lib/attendance-data";
import { formatDate } from "@/lib/leave-data";

export const Route = createFileRoute("/me/attendance")({
  head: () => ({
    meta: [
      { title: "My Attendance — OmniWork Employee Portal" },
      {
        name: "description",
        content: "Your own clock-in, clock-out, break and idle history with monthly attendance stats.",
      },
      { property: "og:title", content: "My Attendance — OmniWork Employee Portal" },
      {
        property: "og:description",
        content: "Track your clock-in times, worked hours, breaks and late arrivals month by month.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const monthsBack = [0, 1, 2];

function Page() {
  const { name } = useEmployeeSession();
  const today = useMemo(() => startOfToday(), []);
  const [offset, setOffset] = useState(0);

  const month = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() - offset, 1),
    [today, offset],
  );

  const rows = useMemo(() => {
    const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    return generateAttendance(today)
      .filter((a) => a.employee === name && a.date.startsWith(prefix))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [name, today, month]);

  const present = rows.filter((r) => r.status !== "Absent").length;
  const late = rows.filter((r) => r.status === "Late").length;
  const absent = rows.filter((r) => r.status === "Absent").length;
  const hours = rows.reduce((s, r) => s + r.workedMinutes, 0) / 60;
  const idle = rows.reduce((s, r) => s + r.idleMinutes, 0);
  const breaks = rows.reduce((s, r) => s + r.breakMinutes, 0);

  const columns: Column<AttendanceRecord>[] = [
    { key: "date", header: "Date", cell: (r) => formatDate(r.date) },
    { key: "clockIn", header: "Clock in", cell: (r) => r.clockIn ?? "—" },
    { key: "clockOut", header: "Clock out", cell: (r) => r.clockOut ?? "—" },
    { key: "breakMinutes", header: "Break", cell: (r) => formatDuration(r.breakMinutes) },
    { key: "idleMinutes", header: "Idle", cell: (r) => formatDuration(r.idleMinutes) },
    { key: "workedMinutes", header: "Worked", cell: (r) => formatDuration(r.workedMinutes) },
    { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <EmployeeShell>
      <PageHeader
        title="My Attendance"
        description="Your personal attendance record — clock in and out times, breaks, idle time and late arrivals."
        actions={
          <div className="flex gap-1 rounded-full border border-border p-1">
            {monthsBack.map((m) => {
              const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
              return (
                <Button
                  key={m}
                  size="sm"
                  variant={offset === m ? "default" : "ghost"}
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={() => setOffset(m)}
                >
                  {d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                </Button>
              );
            })}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          label="Present days"
          value={present}
          caption={`${absent} absent · ${late} late`}
          highlight
        />
        <StatCard icon={Clock} label="Hours worked" value={`${hours.toFixed(1)}h`} caption="This period" />
        <StatCard icon={Coffee} label="Break time" value={formatDuration(breaks)} caption="Total for the month" />
        <StatCard icon={TimerOff} label="Idle time" value={formatDuration(idle)} caption="Detected by monitoring" />
      </div>

      <DataTable data={rows} columns={columns} emptyMessage="No attendance records for this month." />
    </EmployeeShell>
  );
}
