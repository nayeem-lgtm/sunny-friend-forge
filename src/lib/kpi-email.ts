import type { EmployeeKpi } from "@/lib/kpi-data";
import { employees } from "@/lib/employee-data";

const SETTINGS_KEY = "omniwork.kpi.email.settings";
const HISTORY_KEY = "omniwork.kpi.email.history";

export type KpiEmailSettings = {
  /** Automatically queue the monthly report on the last day of the month. */
  autoSend: boolean;
  /** Day of month to dispatch when autoSend is on. 0 = last day. */
  sendDay: number;
  subject: string;
  intro: string;
  signature: string;
  /** Blind-copy address for HR/management records. */
  ccManagement: string;
  includeTaskBreakdown: boolean;
  includeAttendance: boolean;
  includeTrendNote: boolean;
};

export const defaultKpiEmailSettings: KpiEmailSettings = {
  autoSend: true,
  sendDay: 0,
  subject: "Your KPI report — {period}",
  intro:
    "Here is your performance summary for the reporting period. It is generated automatically from your attendance, work hours, breaks, work logs and task performance in OmniWork.",
  signature: "People Operations · Ray Advertising",
  ccManagement: "hr@rayadvertising.com",
  includeTaskBreakdown: true,
  includeAttendance: true,
  includeTrendNote: true,
};

export type KpiEmailRecord = {
  id: string;
  employee: string;
  employeeId: string;
  email: string;
  subject: string;
  period: string;
  score: number;
  tier: string;
  sentAt: string;
  status: "Sent" | "Failed";
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...(fallback as object), ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadKpiEmailSettings(): KpiEmailSettings {
  return read(SETTINGS_KEY, defaultKpiEmailSettings);
}

export function saveKpiEmailSettings(s: KpiEmailSettings) {
  if (typeof window !== "undefined") window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function loadKpiEmailHistory(): KpiEmailRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]") as KpiEmailRecord[];
  } catch {
    return [];
  }
}

export function saveKpiEmailHistory(rows: KpiEmailRecord[]) {
  if (typeof window !== "undefined")
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(rows.slice(0, 500)));
}

export function employeeEmail(name: string) {
  const e = employees.find((x) => `${x.firstName} ${x.lastName}` === name);
  return e?.email ?? `${name.toLowerCase().replace(/\s+/g, ".")}@rayadvertising.com`;
}

export function fillSubject(template: string, period: string, k: EmployeeKpi) {
  return template
    .replaceAll("{period}", period)
    .replaceAll("{name}", k.name)
    .replaceAll("{score}", k.total.toFixed(1))
    .replaceAll("{tier}", k.tier.label);
}

const row = (label: string, value: string | number) =>
  `<tr><td style="padding:6px 0;color:#64748b;font-size:13px">${label}</td><td style="padding:6px 0;text-align:right;font-size:13px;font-weight:600;color:#0f172a">${value}</td></tr>`;

const section = (title: string, body: string) =>
  `<div style="margin-top:22px"><p style="margin:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;font-weight:700">${title}</p><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0">${body}</table></div>`;

