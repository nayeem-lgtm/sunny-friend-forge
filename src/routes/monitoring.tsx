import { createFileRoute } from "@tanstack/react-router";
import { CalendarIcon, Camera, MonitorPlay, Search, Activity } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { ShotThumb } from "@/components/monitoring/ShotThumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { departments } from "@/lib/employee-data";
import {
  formatDay,
  formatTime,
  generateShots,
  generateShotsForRange,
  monitoringPeople,
  type Shot,
} from "@/lib/monitoring-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Screen Monitoring — WorkBoard" },
      {
        name: "description",
        content:
          "Browse employee desktop screenshots captured every 5 minutes, filtered by day, employee or department.",
      },
      { property: "og:title", content: "Screen Monitoring — WorkBoard" },
      {
        property: "og:description",
        content: "Employee screen captures with timestamps, filterable by date, person and team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Preset = "today" | "yesterday" | "custom";

function Page() {
  const [today, setToday] = useState<Date | null>(null);
  const [preset, setPreset] = useState<Preset>("today");
  const [range, setRange] = useState<DateRange | undefined>();
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [employee, setEmployee] = useState("all");
  const [visible, setVisible] = useState(60);
  const [active, setActive] = useState<Shot | null>(null);

  useEffect(() => setToday(new Date()), []);

  const shots = useMemo(() => {
    if (!today) return [];
    if (preset === "today") return generateShots(today);
    if (preset === "yesterday") {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      return generateShots(d);
    }
    if (range?.from) return generateShotsForRange(range.from, range.to ?? range.from);
    return generateShots(today);
  }, [today, preset, range]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shots.filter(
      (s) =>
        (dept === "all" || s.department === dept) &&
        (employee === "all" || s.employee === employee) &&
        (!q || s.employee.toLowerCase().includes(q) || s.app.toLowerCase().includes(q)),
    );
  }, [shots, query, dept, employee]);

  useEffect(() => setVisible(60), [preset, range, query, dept, employee]);

  const people = useMemo(
    () =>
      monitoringPeople
        .filter((p) => dept === "all" || p.department === dept)
        .map((p) => p.name)
        .sort(),
    [dept],
  );

  const uniqueEmployees = new Set(filtered.map((s) => s.employee)).size;
  const avgActivity = filtered.length
    ? Math.round(filtered.reduce((a, s) => a + s.activity, 0) / filtered.length)
    : 0;
  const lastCapture = filtered[0] ? formatTime(filtered[0].at) : "—";

  const rangeLabel =
    preset === "today"
      ? "Today"
      : preset === "yesterday"
        ? "Yesterday"
        : range?.from
          ? `${range.from.toLocaleDateString()}${range.to && range.to !== range.from ? ` – ${range.to.toLocaleDateString()}` : ""}`
          : "Pick dates";

  return (
    <AppShell>
      <PageHeader
        title="Screen Monitoring"
        description="Desktop screenshots captured automatically every 5 minutes on employee workstations."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Screenshots" value={String(filtered.length)} icon={Camera} />
        <StatCard label="Employees captured" value={String(uniqueEmployees)} icon={MonitorPlay} />
        <StatCard label="Avg activity" value={`${avgActivity}%`} icon={Activity} />
        <StatCard label="Latest capture" value={lastCapture} icon={CalendarIcon} />
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="min-w-56 flex-1">
          <label className="mb-1.5 block text-xs text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Employee or app"
              className="pl-9"
            />
          </div>
        </div>

        <div className="w-48">
          <label className="mb-1.5 block text-xs text-muted-foreground">Department</label>
          <Select
            value={dept}
            onValueChange={(v) => {
              setDept(v);
              setEmployee("all");
            }}
          >
            <SelectTrigger>
              <SelectValue />
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
        </div>

        <div className="w-52">
          <label className="mb-1.5 block text-xs text-muted-foreground">Employee</label>
          <Select value={employee} onValueChange={setEmployee}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All employees</SelectItem>
              {people.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {(["today", "yesterday"] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={preset === p ? "default" : "outline"}
              onClick={() => setPreset(p)}
              className="capitalize"
            >
              {p}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant={preset === "custom" ? "default" : "outline"}>
                <CalendarIcon className="mr-1.5 size-4" />
                {preset === "custom" ? rangeLabel : "Custom"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                mode="range"
                selected={range}
                onSelect={(r) => {
                  setRange(r);
                  setPreset("custom");
                }}
                numberOfMonths={2}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {rangeLabel} · {filtered.length} screenshots
        </span>
        <span>Capture interval: 5 minutes</span>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 flex h-56 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
          No screenshots captured for this selection.
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtered.slice(0, visible).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s)}
                className="group overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-primary/60 hover:shadow-lg"
              >
                <ShotThumb id={s.id} app={s.app} className="h-40 w-full rounded-none border-0" />
                <div className="space-y-1 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{s.employee}</span>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {s.activity}%
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{s.windowTitle}</p>
                  <p className="text-xs font-medium text-primary">
                    {formatTime(s.at)}
                    <span className="ml-1.5 font-normal text-muted-foreground">
                      · {formatDay(s.at)}
                    </span>
                  </p>
                </div>
              </button>
            ))}
          </div>

          {visible < filtered.length && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={() => setVisible((v) => v + 60)}>
                Load more screenshots
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-4xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.employee}</DialogTitle>
                <DialogDescription>
                  {formatDay(active.at)} · {formatTime(active.at)} · {active.department}
                </DialogDescription>
              </DialogHeader>
              <ShotThumb id={active.id} app={active.app} className="h-[420px] w-full" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Timestamp", formatTime(active.at)],
                  ["Activity", `${active.activity}%`],
                  ["Application", active.app],
                  ["Window", active.windowTitle],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{k}</p>
                    <p className="mt-0.5 truncate text-sm font-medium">{v}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
