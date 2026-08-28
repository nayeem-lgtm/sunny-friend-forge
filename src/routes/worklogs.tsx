import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarIcon,
  ChevronsUpDown,
  ClipboardList,
  FileWarning,
  FileText,
  UserSearch,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { AppShell } from "@/components/layout/AppShell";
import { departments, employees as directory } from "@/lib/employee-data";
import { Badge } from "@/components/ui/badge";
import { loadMyWorklogs } from "@/lib/my-requests-store";
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
      { title: "Worklogs — OmniWork" },
      {
        name: "description",
        content:
          "Daily EOD reports submitted by employees, filterable by day, week, month or a custom range.",
      },
      { property: "og:title", content: "Worklogs — OmniWork" },
      {
        property: "og:description",
        content: "Employee end-of-day report submissions with submit time and status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const fmt = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const fmtStamp = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const richClasses =
  "prose-sm max-w-none whitespace-pre-wrap [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5";

const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** Overlay reports filed (and edited) from the employee portal onto the records. */
function mergePortalLogs(base: WorklogEntry[]): WorklogEntry[] {
  const portal = loadMyWorklogs();
  if (portal.length === 0) return base;
  const rows = [...base];
  for (const log of portal) {
    const person = directory.find((e) => e.id === log.employeeId);
    if (!person) continue;
    const name = `${person.firstName} ${person.lastName}`;
    const stamp = new Date(log.updatedAt ?? log.submittedAt);
    const entry: WorklogEntry = {
      id: log.id,
      date: log.date,
      employee: name,
      department: person.department,
      report: log.report,
      submittedAt: `${String(stamp.getHours()).padStart(2, "0")}:${String(
        stamp.getMinutes(),
      ).padStart(2, "0")}`,
      status: "Submitted",
      rich: true,
      ...(log.updatedAt ? { updatedAt: log.updatedAt } : {}),
      ...(log.revisions ? { revisions: log.revisions } : {}),
    };
    const i = rows.findIndex((r) => r.date === log.date && r.employee === name);
    if (i >= 0) rows[i] = entry;
    else rows.push(entry);
  }
  return rows;
}

function Page() {
  const [today, setToday] = useState<Date | null>(null);
  const [preset, setPreset] = useState<RangePreset>("today");
  const [custom, setCustom] = useState<DateRange | undefined>();
  const [employee, setEmployee] = useState<string>("all");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detail, setDetail] = useState<WorklogEntry | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
  }, []);

  const all = useMemo(() => (today ? mergePortalLogs(generateWorklogs(today)) : []), [today]);

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
    const submitted = rows.filter((r) => r.status === "Submitted");
    return {
      submitted: submitted.length,
      missing: rows.length - submitted.length,
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
      key: "report",
      header: "EOD Report",
      searchable: true,
      accessor: (r) => stripHtml(r.report),
      cell: (r) => (
        <span
          className="line-clamp-1 max-w-[16rem] text-muted-foreground"
          title={r.status === "Submitted" ? stripHtml(r.report) : undefined}
        >
          {r.status === "Submitted" ? stripHtml(r.report) : "—"}
        </span>
      ),
    },
    {
      key: "submittedAt",
      header: "Submitted At",
      accessor: (r) => r.submittedAt ?? "",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <span>{r.submittedAt ?? "—"}</span>
          {r.updatedAt && (
            <Badge variant="outline" className="text-[10px]">
              Edited {fmtStamp(r.updatedAt)}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusPill status={r.status} />,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Worklogs"
        description="Daily EOD reports submitted by employees — paragraph submissions with submit time and status."
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
        <StatCard
          icon={Users}
          label="Employees Reporting"
          value={totals.people}
          caption="Unique submitters"
        />
        <StatCard
          icon={FileWarning}
          label="Missing Reports"
          value={totals.missing}
          caption="Not submitted"
        />
        <StatCard
          icon={FileText}
          label="Submission Rate"
          value={rows.length ? `${Math.round((totals.submitted / rows.length) * 100)}%` : "0%"}
          caption="Across selected range"
        />
      </div>

      {!today ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
          Loading worklogs…
        </div>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          onRowClick={(r) => {
            setHistoryOpen(false);
            setDetail(r);
          }}
          filters={[
            { key: "department", label: "Departments", options: departments },
            { key: "status", label: "Status", options: ["Submitted", "Not Submitted"] },
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
              {detail.status === "Submitted" ? (
                <div className="max-h-[50vh] overflow-auto rounded-lg border border-border bg-secondary/40 p-4">
                  {detail.rich ? (
                    <div
                      className={`${richClasses} text-sm leading-relaxed text-foreground`}
                      dangerouslySetInnerHTML={{ __html: detail.report }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {detail.report}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
                  No EOD report was submitted for this day.
                </div>
              )}

              {detail.updatedAt && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <History className="size-3.5" />
                    <span>Last updated by the employee {fmtStamp(detail.updatedAt)}</span>
                    <Badge variant="outline">
                      {(detail.revisions?.length ?? 0)} edit
                      {(detail.revisions?.length ?? 0) === 1 ? "" : "s"}
                    </Badge>
                    {(detail.revisions?.length ?? 0) > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto h-6 px-2 text-xs"
                        onClick={() => setHistoryOpen((v) => !v)}
                      >
                        {historyOpen ? "Hide" : "View"} update history
                      </Button>
                    )}
                  </div>
                  {historyOpen && (
                    <ol className="mt-3 space-y-3 border-l border-border pl-3">
                      {(detail.revisions ?? [])
                        .slice()
                        .reverse()
                        .map((rev, i) => (
                          <li key={`${rev.at}-${i}`}>
                            <p className="text-xs font-medium text-muted-foreground">
                              Version before edit on {fmtStamp(rev.at)}
                            </p>
                            <div
                              className={`${richClasses} mt-1 text-sm text-muted-foreground`}
                              dangerouslySetInnerHTML={{ __html: rev.report }}
                            />
                          </li>
                        ))}
                    </ol>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <StatusPill status={detail.status} />
                <p className="text-sm text-muted-foreground">
                  Submitted at:{" "}
                  <span className="font-semibold text-foreground">
                    {detail.submittedAt ?? "—"}
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
