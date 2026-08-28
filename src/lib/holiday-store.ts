import { useCallback, useEffect, useState } from "react";

export type HolidayType = "Public" | "Company" | "Optional" | "Observance";

export type Holiday = {
  id: string;
  name: string;
  /** yyyy-mm-dd */
  start: string;
  /** yyyy-mm-dd (inclusive) */
  end: string;
  type: HolidayType;
  greeting?: string;
  note?: string;
  /** original start date if the holiday was postponed */
  postponedFrom?: string;
};

const KEY = "omniwork.holidays.v1";
const EVENT = "omniwork:holidays";

export const holidayTypes: HolidayType[] = ["Public", "Company", "Optional", "Observance"];

export const holidayTypeTone: Record<HolidayType, string> = {
  Public: "bg-primary/15 text-primary ring-primary/30",
  Company: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400",
  Optional: "bg-amber-500/15 text-amber-600 ring-amber-500/30 dark:text-amber-400",
  Observance: "bg-violet-500/15 text-violet-600 ring-violet-500/30 dark:text-violet-400",
};

export const holidayTypeDot: Record<HolidayType, string> = {
  Public: "bg-primary",
  Company: "bg-emerald-500",
  Optional: "bg-amber-500",
  Observance: "bg-violet-500",
};

export function iso(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function durationDays(h: Holiday) {
  const a = parseISO(h.start).getTime();
  const b = parseISO(h.end).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

export function formatRange(h: Holiday) {
  const fmt = (s: string) =>
    parseISO(s).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  return h.start === h.end ? fmt(h.start) : `${fmt(h.start)} – ${fmt(h.end)}`;
}

function defaults(year: number): Holiday[] {
  const y = year;
  const mk = (
    id: string,
    name: string,
    start: string,
    end: string,
    type: HolidayType,
    greeting: string,
  ): Holiday => ({ id: `${id}-${y}`, name, start: `${y}-${start}`, end: `${y}-${end}`, type, greeting });

  return [
    mk("newyear", "New Year's Day", "01-01", "01-01", "Public", "Wishing you a bright and successful new year!"),
    mk("intl-mother-lang", "International Mother Language Day", "02-21", "02-21", "Observance", "Honouring our language and heritage."),
    mk("independence", "Independence Day", "03-26", "03-26", "Public", "Happy Independence Day — celebrate freedom!"),
    mk("newyear-bn", "Bengali New Year", "04-14", "04-14", "Public", "Shubho Noboborsho! A fresh start for all."),
    mk("mayday", "May Day", "05-01", "05-01", "Public", "Thank you for all your hard work."),
    mk("eid-adha", "Eid-ul-Adha", "06-06", "06-09", "Public", "Eid Mubarak to you and your family!"),
    mk("company-retreat", "Company Retreat", "08-14", "08-15", "Company", "Time to recharge together."),
    mk("victory", "Victory Day", "12-16", "12-16", "Public", "Proud of our history — Happy Victory Day!"),
    mk("christmas", "Christmas Day", "12-25", "12-25", "Public", "Merry Christmas and warm wishes!"),
    mk("yearend", "Year-end Break", "12-31", "12-31", "Company", "Enjoy the break — see you next year!"),
  ];
}

function read(): Holiday[] {
  if (typeof window === "undefined") return defaults(new Date().getFullYear());
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaults(new Date().getFullYear());
    return JSON.parse(raw) as Holiday[];
  } catch {
    return defaults(new Date().getFullYear());
  }
}

function write(list: Holiday[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore */
  }
}

export function useHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>(() => defaults(new Date().getFullYear()));

  useEffect(() => {
    const sync = () => setHolidays(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((next: Holiday[]) => {
    write(next);
    setHolidays(next);
  }, []);

  const add = useCallback(
    (h: Omit<Holiday, "id">) => save([...read(), { ...h, id: crypto.randomUUID() }]),
    [save],
  );

  const update = useCallback(
    (id: string, patch: Partial<Holiday>) =>
      save(read().map((h) => (h.id === id ? { ...h, ...patch } : h))),
    [save],
  );

  const remove = useCallback((id: string) => save(read().filter((h) => h.id !== id)), [save]);

  const postpone = useCallback(
    (id: string, start: string, end: string) =>
      save(
        read().map((h) =>
          h.id === id ? { ...h, postponedFrom: h.postponedFrom ?? h.start, start, end } : h,
        ),
      ),
    [save],
  );

  const reset = useCallback(
    (year: number) => save(defaults(year)),
    [save],
  );

  return { holidays, add, update, remove, postpone, reset };
}

export function holidaysOn(list: Holiday[], date: Date) {
  const key = iso(date);
  return list.filter((h) => key >= h.start && key <= h.end);
}

export function sortHolidays(list: Holiday[]) {
  return [...list].sort((a, b) => a.start.localeCompare(b.start));
}
