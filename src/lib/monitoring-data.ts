import { employees } from "@/lib/employee-data";

export type Shot = {
  id: string;
  employee: string;
  department: string;
  /** epoch ms */
  at: number;
  activity: number; // 0-100
  app: string;
  windowTitle: string;
};

const apps = [
  ["Chrome", "Amazon Seller Central — Orders"],
  ["Chrome", "Walmart Marketplace — Listings"],
  ["Slack", "#affiliate-ops"],
  ["Google Sheets", "Q3 Campaign Tracker"],
  ["VS Code", "workboard/src/routes/projects.tsx"],
  ["Gmail", "Inbox (14)"],
  ["Figma", "Landing page v3"],
  ["Zoom", "Daily standup"],
  ["Notion", "SOP — QA checklist"],
  ["Excel", "Payroll-August.xlsx"],
] as const;

const people = employees
  .filter((e) => e.status === "Active")
  .map((e) => ({ name: `${e.firstName} ${e.lastName}`, department: e.department }));

export const monitoringPeople = people;

function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatTime(ms: number) {
  const d = new Date(ms);
  let h = d.getHours();
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${pad(h)}:${pad(d.getMinutes())} ${suffix}`;
}

export function formatDay(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Screenshots captured every 5 minutes during work hours for a single day. */
export function generateShots(day: Date): Shot[] {
  const key = toDateKey(day);
  const base = new Date(day);
  base.setHours(0, 0, 0, 0);
  const daySeed = Math.round(base.getTime() / 86400000);
  const now = Date.now();

  const isToday = toDateKey(new Date(now)) === key;
  const nowMin = isToday
    ? Math.floor((now - base.getTime()) / 60000)
    : 24 * 60;

  const shots: Shot[] = [];
  people.forEach((p, pi) => {
    const s0 = rand(daySeed * 13 + pi * 7);
    if (s0 > 0.82) return; // not working / offline that day
    let start = 9 * 60 + Math.round(rand(daySeed + pi) * 60);
    let end = 18 * 60 + Math.round(rand(daySeed + pi * 3) * 60);
    // Early in the day (or overnight shifts): show the most recent hours instead of nothing.
    if (nowMin < start + 60) {
      end = Math.max(nowMin, 60);
      start = Math.max(0, end - (7 * 60 + Math.round(rand(daySeed + pi) * 120)));
    }
    for (let m = start; m <= end; m += 5) {

      const seed = daySeed * 101 + pi * 37 + m;
      const r = rand(seed);
      if (r > 0.93) continue; // capture gap
      const ts = base.getTime() + m * 60000;
      if (ts > now) break;
      const a = apps[Math.floor(rand(seed + 5) * apps.length)]!;
      shots.push({
        id: `${key}-${pi}-${m}`,
        employee: p.name,
        department: p.department,
        at: ts,
        activity: Math.round(20 + rand(seed + 9) * 80),
        app: a[0],
        windowTitle: a[1],
      });
    }
  });
  return shots.sort((a, b) => b.at - a.at);
}

export function generateShotsForRange(from: Date, to: Date): Shot[] {
  const out: Shot[] = [];
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const last = new Date(to);
  last.setHours(0, 0, 0, 0);
  let guard = 0;
  while (cur <= last && guard < 62) {
    out.push(...generateShots(new Date(cur)));
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return out.sort((a, b) => b.at - a.at);
}