/** Renders the detailed per-employee KPI report as email-safe HTML. */
export function buildKpiEmailHtml(
  k: EmployeeKpi,
  period: string,
  s: KpiEmailSettings,
  opts?: { previousScore?: number | null },
) {
  const diff =
    opts?.previousScore != null ? +(k.total - opts.previousScore).toFixed(1) : null;

  const categories = k.categories
    .map(
      (c) =>
        `<tr><td style="padding:8px 0;font-size:13px;color:#0f172a">${c.label}</td><td style="padding:8px 0;text-align:right;font-size:13px;font-weight:600;color:#0f172a">${c.score.toFixed(1)} <span style="color:#94a3b8;font-weight:400">/ ${c.max}</span></td></tr>`,
    )
    .join("");

  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:24px">
    <div style="background:#0b241f;border-radius:16px;padding:24px;color:#d1fae5">
      <p style="margin:0;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#5eead4">OmniWork · KPI report</p>
      <h1 style="margin:8px 0 2px;font-size:24px;color:#ffffff">${k.name}</h1>
      <p style="margin:0;font-size:13px;color:#99f6e4">${k.employeeId} · ${k.designation} · ${k.department}</p>
      <p style="margin:18px 0 0;font-size:40px;font-weight:700;color:#5eead4">${k.total.toFixed(1)}<span style="font-size:16px;color:#99f6e4"> / 100</span></p>
      <p style="margin:4px 0 0;font-size:14px;color:#ffffff">${k.tier.label}${
        s.includeTrendNote && diff != null
          ? ` · ${diff >= 0 ? "▲" : "▼"} ${Math.abs(diff)} vs previous period`
          : ""
      }</p>
      <p style="margin:10px 0 0;font-size:12px;color:#99f6e4">Reporting period: ${period}</p>
    </div>

    <div style="background:#ffffff;border-radius:16px;padding:24px;margin-top:16px">
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.6">${s.intro}</p>

      ${section("Score breakdown", categories)}

      ${
        s.includeAttendance
          ? section(
              "Attendance & punctuality",
              row("Scheduled days", k.attendance.scheduledDays) +
                row("Present days", k.attendance.presentDays) +
                row("Absent days", k.attendance.absentDays) +
                row("Late arrivals", `${k.attendance.lateDays} (${k.attendance.lateMinutes} min)`) +
                row("Early clock-outs", `${k.attendance.earlyOuts} (${k.attendance.earlyMinutes} min)`),
            ) +
            section(
              "Work hours & breaks",
              row("Scheduled hours", `${k.productivity.scheduledHours}h`) +
                row("Productive hours", `${k.productivity.productiveHours}h`) +
                row("Idle hours", `${k.productivity.idleHours}h`) +
                row("Productivity", `${k.productivity.productivityPct}%`) +
                row("Break time", `${k.breaks.actualMinutes} min (allowed ${k.breaks.allowedMinutes})`) +
                row("Break violations", k.breaks.violations),
            ) +
            section(
              "Work logs",
              row("Required", k.workLogs.required) +
                row("Submitted", k.workLogs.submitted) +
                row("Missing", k.workLogs.missing) +
                row("Late", k.workLogs.late),
            )
          : ""
      }

      ${
        s.includeTaskBreakdown
          ? section(
              "Task & work performance",
              row("Assigned", k.tasks.assigned) +
                row("Completed", k.tasks.completed) +
                row("Completed on time", k.tasks.onTime) +
                row("Completed late", k.tasks.late) +
                row("Overdue", k.tasks.overdue) +
                row("Completion rate", `${k.tasks.completionRate}%`) +
                row("On-time rate", `${k.tasks.onTimeRate}%`) +
                row("Quality score", `${k.tasks.quality}%`),
            )
          : ""
      }

      <p style="margin:26px 0 0;font-size:12px;color:#64748b;line-height:1.6">
        If you believe an event in this report is incorrect, raise a KPI dispute in OmniWork and your manager will review it.
      </p>
      <p style="margin:14px 0 0;font-size:13px;color:#0f172a;font-weight:600">${s.signature}</p>
    </div>
  </div></body></html>`;
}

export function buildKpiEmailText(k: EmployeeKpi, period: string) {
  return [
    `KPI report — ${period}`,
    `${k.name} (${k.employeeId}) · ${k.department}`,
    `Overall: ${k.total.toFixed(1)} / 100 — ${k.tier.label}`,
    "",
    ...k.categories.map((c) => `${c.label}: ${c.score.toFixed(1)} / ${c.max}`),
  ].join("\n");
}

/** Next scheduled dispatch date for the configured send day. */
export function nextSendDate(settings: KpiEmailSettings, today: Date) {
  const y = today.getFullYear();
  const m = today.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const day = settings.sendDay === 0 ? lastDay : Math.min(settings.sendDay, lastDay);
  const candidate = new Date(y, m, day);
  if (candidate < new Date(y, m, today.getDate())) {
    const nl = new Date(y, m + 2, 0).getDate();
    return new Date(y, m + 1, settings.sendDay === 0 ? nl : Math.min(settings.sendDay, nl));
  }
  return candidate;
}
