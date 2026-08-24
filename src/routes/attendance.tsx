import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarIcon,
  ChevronsUpDown,
  Clock,
  Coffee,
  MoonStar,
  Timer,
  UserSearch,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { AppShell } from "@/components/layout/AppShell";
import { departments } from "@/lib/employee-data";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
      { title: "Attendance Logs — WorkBoard" },
      {
        name: "description",
        content:
          "See clock-in, break and clock-out times per employee with worked and idle hours for any date range.",
      },
      { property: "og:title", content: "Attendance Logs — WorkBoard" },
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
  const [employee, setEmployee] = useState<string>("all");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);


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

  const employees = useMemo(
    () => Array.from(new Set(all.map((r) => r.employee))).sort(),
    [all],
  );

  const visibleRows = useMemo(
    () => (employee === "all" ? rows : rows.filter((r) => r.employee === employee)),
    [rows, employee],
  );

  const detailRows = useMemo(
    () =>
      detail
        ? all
            .filter((r) => r.employee === detail)
            .filter((r) => {
              if (!range) return false;
              const from = toDateKey(range.from);
              const to = toDateKey(range.to);
              return r.date >= from && r.date <= to;
            })
            .sort((a, b) => b.date.localeCompare(a.date))
        : [],
    [all, detail, range],
  );

  const detailTotals = useMemo(() => {
    const present = detailRows.filter((r) => r.status !== "Absent");
    return {
      worked: present.reduce((s, r) => s + r.workedMinutes, 0),
      idle: present.reduce((s, r) => s + r.idleMinutes, 0),
      breaks: present.reduce((s, r) => s + r.breakMinutes, 0),
      days: present.length,
    };
  }, [detailRows]);

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

        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <UserSearch className="size-4" />
              {employee === "all" ? "All employees" : employee}
              <ChevronsUpDown className="size-3.5 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search employee..." />
              <CommandList>
                <CommandEmpty>No employee found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setEmployee("all");
                      setPickerOpen(false);
                    }}
                  >
                    All employees
                  </CommandItem>
                  {employees.map((e) => (
                    <CommandItem
                      key={e}
                      value={e}
                      onSelect={() => {
                        setEmployee(e);
                        setPickerOpen(false);
                      }}
                    >
                      {e}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

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
          data={visibleRows}
          columns={columns}
          onRowClick={(r) => setDetail(r.employee)}
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

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{detail}</DialogTitle>
            <DialogDescription>
              {detailRows[0]?.department} · {range ? `${fmt(range.from)} — ${fmt(range.to)}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Days present", String(detailTotals.days)],
              ["Total Work Time", formatDuration(detailTotals.worked)],
              ["Total Idle Time", formatDuration(detailTotals.idle)],
              ["Total Break Time", formatDuration(detailTotals.breaks)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="scrollbar-slim max-h-[50vh] overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-secondary/70 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {[
                    "Date",
                    "Clock In",
                    "Break Start",
                    "Break End",
                    "Clock Out",
                    "Break",
                    "Worked",
                    "Idle",
                    "Status",
                  ].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailRows.map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="px-3 py-2">{r.date}</td>
                    <td className="px-3 py-2">{r.clockIn ?? "—"}</td>
                    <td className="px-3 py-2">{r.breakStart ?? "—"}</td>
                    <td className="px-3 py-2">{r.breakEnd ?? "—"}</td>
                    <td className="px-3 py-2">{r.clockOut ?? "—"}</td>
                    <td className="px-3 py-2">{r.breakMinutes ? formatDuration(r.breakMinutes) : "—"}</td>
                    <td className="px-3 py-2 font-medium">{formatDuration(r.workedMinutes)}</td>
                    <td
                      className={cn(
                        "px-3 py-2",
                        r.idleMinutes > 45 ? "text-warning" : "text-muted-foreground",
                      )}
                    >
                      {formatDuration(r.idleMinutes)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill status={r.status} />
                    </td>
                  </tr>
                ))}
                {detailRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                      No logs in this range.
                    </td>
                  </tr>
                )}
              </tbody>
              {detailRows.length > 0 && (
                <tfoot className="sticky bottom-0 bg-secondary/90 text-xs font-semibold uppercase tracking-wide text-foreground">
                  <tr className="border-t border-border">
                    <td className="px-3 py-2.5" colSpan={5}>
                      Total
                    </td>
                    <td className="px-3 py-2.5">{formatDuration(detailTotals.breaks)}</td>
                    <td className="px-3 py-2.5">{formatDuration(detailTotals.worked)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {formatDuration(detailTotals.idle)}
                    </td>
                    <td className="px-3 py-2.5" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );

}
