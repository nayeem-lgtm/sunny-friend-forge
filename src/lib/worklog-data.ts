export type WorklogTask = {
  title: string;
  project: string;
  minutes: number;
};

export type WorklogEntry = {
  id: string;
  date: string; // yyyy-MM-dd
  employee: string;
  department: string;
  summary: string;
  tasks: WorklogTask[];
  totalMinutes: number;
  submittedAt: string | null; // HH:mm
  status: "Approved" | "Submitted" | "Late" | "Missing";
};

const people: [string, string][] = [
  ["Arlene Lane", "Management"],
  ["Devon Reed", "Creative"],
  ["Marvin Hall", "Media Buying"],
  ["Kristin Ward", "Content"],
  ["Cody Fisher", "Development"],
  ["Jenny Wilson", "Client Services"],
  ["Guy Hawkins", "SEO"],
  ["Esther Howard", "Design"],
  ["Ralph Edwards", "Development"],
  ["Courtney Henry", "Finance"],
];

const projects = [
  "Northwind Retail",
  "Lumen Fitness",
  "Bluepeak Travel",
  "Verta Skincare",
  "Orion Motors",
  "Internal — Ray ERP",
];

const taskBank: Record<string, string[]> = {
  Management: ["Weekly leadership sync", "Resource planning", "Client escalation review"],
  Creative: ["Storyboard revisions", "Static ad batch", "Concept deck for launch"],
  "Media Buying": ["Campaign budget pacing", "Audience testing setup", "Weekly spend report"],
  Content: ["Blog draft", "Caption batch", "Editorial calendar update"],
  Development: ["Landing page build", "Bug triage", "API integration"],
  "Client Services": ["Client status call", "Monthly report prep", "Scope clarification"],
  SEO: ["Keyword gap analysis", "On-page fixes", "Backlink outreach"],
  Design: ["Brand refresh explorations", "Social template kit", "UI polish pass"],
  Finance: ["Invoice reconciliation", "Payroll prep", "Vendor payments"],
};

function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatDuration(mins: number) {
  if (mins <= 0) return "0m";
  return `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`;
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ~90 days of submitted daily work reports ending today. */
export function generateWorklogs(today: Date): WorklogEntry[] {
  const rows: WorklogEntry[] = [];
  for (let d = 0; d < 90; d++) {
    const day = new Date(today);
    day.setDate(day.getDate() - d);
    const dow = day.getDay();
    if (dow === 5 || dow === 6) continue;

    people.forEach(([employee, department], p) => {
      const seed = d * 37 + p * 11;
      const r1 = rand(seed);
      const r2 = rand(seed + 1);
      const r3 = rand(seed + 2);
      const id = `${toDateKey(day)}-wl-${p}`;

      if (r1 > 0.92) {
        rows.push({
          id,
          date: toDateKey(day),
          employee,
          department,
          summary: "No report submitted.",
          tasks: [],
          totalMinutes: 0,
          submittedAt: null,
          status: "Missing",
        });
        return;
      }

      const bank = taskBank[department] ?? ["General agency work"];
      const count = 2 + Math.round(r2 * 2);
      const tasks: WorklogTask[] = Array.from({ length: count }, (_, i) => {
        const rr = rand(seed + 10 + i);
        return {
          title: bank[(i + Math.round(r3 * 2)) % bank.length]!,
          project: projects[Math.round(rr * (projects.length - 1))]!,
          minutes: 45 + Math.round(rr * 150),
        };
      });
      const totalMinutes = tasks.reduce((s, t) => s + t.minutes, 0);
      const submitMin = 17 * 60 + Math.round(r3 * 260); // 17:00 – 21:20
      const late = submitMin > 19 * 60;

      rows.push({
        id,
        date: toDateKey(day),
        employee,
        department,
        summary: `${tasks.length} tasks across ${new Set(tasks.map((t) => t.project)).size} project(s). ${tasks[0]!.title} was the main focus.`,
        tasks,
        totalMinutes,
        submittedAt: `${pad(Math.floor(submitMin / 60))}:${pad(submitMin % 60)}`,
        status: late ? "Late" : r2 > 0.45 ? "Approved" : "Submitted",
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
