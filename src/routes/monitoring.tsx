import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarIcon,
  Camera,
  CircleSlash,
  Eye,
  Globe,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
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
  formatDuration,
  formatTime,
  generateShots,
  generateShotsForRange,
  getLiveStatuses,
  type LiveStatus,
  type Shot,
} from "@/lib/monitoring-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Screen Monitoring — OmniWork" },
      {
        name: "description",
        content:
          "Live employee activity status and desktop screenshots captured every 5 minutes.",
      },
      { property: "og:title", content: "Screen Monitoring — OmniWork" },
      {
        property: "og:description",
        content: "Live teammate status cards with click-through screenshot history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function relative(ms: number | null) {
  if (!ms) return "No captures today";
  const diff = Math.round((Date.now() - ms) / 60000);
  if (diff <= 1) return "Last seen: just now";
  if (diff < 60) return `Last seen: ${diff}m ago`;
  return `Last seen: ${Math.floor(diff / 60)}h ${diff % 60}m ago`;
}

function Page() {
  const [now, setNow] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [dept, setDept] = useState("all");
  const [selected, setSelected] = useState<LiveStatus | null>(null);

  useEffect(() => setNow(new Date()), []);

  const statuses = useMemo(() => (now ? getLiveStatuses(now) : []), [now]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return statuses.filter(
      (s) =>
        (dept === "all" || s.department === dept) &&
        (status === "all" || (status === "live" ? s.live : !s.live)) &&
        (!q || s.name.toLowerCase().includes(q) || s.designation.toLowerCase().includes(q)),
    );
  }, [statuses, query, status, dept]);

  const liveCount = statuses.filter((s) => s.live).length;
  const offlineCount = statuses.length - liveCount;

  if (selected) {
    return (
      <AppShell>
        <EmployeeShots person={selected} onBack={() => setSelected(null)} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Screen Monitoring"
        description="Live workstation activity. Select a teammate to browse their screenshot history."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/10 p-5">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Globe className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-semibold">{liveCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-5">
          <span className="flex size-11 items-center justify-center rounded-lg bg-destructive/20 text-destructive">
            <CircleSlash className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Offline</p>
            <p className="text-2xl font-semibold">{offlineCount}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Search employee</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Department</label>
          <Select value={dept} onValueChange={setDept}>
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
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((p) => (
          <div
            key={p.name}
            className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="flex size-11 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {initials(p.name)}
                  </span>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card",
                      p.live ? "bg-primary" : "bg-muted-foreground",
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.designation}</p>
                </div>
              </div>
              <Badge
                variant={p.live ? "default" : "destructive"}
                className="shrink-0 text-[10px]"
              >
                {p.live ? "Live" : "Offline"}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Tile label="Department" value={p.department} muted />
              <Tile label="Activity" value={`${p.activity}%`} />
              <Tile label="Active time" value={formatDuration(p.activeMinutes)} />
              <Tile label="Idle time" value={formatDuration(p.idleMinutes)} />
            </div>

            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              {p.live ? relative(p.lastSeen) : p.lastSeen ? relative(p.lastSeen) : "Offline"}
            </p>
            <Button
              variant="secondary"
              className="mt-3 w-full"
              onClick={() => setSelected(p)}
            >
              <Eye className="mr-2 size-4" /> View details
            </Button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-6 flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          No teammates match these filters.
        </div>
      )}
    </AppShell>
  );
}

function Tile({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 truncate text-sm font-medium", muted && "text-muted-foreground")}>
        {value}
      </p>
    </div>
  );
}

type Preset = "today" | "yesterday" | "custom";

function EmployeeShots({ person, onBack }: { person: LiveStatus; onBack: () => void }) {
  const [today, setToday] = useState<Date | null>(null);
  const [preset, setPreset] = useState<Preset>("today");
  const [range, setRange] = useState<DateRange | undefined>();
  const [visible, setVisible] = useState(60);
  const [active, setActive] = useState<Shot | null>(null);

  useEffect(() => setToday(new Date()), []);
  useEffect(() => setVisible(60), [preset, range]);

  const shots = useMemo(() => {
    if (!today) return [];
    let all: Shot[];
    if (preset === "yesterday") {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      all = generateShots(d);
    } else if (preset === "custom" && range?.from) {
      all = generateShotsForRange(range.from, range.to ?? range.from);
    } else {
      all = generateShots(today);
    }
    return all.filter((s) => s.employee === person.name);
  }, [today, preset, range, person.name]);

  const rangeLabel =
    preset === "today"
      ? "Today"
      : preset === "yesterday"
        ? "Yesterday"
        : range?.from
          ? `${range.from.toLocaleDateString()}${range.to && range.to !== range.from ? ` – ${range.to.toLocaleDateString()}` : ""}`
          : "Pick dates";

  return (
    <>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 -ml-2">
        <ArrowLeft className="mr-1.5 size-4" /> Back to monitoring
      </Button>

      <PageHeader
        title={person.name}
        description={`${person.designation} · ${person.department} · captures every 5 minutes`}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-4">
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
          <PopoverContent align="start" className="w-auto p-0">
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
        <span className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Camera className="size-4" /> {shots.length} screenshots · {rangeLabel}
        </span>
      </div>

      {shots.length === 0 ? (
        <div className="mt-4 flex h-56 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
          No screenshots captured for this selection.
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {shots.slice(0, visible).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s)}
                className="group overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-primary/60 hover:shadow-lg"
              >
                <ShotThumb id={s.id} app={s.app} className="h-40 w-full rounded-none border-0" />
                <div className="space-y-1 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-primary">
                      {formatTime(s.at)}
                    </span>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {s.activity}%
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{s.windowTitle}</p>
                  <p className="truncate text-xs text-muted-foreground">{formatDay(s.at)}</p>
                </div>
              </button>
            ))}
          </div>

          {visible < shots.length && (
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
    </>
  );
}
