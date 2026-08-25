import { employees } from "@/lib/employee-data";
import { generateAttendance, type AttendanceRecord } from "@/lib/attendance-data";
import { generateWorklogs, type WorklogEntry } from "@/lib/worklog-data";
import { generateLeaveRequests, type LeaveRequest } from "@/lib/leave-data";
import {
  absenceSummary,
  computeAbsenceBreakdown,
  emptyAbsence,
  type AbsenceBreakdown,
} from "@/lib/absence-rules";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

export const DEDUCTION_UNIT = 4.9;

export type KpiSettings = {
  weights: {
    attendance: number;
    workHours: number;
    breaks: number;
    workLogs: number;
    tasks: number;
  };
  taskWeights: {
    onTime: number;
    completion: number;
    quality: number;
    priority: number;
    efficiency: number;
  };
  attendance: {
    scheduleIn: string; // HH:mm
    scheduleOut: string;
    graceMinutes: number;
    allowedLate: number; // violations before deductions start
    allowedEarly: number;
  };
  workHours: {
    requiredHours: number;
    idleThresholdMinutes: number;
    allowedShortDays: number;
    allowedIdleDays: number;
  };
  breaks: {
    windowStart: string;
    windowEnd: string;
    allowedMinutes: number;
    allowedViolations: number;
  };
  workLogs: {
    deadline: string; // HH:mm
    allowedMissing: number;
    allowedLate: number;
  };
  tiers: { exceptional: number; good: number; needsImprovement: number };
  deductionUnit: number;
};

export const defaultKpiSettings: KpiSettings = {
  weights: { attendance: 10, workHours: 10, breaks: 10, workLogs: 10, tasks: 60 },
  taskWeights: { onTime: 30, completion: 10, quality: 10, priority: 5, efficiency: 5 },
  attendance: {
    scheduleIn: "09:00",
    scheduleOut: "18:00",
    graceMinutes: 5,
    allowedLate: 3,
    allowedEarly: 3,
  },
  workHours: {
    requiredHours: 8,
    idleThresholdMinutes: 5,
    allowedShortDays: 3,
    allowedIdleDays: 3,
  },
  breaks: {
    windowStart: "13:00",
    windowEnd: "15:00",
    allowedMinutes: 75,
    allowedViolations: 3,
  },
  workLogs: { deadline: "20:00", allowedMissing: 1, allowedLate: 2 },
  tiers: { exceptional: 95, good: 90, needsImprovement: 80 },
  deductionUnit: DEDUCTION_UNIT,
};

const SETTINGS_KEY = "omniwork.kpi.settings";

export function loadKpiSettings(): KpiSettings {
  if (typeof window === "undefined") return defaultKpiSettings;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultKpiSettings;
    const parsed = JSON.parse(raw) as Partial<KpiSettings>;
    return { ...defaultKpiSettings, ...parsed } as KpiSettings;
  } catch {
    return defaultKpiSettings;
  }
}

export function saveKpiSettings(s: KpiSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

/* ------------------------------------------------------------------ */
/* Periods                                                             */
/* ------------------------------------------------------------------ */

export type PeriodPreset =
  | "thisMonth"
  | "lastMonth"
  | "thisWeek"
  | "lastWeek"
  | "thisQuarter"
  | "lastQuarter"
  | "thisYear"
  | "lastYear"
  | "custom";

export const periodPresets: { key: PeriodPreset; label: string }[] = [
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "thisWeek", label: "Current Week" },
  { key: "lastWeek", label: "Previous Week" },
  { key: "thisQuarter", label: "Current Quarter" },
  { key: "lastQuarter", label: "Previous Quarter" },
  { key: "thisYear", label: "Current Year" },
  { key: "lastYear", label: "Previous Year" },
  { key: "custom", label: "Custom Date" },
];

const pad = (n: number) => String(n).padStart(2, "0");
export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

