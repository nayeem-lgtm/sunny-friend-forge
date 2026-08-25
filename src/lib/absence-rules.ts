import { generateAttendance, type AttendanceRecord } from "@/lib/attendance-data";
import { generateWorklogs, type WorklogEntry } from "@/lib/worklog-data";
import { generateLeaveRequests, type LeaveRequest } from "@/lib/leave-data";

/**
 * Company absence conversion rules.
 *
 * 1. 2 late days              -> 1 absent day
 * 2. every incomplete-hours day -> 1 absent day
 * 3. 3 missing work logs      -> 1 absent day
 * 4. denied leave day where the employee still did not work a full day -> 2 absent days
 */
export const ABSENCE_RULES = {
  lateDaysPerAbsence: 2,
  missingLogsPerAbsence: 3,
  deniedLeaveNoShowPenalty: 2,
  requiredHours: 8,
  graceMinutes: 5,
  scheduleIn: "09:00",
} as const;

export type AbsenceBreakdown = {
  recordedAbsences: number;
  lateDays: number;
  fromLate: number;
  shortDays: number;
  fromShortHours: number;
  missingLogs: number;
  fromWorkLogs: number;
  deniedLeaveNoShows: number;
  fromDeniedLeave: number;
  /** total equivalent absent days used by payroll + KPI */
  equivalentAbsentDays: number;
};

export const emptyAbsence = (): AbsenceBreakdown => ({
  recordedAbsences: 0,
  lateDays: 0,
  fromLate: 0,
  shortDays: 0,
  fromShortHours: 0,
  missingLogs: 0,
  fromWorkLogs: 0,
  deniedLeaveNoShows: 0,
  fromDeniedLeave: 0,
  equivalentAbsentDays: 0,
});

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export type AbsenceOptions = {
  requiredHours?: number;
  graceMinutes?: number;
  scheduleIn?: string;
};

/**
 * Converts attendance / worklog / leave activity into equivalent absent days
 * for a single employee within an already-filtered set of records.
 */
export function computeAbsenceBreakdown(
  attendance: AttendanceRecord[],
  worklogs: WorklogEntry[],
  leaves: LeaveRequest[],
  opts: AbsenceOptions = {},
): AbsenceBreakdown {
  const requiredMin = (opts.requiredHours ?? ABSENCE_RULES.requiredHours) * 60;
  const grace = opts.graceMinutes ?? ABSENCE_RULES.graceMinutes;
  const schedIn = toMin(opts.scheduleIn ?? ABSENCE_RULES.scheduleIn);

  const out = emptyAbsence();
  const byDate = new Map<string, AttendanceRecord>();

  attendance.forEach((a) => {
    byDate.set(a.date, a);
    if (a.status === "Absent" || !a.clockIn) {
      out.recordedAbsences++;
      return;
    }
    if (toMin(a.clockIn) > schedIn + grace) out.lateDays++;
    if (a.workedMinutes < requiredMin) out.shortDays++;
  });

  out.missingLogs = worklogs.filter((w) => w.status !== "Submitted").length;

  // Denied leave dates where the employee still did not put in a full day.
  const deniedDates = new Set<string>();
  leaves
    .filter((l) => l.status === "Denied")
    .forEach((l) => {
      const [y, m, d] = l.from.split("-").map(Number);
      const cursor = new Date(y!, (m ?? 1) - 1, d ?? 1);
      for (let i = 0; i < Math.max(1, l.days); i++) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
          cursor.getDate(),
        ).padStart(2, "0")}`;
        if (key <= l.to) deniedDates.add(key);
        cursor.setDate(cursor.getDate() + 1);
      }
    });

  deniedDates.forEach((key) => {
    const rec = byDate.get(key);
    if (!rec) return;
    const noFullDay =
      rec.status === "Absent" || !rec.clockIn || rec.workedMinutes < requiredMin;
    if (noFullDay) out.deniedLeaveNoShows++;
  });

  // Days already penalised through the denied-leave rule should not also be
  // counted as short-hours / recorded absences.
  const shortDays = Math.max(0, out.shortDays - out.deniedLeaveNoShows);
  const recorded = Math.max(0, out.recordedAbsences - out.deniedLeaveNoShows);

  out.fromLate = Math.floor(out.lateDays / ABSENCE_RULES.lateDaysPerAbsence);
  out.fromShortHours = shortDays;
  out.fromWorkLogs = Math.floor(out.missingLogs / ABSENCE_RULES.missingLogsPerAbsence);
  out.fromDeniedLeave = out.deniedLeaveNoShows * ABSENCE_RULES.deniedLeaveNoShowPenalty;

  out.equivalentAbsentDays =
    recorded + out.fromLate + out.fromShortHours + out.fromWorkLogs + out.fromDeniedLeave;

  return out;
}

export function absenceSummary(b: AbsenceBreakdown) {
  const parts: string[] = [];
  if (b.recordedAbsences) parts.push(`${b.recordedAbsences} absent`);
  if (b.fromLate) parts.push(`${b.fromLate} from ${b.lateDays} late days`);
  if (b.fromShortHours) parts.push(`${b.fromShortHours} incomplete-hours days`);
  if (b.fromWorkLogs) parts.push(`${b.fromWorkLogs} from ${b.missingLogs} missing work logs`);
  if (b.fromDeniedLeave)
    parts.push(`${b.fromDeniedLeave} from ${b.deniedLeaveNoShows} denied-leave no-shows`);
  return parts.length ? parts.join(" · ") : "No absence deductions";
}

const inRange = (key: string, from: string, to: string) => key >= from && key <= to;
const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Convenience: absence breakdown for every employee for a month (payroll). */
export function absencesForMonth(month: Date, today: Date): Map<string, AbsenceBreakdown> {
  const from = keyOf(new Date(month.getFullYear(), month.getMonth(), 1));
  const to = keyOf(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const attendance = generateAttendance(today).filter((a) => inRange(a.date, from, to));
  const worklogs = generateWorklogs(today).filter((w) => inRange(w.date, from, to));
  const leaves = generateLeaveRequests(today).filter((l) => l.to >= from && l.from <= to);

  const map = new Map<string, AbsenceBreakdown>();
  const names = new Set(attendance.map((a) => a.employee));
  names.forEach((name) => {
    map.set(
      name,
      computeAbsenceBreakdown(
        attendance.filter((a) => a.employee === name),
        worklogs.filter((w) => w.employee === name),
        leaves.filter((l) => l.employee === name),
      ),
    );
  });
  return map;
}
