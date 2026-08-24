import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarIcon,
  ChevronsUpDown,
  ClipboardList,
  FileWarning,
  Timer,
  UserSearch,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { AppShell } from "@/components/layout/AppShell";
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

import {
  formatDuration,
  generateWorklogs,
  rangePresets,
  resolveRange,
  toDateKey,
  type RangePreset,
  type WorklogEntry,
} from "@/lib/worklog-data";

export const Route = createFileRoute("/worklogs")({
  head: () => ({
    meta: [
      { title: "Worklogs — Ray ERP" },
      {
        name: "description",
        content:
          "Daily work reports submitted by employees, filterable by day, week, month or a custom range.",
      },
      { property: "og:title", content: "Worklogs — Ray ERP" },
      {
        property: "og:description",
        content: "Employee daily work submissions with tasks, projects and logged hours.",
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
  const [detail, setDetail] = useState<WorklogEntry | null>(null);

  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
  }, []);

  const all = useMemo(() => (today ? generateWorklogs(today) : []), [today]);

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
      .filter((r) => employee === "all" || r.employee === employee)
      .sort((a, b) =>
        a.date === b.date ? a.employee.localeCompare(b.employee) : b.date.localeCompare(a.date),
      );
  }, [all, range, employee]);

  const employees = useMemo(
    () => Array.from(new Set(all.map((r) => r.employee))).sort(),
    [all],
  );

  const totals = useMemo(() => {
    const submitted = rows.filter((r) => r.status !== "Missing");
    return {
      submitted: submitted.length,
      missing: rows.length - submitted.length,
      minutes: submitted.reduce((s, r) => s + r.totalMinutes, 0),
      people: new Set(submitted.map((r) => r.employee)).size,
    };
  }, [rows]);

  const columns: Column<WorklogEntry>[] = [
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
    {
      key: "summary",
      header: "Report",
      searchable: true,
      accessor: (r) => r.summary,
      cell: (r) => (
        <span className="line-clamp-2 max-w-md text-muted-foreground">{r.summary}</span>
      ),
    },
    {
      key: "tasks",
      header: "Tasks",
      accessor: (r) => r.tasks.length,
      cell: (r) => r.tasks.length || "—",
    },
    {
      key: "projects",
      header: "Projects",
      cell: (r) =>
        r.tasks.length ? Array.from(new Set(r.tasks.map((t) => t.project))).join(", ") : "—",
    },
    {
      key: "totalMinutes",
      header: "Logged",
      accessor: (r) => r.totalMinutes,
      cell: (r) => (
        <span className="font-medium text-foreground">{formatDuration(r.totalMinutes)}</span>
      ),
    },
    { key: "submittedAt", header: "Submitted", cell: (r) => r.submittedAt ?? "—" },
    { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Worklogs"
        description="Daily work reports submitted by employees — tasks, projects and hours logged."
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
                className="pointer-events-auto p-3"
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
        <StatCard
          icon={ClipboardList}
          label="Reports Submitted"
          value={totals.submitted}
          caption={`${rows.length} expected`}
          highlight
        />
        <StatCard icon={Timer} label="Hours Logged" value={formatDuration(totals.minutes)} caption="Across selected range" />
        <StatCard icon={Users} label="Employees Reporting" value={totals.people} caption="Unique submitters" />
        <StatCard icon={FileWarning} label="Missing Reports" value={totals.missing} caption="Not submitted" />
      </div>

      {!today ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
          Loading worklogs…
        </div>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          onRowClick={(r) => setDetail(r)}
          filters={[
            { key: "status", label: "Status", options: ["Approved", "Submitted", "Late", "Missing"] },
          ]}
          emptyMessage={
            preset === "custom" && !custom?.from
              ? "Pick a custom date range to see work reports."
              : "No work reports in this range."
          }
        />
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.employee}</DialogTitle>
            <DialogDescription>
              {detail?.department} · {detail?.date} ·{" "}
              {detail?.submittedAt ? `submitted ${detail.submittedAt}` : "not submitted"}
            </DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="space-y-4">
              <p className="rounded-lg border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
                {detail.summary}
              </p>

              <div className="scrollbar-slim max-h-[45vh] overflow-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-secondary/70 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      {["Task", "Project", "Time"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.tasks.map((t, i) => (
                      <tr key={`${t.title}-${i}`} className="border-t border-border/60">
                        <td className="px-3 py-2 text-foreground">{t.title}</td>
                        <td className="px-3 py-2 text-muted-foreground">{t.project}</td>
                        <td className="px-3 py-2 font-medium">{formatDuration(t.minutes)}</td>
                      </tr>
                    ))}
                    {detail.tasks.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                          No tasks reported for this day.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <StatusPill status={detail.status} />
                <p className="text-sm text-muted-foreground">
                  Total logged:{" "}
                  <span className="font-semibold text-foreground">
                    {formatDuration(detail.totalMinutes)}
                  </span>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
