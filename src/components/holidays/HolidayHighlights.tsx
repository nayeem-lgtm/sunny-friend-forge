import { CalendarDays, PartyPopper, Sun, Timer } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  durationDays,
  formatRange,
  holidayTypeTone,
  holidaysOn,
  iso,
  parseISO,
  sortHolidays,
  type Holiday,
} from "@/lib/holiday-store";
import { Badge } from "@/components/ui/badge";

export function HolidayHighlights({ holidays, year }: { holidays: Holiday[]; year: number }) {
  const today = new Date();
  const todayKey = iso(today);
  const inYear = sortHolidays(holidays.filter((h) => h.start.startsWith(String(year))));
  const todays = holidaysOn(holidays, today);
  const upcoming = sortHolidays(holidays.filter((h) => h.end >= todayKey));
  const next = upcoming[0];
  const daysAway = next
    ? Math.max(0, Math.round((parseISO(next.start).getTime() - parseISO(todayKey).getTime()) / 86400000))
    : 0;
  const totalDays = inYear.reduce((sum, h) => sum + durationDays(h), 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-5 lg:col-span-2">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/20 blur-3xl" />
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {todays.length ? "Today" : "Next holiday"}
        </p>
        {todays.length ? (
          <>
            <h3 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <PartyPopper className="size-6 text-primary" /> {todays[0]!.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{todays[0]!.greeting}</p>
          </>
        ) : next ? (
          <>
            <h3 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Sun className="size-6 text-primary" /> {next.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatRange(next)} · {daysAway === 0 ? "starts today" : `in ${daysAway} day${daysAway === 1 ? "" : "s"}`}
            </p>
            {next.greeting && <p className="mt-2 text-sm italic text-muted-foreground">{next.greeting}</p>}
          </>
        ) : (
          <h3 className="mt-1 text-2xl font-semibold tracking-tight">No holidays scheduled</h3>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          {today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <CalendarDays className="size-4" /> Holidays in {year}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{inYear.length}</p>
          <p className="text-xs text-muted-foreground">{totalDays} total days off</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Timer className="size-4" /> Coming up
          </p>
          <div className="mt-2 space-y-2">
            {upcoming.slice(0, 3).map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-sm">{h.name}</span>
                <Badge variant="secondary" className={cn("shrink-0 ring-1", holidayTypeTone[h.type])}>
                  {parseISO(h.start).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </Badge>
              </div>
            ))}
            {!upcoming.length && <p className="text-sm text-muted-foreground">Nothing scheduled.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
