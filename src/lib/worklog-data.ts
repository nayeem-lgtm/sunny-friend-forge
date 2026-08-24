export type WorklogStatus = "Submitted" | "Not Submitted";

export type WorklogEntry = {
  id: string;
  date: string; // yyyy-MM-dd
  employee: string;
  department: string;
  report: string; // free-form EOD paragraph
  submittedAt: string | null; // HH:mm
  status: WorklogStatus;
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

const reportBank: Record<string, string[]> = {
  "IT Department": [
    "Shipped the internal dashboard update, resolved frontend bugs, and reviewed peer pull requests.",
    "Built API integrations for the reporting module and wrote supporting documentation.",
    "Debugged production issues and deployed a hotfix for the analytics service.",
  ],
  "Affiliate Department": [
    "Onboarded three new affiliate partners and reviewed commission payouts for the week.",
    "Optimised top-performing offers and paused links with poor conversion rates.",
    "Ran partner performance reports and followed up with inactive affiliates.",
  ],
  "Business Development Department": [
    "Led discovery calls with two prospects and prepared proposals for the retail vertical.",
    "Updated the pipeline, followed up on pending contracts and scheduled next-week demos.",
    "Researched new outbound segments and drafted the outreach sequence for approval.",
  ],
  "QA Department": [
    "Executed regression suites on the latest release and logged four defects for the dev team.",
    "Wrote test cases for the new onboarding flow and verified previously reported fixes.",
    "Performed cross-browser testing and updated the QA checklist documentation.",
  ],
  "Accounting Department": [
    "Reconciled vendor invoices, processed payroll inputs, and updated cash-flow projections.",
    "Reviewed expense reports and followed up on outstanding client payments.",
    "Prepared monthly financial summaries and supported audit documentation requests.",
  ],
};

function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ~90 days of daily EOD report submissions ending today. */
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
      const id = `${toDateKey(day)}-wl-${p}`;

      if (r1 > 0.92) {
        rows.push({
          id,
          date: toDateKey(day),
          employee,
          department,
          report: "No EOD report submitted.",
          submittedAt: null,
          status: "Not Submitted",
        });
        return;
      }

      const bank = reportBank[department] ?? ["General agency work completed today."];
      const report = bank[Math.round(r2 * (bank.length - 1))]!;
      const submitMin = 17 * 60 + Math.round(r2 * 260); // 17:00 – 21:20

      rows.push({
        id,
        date: toDateKey(day),
        employee,
        department,
        report,
        submittedAt: `${pad(Math.floor(submitMin / 60))}:${pad(submitMin % 60)}`,
        status: "Submitted",
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
