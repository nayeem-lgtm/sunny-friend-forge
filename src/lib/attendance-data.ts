export type AttendanceRecord = {
  id: string;
  date: string; // yyyy-MM-dd
  employee: string;
  department: string;
  clockIn: string | null; // HH:mm
  breakStart: string | null;
  breakEnd: string | null;
  clockOut: string | null;
  workedMinutes: number;
  idleMinutes: number;
  breakMinutes: number;
  status: "Present" | "Late" | "On Break" | "Absent";
};

const people: [string, string][] = [
  ["Arlene Lane", "Business Development Department"],
  ["Devon Reed", "IT Department"],
  ["Marvin Hall", "Affiliate Department"],
  ["Kristin Ward", "QA Department"],
  ["Cody Fisher", "IT Department"],
  ["Jenny Wilson", "Business Development Department"],
  ["Guy Hawkins", "Affiliate Department"],
  ["Esther Howard", "QA Department"],
  ["Ralph Edwards", "IT Department"],
  ["Courtney Henry", "Accounting Department"],
];

/** deterministic pseudo-random so SSR and client agree */
function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const pad = (n: number) => String(n).padStart(2, "0");
const toTime = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

export function formatDuration(mins: number) {
  if (mins <= 0) return "0m";
  return `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`;
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Generates ~90 days of attendance history ending today. */
export function generateAttendance(today: Date): AttendanceRecord[] {
  const rows: AttendanceRecord[] = [];
  for (let d = 0; d < 90; d++) {
    const day = new Date(today);
    day.setDate(day.getDate() - d);
    const dow = day.getDay();
    if (dow === 5 || dow === 6) continue; // agency weekend

    people.forEach(([employee, department], p) => {
      const seed = d * 31 + p * 7;
      const r1 = rand(seed);
      const r2 = rand(seed + 1);
      const r3 = rand(seed + 2);

      if (r1 > 0.94) {
        rows.push({
          id: `${toDateKey(day)}-${p}`,
          date: toDateKey(day),
          employee,
          department,
          clockIn: null,
          breakStart: null,
          breakEnd: null,
          clockOut: null,
          workedMinutes: 0,
          idleMinutes: 0,
          breakMinutes: 0,
          status: "Absent",
        });
        return;
      }

      const inMin = 9 * 60 + Math.round(r1 * 55); // 09:00 - 09:55
      const breakStart = 13 * 60 + Math.round(r2 * 40);
      const breakLen = 30 + Math.round(r3 * 35);
      const breakEnd = breakStart + breakLen;
      const outMin = 18 * 60 + Math.round(r2 * 70);
      const gross = outMin - inMin - breakLen;
      const idle = Math.round(r3 * 70);
      const worked = gross - idle;
      const late = inMin > 9 * 60 + 15;
      const onBreak = d === 0 && r2 > 0.75;

      rows.push({
        id: `${toDateKey(day)}-${p}`,
        date: toDateKey(day),
        employee,
        department,
        clockIn: toTime(inMin),
        breakStart: toTime(breakStart),
        breakEnd: onBreak ? null : toTime(breakEnd),
        clockOut: onBreak ? null : toTime(outMin),
        workedMinutes: worked,
        idleMinutes: idle,
        breakMinutes: breakLen,
        status: onBreak ? "On Break" : late ? "Late" : "Present",
      });
    });
  }
  return rows;
}

export type RangePreset = "today" | "yesterday" | "7d" | "month" | "lastMonth" | "custom";

export const rangePresets: { key: RangePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 Days" },
  { key: "month", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "custom", label: "Custom" },
];

export function resolveRange(preset: RangePreset, today: Date): { from: Date; to: Date } {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  switch (preset) {
    case "yesterday": {
      const y = new Date(start);
      y.setDate(y.getDate() - 1);
      return { from: y, to: y };
    }
    case "7d": {
      const f = new Date(start);
      f.setDate(f.getDate() - 6);
      return { from: f, to: start };
    }
    case "month":
      return { from: new Date(start.getFullYear(), start.getMonth(), 1), to: start };
    case "lastMonth":
      return {
        from: new Date(start.getFullYear(), start.getMonth() - 1, 1),
        to: new Date(start.getFullYear(), start.getMonth(), 0),
      };
    default:
      return { from: start, to: start };
  }
}