export function resolvePeriod(preset: PeriodPreset, today: Date): { from: Date; to: Date } {
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const y = t.getFullYear();
  const m = t.getMonth();
  const q = Math.floor(m / 3);
  switch (preset) {
    case "lastMonth":
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) };
    case "thisWeek":
      return { from: startOfWeek(t), to: t };
    case "lastWeek": {
      const s = startOfWeek(t);
      const from = new Date(s);
      from.setDate(from.getDate() - 7);
      const to = new Date(s);
      to.setDate(to.getDate() - 1);
      return { from, to };
    }
    case "thisQuarter":
      return { from: new Date(y, q * 3, 1), to: t };
    case "lastQuarter":
      return { from: new Date(y, q * 3 - 3, 1), to: new Date(y, q * 3, 0) };
    case "thisYear":
      return { from: new Date(y, 0, 1), to: t };
    case "lastYear":
      return { from: new Date(y - 1, 0, 1), to: new Date(y - 1, 11, 31) };
    default:
      return { from: new Date(y, m, 1), to: t };
  }
}

export function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/* ------------------------------------------------------------------ */
/* Tiers                                                               */
/* ------------------------------------------------------------------ */

export type Tier = {
  tier: 1 | 2 | 3 | 4;
  label: string;
  tone: string;
};

export function tierFor(score: number, s: KpiSettings = defaultKpiSettings): Tier {
  if (score >= s.tiers.exceptional)
    return { tier: 1, label: "Exceptional", tone: "bg-success/15 text-success border-success/30" };
  if (score >= s.tiers.good)
    return { tier: 2, label: "Good", tone: "bg-primary/15 text-primary border-primary/30" };
  if (score >= s.tiers.needsImprovement)
    return {
      tier: 3,
      label: "Needs Improvement",
      tone: "bg-warning/15 text-warning border-warning/30",
    };
  return {
    tier: 4,
    label: "Unsatisfactory",
    tone: "bg-destructive/15 text-destructive border-destructive/30",
  };
}

/* ------------------------------------------------------------------ */
/* Tasks (deterministic synthetic performance data)                    */
/* ------------------------------------------------------------------ */

export type TaskStatus =
  | "To Do"
  | "In Progress"
  | "Pending"
  | "Waiting for Review"
  | "Completed"
  | "Completed Late"
  | "Overdue"
  | "Cancelled"
  | "Rejected";

export type TaskPriority = "Critical" | "High" | "Medium" | "Low";

export type KpiTask = {
  id: string;
  employee: string;
  department: string;
  project: string;
  title: string;
  priority: TaskPriority;
  assignedDate: string;
  dueDate: string;
  completedDate: string | null;
  status: TaskStatus;
  estimatedHours: number;
  actualHours: number;
  reviewer: string;
  qualityScore: number; // 0-100
  approvedDelay: boolean;
};

const projects = ["Q3 Affiliate Push", "Marketplace Ops", "Client Onboarding", "Internal Tooling", "Brand Campaign"];
const titles = [
  "Prepare campaign performance report",
  "Update partner commission sheet",
  "QA regression on release build",
  "Draft client proposal",
  "Reconcile vendor invoices",
  "Optimise landing page copy",
  "Review creative assets",
  "Fix reporting dashboard bug",
];
const priorities: TaskPriority[] = ["Critical", "High", "Medium", "Low"];

function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const activePeople = employees.filter((e) => e.status !== "Inactive");

