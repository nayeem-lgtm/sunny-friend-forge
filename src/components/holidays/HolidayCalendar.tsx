import { useMemo } from "react";
import { PartyPopper, CalendarClock, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import {
  durationDays,
  formatRange,
  holidayTypeDot,
  holidayTypeTone,
  holidaysOn,
  iso,
  type Holiday,
} from "@/lib/holiday-store";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export function HolidayHoverBody({ holiday }: { holiday: Holiday }) {
  const days = durationDays(holiday);
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <span className={cn("mt-1 size-2 shrink-0 rounded-full", holidayTypeDot[holiday.type])} />
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{holiday.name}</p>
          <p className="text-xs text-muted-foreground">{formatRange(holiday)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className={cn("ring-1", holidayTypeTone[holiday.type])}>
          {holiday.type}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <CalendarClock className="size-3" /> {days} {days === 1 ? "day" : "days"} off
        </Badge>
        {holiday.postponedFrom && holiday.postponedFrom !== holiday.start && (
          <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
            Postponed
          </Badge>
        )}
      </div>
      {holiday.greeting && (
        <p className="flex gap-1.5 rounded-lg bg-muted/60 p-2 text-xs italic text-muted-foreground">
          <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" />
          {holiday.greeting}
        </p>
      )}
      {holiday.note && <p className="text-xs text-muted-foreground">{holiday.note}</p>}
    </div>
  );
}

export function HolidayCalendar({
  year,
  holidays,
  onSelectHoliday,
}: {
  year: number;
  holidays: Holiday[];
  onSelectHoliday?: (h: Holiday) => void;
}) {
  const todayKey = iso(new Date());

  const months = useMemo(() => Array.from({ length: 12 }, (_, m) => m), []);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {months.map((m) => {
        const cells = monthMatrix(year, m);
        return (
          <div
            key={m}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold tracking-tight">
                {new Date(year, m, 1).toLocaleDateString(undefined, { month: "long" })}
              </p>
              <span className="text-[11px] text-muted-foreground">{year}</span>
            </div>
            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase text-muted-foreground">
              {WEEKDAYS.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((date) => {
                const outside = date.getMonth() !== m;
                const key = iso(date);
                const matches = outside ? [] : holidaysOn(holidays, date);
                const holiday = matches[0];
                const isToday = key === todayKey;

                const cell = (
                  <button
                    type="button"
                    disabled={!holiday}
                    onClick={() => holiday && onSelectHoliday?.(holiday)}
                    className={cn(
                      "relative flex aspect-square w-full items-center justify-center rounded-lg text-xs transition-all",
                      outside && "text-muted-foreground/35",
                      !outside && !holiday && "text-foreground/80 hover:bg-muted",
                      holiday &&
                        "font-semibold text-primary-foreground shadow-sm ring-1 ring-inset hover:scale-[1.06]",
                      holiday && holiday.type === "Public" && "bg-primary ring-primary/40",
                      holiday && holiday.type === "Company" && "bg-emerald-500 ring-emerald-500/40",
                      holiday && holiday.type === "Optional" && "bg-amber-500 ring-amber-500/40",
                      holiday && holiday.type === "Observance" && "bg-violet-500 ring-violet-500/40",
                      isToday && "ring-2 ring-offset-2 ring-offset-card ring-foreground",
                    )}
                  >
                    {date.getDate()}
                    {matches.length > 1 && (
                      <span className="absolute bottom-0.5 right-1 size-1 rounded-full bg-primary-foreground/80" />
                    )}
                  </button>
                );

                if (!holiday) return <div key={key}>{cell}</div>;

                return (
                  <HoverCard key={key} openDelay={80} closeDelay={60}>
                    <HoverCardTrigger asChild>{cell}</HoverCardTrigger>
                    <HoverCardContent className="w-72 space-y-3">
                      {matches.map((h) => (
                        <HolidayHoverBody key={h.id} holiday={h} />
                      ))}
                      {isToday && (
                        <p className="flex items-center gap-1.5 border-t border-border pt-2 text-xs font-medium text-primary">
                          <PartyPopper className="size-3.5" /> That&apos;s today — enjoy!
                        </p>
                      )}
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HolidayLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {(Object.keys(holidayTypeDot) as Holiday["type"][]).map((t) => (
        <span key={t} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", holidayTypeDot[t])} /> {t}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full ring-2 ring-foreground" /> Today
      </span>
    </div>
  );
}