/** ~200 days of task history ending today. */
export function generateTasks(today: Date): KpiTask[] {
  const out: KpiTask[] = [];
  for (let d = 0; d < 200; d++) {
    const day = new Date(today);
    day.setDate(day.getDate() - d);
    const dow = day.getDay();
    if (dow === 5 || dow === 6) continue;

    activePeople.forEach((e, p) => {
      const seed = d * 53 + p * 17;
      const count = rand(seed) > 0.55 ? 2 : 1;
      for (let k = 0; k < count; k++) {
        const s = seed + k * 401;
        const r1 = rand(s);
        const r2 = rand(s + 1);
        const r3 = rand(s + 2);
        const r4 = rand(s + 3);
        const dueOffset = 1 + Math.floor(r1 * 5);
        const due = new Date(day);
        due.setDate(due.getDate() + dueOffset);
        const est = 2 + Math.round(r2 * 8);
        let status: TaskStatus;
        let completed: Date | null = new Date(due);
        let actual = est;

        if (r3 > 0.965) {
          status = "Cancelled";
          completed = null;
        } else if (r3 > 0.94) {
          status = due < today ? "Overdue" : "In Progress";
          completed = null;
        } else if (r3 > 0.86) {
          status = "Completed Late";
          completed = new Date(due);
          completed.setDate(completed.getDate() + 1 + Math.floor(r4 * 3));
          actual = Math.round(est * (1.3 + r4 * 1.4));
        } else if (r3 > 0.8) {
          status = due > today ? "Waiting for Review" : "Completed";
          completed = due > today ? null : new Date(due);
          actual = Math.round(est * (0.9 + r4 * 0.4));
        } else {
          status = "Completed";
          completed = new Date(due);
          completed.setDate(completed.getDate() - Math.floor(r4 * dueOffset));
          actual = Math.max(1, Math.round(est * (0.75 + r4 * 0.45)));
        }
        if (completed && completed > today) completed = new Date(today);

        const quality = [100, 95, 90, 80, 60][Math.floor(rand(s + 7) * 5)] ?? 90;

        out.push({
          id: `${dateKey(day)}-tk-${p}-${k}`,
          employee: `${e.firstName} ${e.lastName}`,
          department: e.department,
          project: projects[Math.floor(rand(s + 11) * projects.length)]!,
          title: titles[Math.floor(rand(s + 13) * titles.length)]!,
          priority: priorities[Math.floor(rand(s + 17) * priorities.length)]!,
          assignedDate: dateKey(day),
          dueDate: dateKey(due),
          completedDate: completed ? dateKey(completed) : null,
          status,
          estimatedHours: est,
          actualHours: actual,
          reviewer: "Arlene Lane",
          qualityScore: quality,
          approvedDelay: rand(s + 19) > 0.9,
        });
      }
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Scoring engine                                                      */
/* ------------------------------------------------------------------ */

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** Violation allowances scale with the length of the reporting period (base = 20 working days). */
function scaledAllowance(base: number, days: number) {
  return Math.max(base, Math.round(base * (days / 20)));
}

function deduct(max: number, violations: number, allowed: number, unit: number) {
  const billable = Math.max(0, violations - allowed);
  return { score: Math.max(0, +(max - billable * unit).toFixed(2)), billable };
}

export type CategoryScore = {
  key: string;
  label: string;
  max: number;
  score: number;
  violations: number;
  deducted: number;
  detail: string;
};

export type TaskBreakdown = {
  onTime: number;
  completion: number;
  quality: number;
  priority: number;
  efficiency: number;
};

export type EmployeeKpi = {
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  total: number;
  tier: Tier;
  categories: CategoryScore[];
  taskBreakdown: TaskBreakdown;
  attendance: {
    scheduledDays: number;
    presentDays: number;
    absentDays: number;
    equivalentAbsentDays: number;
    absenceBreakdown: AbsenceBreakdown;
    lateDays: number;
    lateMinutes: number;
    earlyOuts: number;
    earlyMinutes: number;
  };
  productivity: {
    scheduledHours: number;
    actualHours: number;
    productiveHours: number;
    idleHours: number;
    productivityPct: number;
  };
  breaks: {
    total: number;
    allowedMinutes: number;
    actualMinutes: number;
    excessMinutes: number;
    violations: number;
  };
  workLogs: { required: number; submitted: number; missing: number; late: number };
  tasks: {
    assigned: number;
    completed: number;
    onTime: number;
    late: number;
    overdue: number;
    cancelled: number;
    completionRate: number;
    onTimeRate: number;
    quality: number;
  };
};

export type KpiDataset = {
  attendance: AttendanceRecord[];
  worklogs: WorklogEntry[];
  tasks: KpiTask[];
};

export function buildDataset(today: Date): KpiDataset {
  return {
    attendance: generateAttendance(today),
    worklogs: generateWorklogs(today),
    tasks: generateTasks(today),
  };
}

function inRange(key: string, from: Date, to: Date) {
  return key >= dateKey(from) && key <= dateKey(to);
}

export function computeEmployeeKpi(
  employeeName: string,
  data: KpiDataset,
  from: Date,
  to: Date,
  s: KpiSettings,
  adjustments: KpiAdjustment[] = [],
): EmployeeKpi {
  const emp = employees.find((e) => `${e.firstName} ${e.lastName}` === employeeName)!;
  const att = data.attendance.filter((a) => a.employee === employeeName && inRange(a.date, from, to));
  const logs = data.worklogs.filter((w) => w.employee === employeeName && inRange(w.date, from, to));
  const tasks = data.tasks.filter((t) => t.employee === employeeName && inRange(t.assignedDate, from, to));

  const schedIn = toMin(s.attendance.scheduleIn);
  const schedOut = toMin(s.attendance.scheduleOut);

  /* --- Attendance --- */
  let lateDays = 0;
  let lateMinutes = 0;
  let earlyOuts = 0;
  let earlyMinutes = 0;
  let absentDays = 0;
  att.forEach((a) => {
    if (a.status === "Absent" || !a.clockIn) {
      absentDays++;
      return;
    }
    const inM = toMin(a.clockIn);
    if (inM > schedIn + s.attendance.graceMinutes) {
      lateDays++;
      lateMinutes += inM - schedIn;
    }
    if (a.clockOut) {
      const outM = toMin(a.clockOut);
      if (outM < schedOut) {
        earlyOuts++;
        earlyMinutes += schedOut - outM;
      }
    }
  });
  const attViolations = lateDays + earlyOuts + absentDays;
  const attCalc = deduct(
    s.weights.attendance,
    attViolations,
    scaledAllowance(s.attendance.allowedLate + s.attendance.allowedEarly, att.length),
    s.deductionUnit,
  );

  /* --- Work hours & idle --- */
  const requiredMin = s.workHours.requiredHours * 60;
  let shortDays = 0;
  let idleDays = 0;
  let workedTotal = 0;
  let idleTotal = 0;
  att.forEach((a) => {
    workedTotal += a.workedMinutes;
    idleTotal += a.idleMinutes;
    if (a.status !== "Absent" && a.workedMinutes < requiredMin - 30) shortDays++;
    if (a.idleMinutes > s.workHours.idleThresholdMinutes * 12) idleDays++;
  });
  const whViolations = shortDays + idleDays;
  const whCalc = deduct(
    s.weights.workHours,
    whViolations,
    scaledAllowance(s.workHours.allowedShortDays + s.workHours.allowedIdleDays, att.length),
    s.deductionUnit,
  );

  /* --- Breaks --- */
  const windowStart = toMin(s.breaks.windowStart);
  const windowEnd = toMin(s.breaks.windowEnd);
  let breakViolations = 0;
  let breakMinutes = 0;
  let excessMinutes = 0;
  let breakCount = 0;
  att.forEach((a) => {
    if (!a.breakStart) return;
    breakCount++;
    breakMinutes += a.breakMinutes;
    const start = toMin(a.breakStart);
    const end = a.breakEnd ? toMin(a.breakEnd) : start + a.breakMinutes;
    let violated = false;
    if (start > windowStart + 30) violated = true;
    if (end > windowEnd) violated = true;
    if (a.breakMinutes > s.breaks.allowedMinutes) {
      excessMinutes += a.breakMinutes - s.breaks.allowedMinutes;
      violated = true;
    }
    if (violated) breakViolations++;
  });
  const brCalc = deduct(
    s.weights.breaks,
    breakViolations,
    scaledAllowance(s.breaks.allowedViolations, att.length),
    s.deductionUnit,
  );

  /* --- Work logs --- */
  const required = logs.length;
  const submitted = logs.filter((l) => l.status === "Submitted").length;
  const missing = required - submitted;
  const deadline = toMin(s.workLogs.deadline);
  const lateLogs = logs.filter((l) => l.submittedAt && toMin(l.submittedAt) > deadline).length;
  const wlViolations = missing + lateLogs;
  const wlCalc = deduct(
    s.weights.workLogs,
    wlViolations,
    scaledAllowance(s.workLogs.allowedMissing + s.workLogs.allowedLate, logs.length),
    s.deductionUnit,
  );

  /* --- Tasks --- */
  const considered = tasks.filter((t) => t.status !== "Cancelled");
  const assigned = considered.length;
  const completedTasks = considered.filter(
    (t) => t.status === "Completed" || t.status === "Completed Late",
  );
  const onTimeTasks = considered.filter(
    (t) => t.status === "Completed" || (t.status === "Completed Late" && t.approvedDelay),
  );
  const lateTasks = considered.filter((t) => t.status === "Completed Late" && !t.approvedDelay);
  const overdue = considered.filter((t) => t.status === "Overdue" && !t.approvedDelay);

  const onTimeRate = assigned ? onTimeTasks.length / assigned : 1;
  const completionRate = assigned ? completedTasks.length / assigned : 1;
  const quality = completedTasks.length
    ? completedTasks.reduce((a, t) => a + t.qualityScore, 0) / completedTasks.length / 100
    : 1;

  const priorityWeight: Record<TaskPriority, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  const missedWeighted = [...lateTasks, ...overdue].reduce((a, t) => a + priorityWeight[t.priority], 0);
  const totalWeighted = considered.reduce((a, t) => a + priorityWeight[t.priority], 0) || 1;
  const priorityCompliance = Math.max(0, 1 - missedWeighted / totalWeighted);

  const effRatios = completedTasks.map((t) => t.estimatedHours / Math.max(1, t.actualHours));
  const efficiency = effRatios.length
    ? Math.min(1, effRatios.reduce((a, r) => a + Math.min(1.1, r), 0) / effRatios.length)
    : 1;

  const tb: TaskBreakdown = {
    onTime: +(onTimeRate * s.taskWeights.onTime).toFixed(2),
    completion: +(completionRate * s.taskWeights.completion).toFixed(2),
    quality: +(quality * s.taskWeights.quality).toFixed(2),
    priority: +(priorityCompliance * s.taskWeights.priority).toFixed(2),
    efficiency: +(efficiency * s.taskWeights.efficiency).toFixed(2),
  };
  const taskScore = +(tb.onTime + tb.completion + tb.quality + tb.priority + tb.efficiency).toFixed(2);

  const categories: CategoryScore[] = [
    {
      key: "attendance",
      label: "Attendance & Punctuality",
      max: s.weights.attendance,
      score: attCalc.score,
      violations: attViolations,
      deducted: +(s.weights.attendance - attCalc.score).toFixed(2),
      detail: `${lateDays} late · ${earlyOuts} early out · ${absentDays} absent`,
    },
    {
      key: "workHours",
      label: "Work Hours & Idle Time",
      max: s.weights.workHours,
      score: whCalc.score,
      violations: whViolations,
      deducted: +(s.weights.workHours - whCalc.score).toFixed(2),
      detail: `${shortDays} short days · ${idleDays} high-idle days`,
    },
    {
      key: "breaks",
      label: "Break Management",
      max: s.weights.breaks,
      score: brCalc.score,
      violations: breakViolations,
      deducted: +(s.weights.breaks - brCalc.score).toFixed(2),
      detail: `${breakViolations} break violations · ${excessMinutes}m excess`,
    },
    {
      key: "workLogs",
      label: "Work Logs",
      max: s.weights.workLogs,
      score: wlCalc.score,
      violations: wlViolations,
      deducted: +(s.weights.workLogs - wlCalc.score).toFixed(2),
      detail: `${submitted}/${required} submitted · ${lateLogs} late`,
    },
    {
      key: "tasks",
      label: "Task & Work Performance",
      max: s.weights.tasks,
      score: taskScore,
      violations: lateTasks.length + overdue.length,
      deducted: +(s.weights.tasks - taskScore).toFixed(2),
      detail: `${completedTasks.length}/${assigned} completed · ${overdue.length} overdue`,
    },
  ];

  const adjustment = adjustments
    .filter((a) => a.employee === employeeName && a.status === "Applied")
    .reduce((a, b) => a + b.amount, 0);

  const total = Math.max(
    0,
    Math.min(100, +(categories.reduce((a, c) => a + c.score, 0) + adjustment).toFixed(2)),
  );

  const scheduledHours = att.length * s.workHours.requiredHours;

  return {
    employeeId: emp?.employeeId ?? "—",
    name: employeeName,
    department: emp?.department ?? "—",
    designation: emp?.designation ?? "—",
    total,
    tier: tierFor(total, s),
    categories,
    taskBreakdown: tb,
    attendance: {
      scheduledDays: att.length,
      presentDays: att.length - absentDays,
      absentDays,
      lateDays,
      lateMinutes,
      earlyOuts,
      earlyMinutes,
    },
    productivity: {
      scheduledHours,
      actualHours: +((workedTotal + idleTotal) / 60).toFixed(1),
      productiveHours: +(workedTotal / 60).toFixed(1),
      idleHours: +(idleTotal / 60).toFixed(1),
      productivityPct: scheduledHours
        ? Math.round((workedTotal / 60 / scheduledHours) * 100)
        : 0,
    },
    breaks: {
      total: breakCount,
      allowedMinutes: breakCount * s.breaks.allowedMinutes,
      actualMinutes: breakMinutes,
      excessMinutes,
      violations: breakViolations,
    },
    workLogs: { required, submitted, missing, late: lateLogs },
    tasks: {
      assigned,
      completed: completedTasks.length,
      onTime: onTimeTasks.length,
      late: lateTasks.length,
      overdue: overdue.length,
      cancelled: tasks.length - considered.length,
      completionRate: Math.round(completionRate * 100),
      onTimeRate: Math.round(onTimeRate * 100),
      quality: Math.round(quality * 100),
    },
  };
}

export function computeAll(
  data: KpiDataset,
  from: Date,
  to: Date,
  s: KpiSettings,
  adjustments: KpiAdjustment[] = [],
): EmployeeKpi[] {
  return employees
    .filter((e) => e.status !== "Inactive")
    .map((e) => computeEmployeeKpi(`${e.firstName} ${e.lastName}`, data, from, to, s, adjustments))
    .sort((a, b) => b.total - a.total);
}

/** Monthly KPI trend for one employee over the last n months. */
export function kpiTrend(
  employeeName: string,
  data: KpiDataset,
  today: Date,
  s: KpiSettings,
  months = 6,
): { month: string; score: number; tier: string }[] {
  const out: { month: string; score: number; tier: string }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const from = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const to = i === 0 ? today : new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
    const k = computeEmployeeKpi(employeeName, data, from, to, s);
    if (!k.attendance.scheduledDays) continue;
    out.push({
      month: from.toLocaleDateString(undefined, { month: "short" }),
      score: k.total,
      tier: k.tier.label,
    });
  }
  return out;
}

export function trendDirection(points: { score: number }[]) {
  if (points.length < 2) return "Stable";
  const diff = points[points.length - 1]!.score - points[points.length - 2]!.score;
  if (diff > 0.5) return "Improving";
  if (diff < -0.5) return "Declining";
  return "Stable";
}

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

export type KpiAlert = {
  id: string;
  employee: string;
  type: "Attendance" | "Work Hours" | "Idle" | "Break" | "Work Log" | "Task" | "KPI";
  message: string;
  severity: "high" | "medium" | "low";
};

export function buildAlerts(list: EmployeeKpi[], s: KpiSettings): KpiAlert[] {
  const alerts: KpiAlert[] = [];
  list.forEach((k) => {
    if (k.attendance.lateDays > s.attendance.allowedLate)
      alerts.push({
        id: `${k.name}-att`,
        employee: k.name,
        type: "Attendance",
        severity: "medium",
        message: `${k.attendance.lateDays} late clock-ins beyond the ${s.attendance.graceMinutes}-minute grace period (${k.attendance.lateMinutes} min total).`,
      });
    if (k.productivity.productivityPct < 85)
      alerts.push({
        id: `${k.name}-wh`,
        employee: k.name,
        type: "Work Hours",
        severity: "medium",
        message: `Productive hours at ${k.productivity.productivityPct}% of scheduled time.`,
      });
    if (k.productivity.idleHours > k.productivity.scheduledHours * 0.1)
      alerts.push({
        id: `${k.name}-idle`,
        employee: k.name,
        type: "Idle",
        severity: "low",
        message: `Excessive idle time recorded: ${k.productivity.idleHours}h.`,
      });
    if (k.breaks.excessMinutes > 0)
      alerts.push({
        id: `${k.name}-brk`,
        employee: k.name,
        type: "Break",
        severity: "low",
        message: `${k.breaks.excessMinutes} minutes over the permitted break duration.`,
      });
    if (k.workLogs.missing > 0)
      alerts.push({
        id: `${k.name}-wl`,
        employee: k.name,
        type: "Work Log",
        severity: "medium",
        message: `${k.workLogs.missing} missing work log submission(s).`,
      });
    if (k.tasks.overdue > 0)
      alerts.push({
        id: `${k.name}-task`,
        employee: k.name,
        type: "Task",
        severity: "high",
        message: `${k.tasks.overdue} overdue task(s) in this period.`,
      });
    if (k.total < s.tiers.needsImprovement)
      alerts.push({
        id: `${k.name}-kpi`,
        employee: k.name,
        type: "KPI",
        severity: "high",
        message: `Current KPI ${k.total} has fallen below ${s.tiers.needsImprovement}.`,
      });
  });
  return alerts;
}

/* ------------------------------------------------------------------ */
/* Disputes & adjustments (local persistence)                          */
/* ------------------------------------------------------------------ */

export type KpiDispute = {
  id: string;
  employee: string;
  subject: string;
  category: string;
  reason: string;
  submittedAt: string;
  status: "Pending" | "Approved" | "Rejected";
  decisionNote?: string;
  decidedAt?: string;
};

export type KpiAdjustment = {
  id: string;
  employee: string;
  amount: number;
  reason: string;
  adjustedBy: string;
  at: string;
  status: "Applied" | "Reverted";
};

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
};

const DISPUTES_KEY = "omniwork.kpi.disputes";
const ADJUST_KEY = "omniwork.kpi.adjustments";
const AUDIT_KEY = "omniwork.kpi.audit";

export const seedDisputes: KpiDispute[] = [
  {
    id: "dsp-1",
    employee: "Tanvir Hasan",
    subject: "Campaign Report marked late",
    category: "Task Performance",
    reason: "Waiting for client data until the following morning.",
    submittedAt: "2026-08-21T10:12:00",
    status: "Pending",
  },
  {
    id: "dsp-2",
    employee: "Sadia Rahman",
    subject: "Late clock-in on Aug 12",
    category: "Attendance",
    reason: "Approved client meeting off-site before shift start.",
    submittedAt: "2026-08-13T09:40:00",
    status: "Approved",
    decisionNote: "Verified with manager calendar. Exception applied.",
    decidedAt: "2026-08-14T11:00:00",
  },
];

export const seedAdjustments: KpiAdjustment[] = [
  {
    id: "adj-1",
    employee: "Sadia Rahman",
    amount: 4.9,
    reason: "Approved business assignment during scheduled hours.",
    adjustedBy: "Arlene Lane",
    at: "2026-08-25T12:00:00",
    status: "Applied",
  },
];

function load<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const loadDisputes = () => load<KpiDispute>(DISPUTES_KEY, seedDisputes);
export const saveDisputes = (v: KpiDispute[]) => save(DISPUTES_KEY, v);
export const loadAdjustments = () => load<KpiAdjustment>(ADJUST_KEY, seedAdjustments);
export const saveAdjustments = (v: KpiAdjustment[]) => save(ADJUST_KEY, v);
export const loadAudit = () =>
  load<AuditEntry>(AUDIT_KEY, [
    {
      id: "aud-1",
      actor: "Arlene Lane",
      action: "Applied KPI adjustment +4.9",
      target: "Sadia Rahman",
      at: "2026-08-25T12:00:00",
    },
  ]);
export const saveAudit = (v: AuditEntry[]) => save(AUDIT_KEY, v);

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
