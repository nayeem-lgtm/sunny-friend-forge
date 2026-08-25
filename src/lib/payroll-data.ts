import { employees } from "@/lib/employee-data";

export type PayrollAdjustment = {
  id: string;
  amount: number;
  note: string;
};

export type PayrollStatus = "Drafted" | "Approved" | "Paid";

export type PayrollRow = {
  id: string;
  employeeId: string;
  employeeCode: string;
  employee: string;
  designation: string;
  department: string;
  accountNumber: string;
  routingNumber: string;
  accountType: string;
  phone: string;
  email: string;
  baseSalary: number;
  bonuses: PayrollAdjustment[];
  incentives: PayrollAdjustment[];
  deductions: PayrollAdjustment[];
  status: PayrollStatus;
  notes: string;
};

export const payrollStatuses: PayrollStatus[] = ["Drafted", "Approved", "Paid"];

export const payrollStatusTone: Record<PayrollStatus, string> = {
  Drafted: "border-warning/30 bg-warning/15 text-warning",
  Approved: "border-info/30 bg-info/15 text-info",
  Paid: "border-success/30 bg-success/15 text-success",
};

export const monthLabel = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

export const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export function periodLabel(month: Date) {
  const from = new Date(month.getFullYear(), month.getMonth(), 1);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return { from: fmt(from), to: fmt(to) };
}

export function sumAdjustments(list: PayrollAdjustment[]) {
  return list.reduce((s, a) => s + a.amount, 0);
}

export function netPay(row: PayrollRow) {
  return (
    row.baseSalary +
    sumAdjustments(row.bonuses) +
    sumAdjustments(row.incentives) -
    sumAdjustments(row.deductions)
  );
}

export function formatBDT(n: number) {
  return `BDT ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCompact(n: number) {
  if (Math.abs(n) >= 1_000_000) return `BDT ${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `BDT ${(n / 1_000).toFixed(1)}K`;
  return `BDT ${n.toFixed(0)}`;
}

/** Deterministic payroll sheet for a given month. */
export function generatePayroll(month: Date): PayrollRow[] {
  const key = monthKey(month);
  return employees
    .filter((e) => e.status !== "Inactive")
    .map((e, i) => {
      const seeded = (i * 37 + month.getMonth() * 11) % 10;
      const status: PayrollStatus = seeded < 5 ? "Drafted" : seeded < 8 ? "Approved" : "Paid";
      const bonuses: PayrollAdjustment[] =
        seeded % 4 === 0
          ? [{ id: `${key}-b-${i}`, amount: 2500 + (i % 3) * 1500, note: "Performance bonus" }]
          : [];
      const incentives: PayrollAdjustment[] =
        seeded % 5 === 1
          ? [{ id: `${key}-i-${i}`, amount: 1200 + (i % 4) * 800, note: "Campaign incentive" }]
          : [];
      const deductions: PayrollAdjustment[] =
        seeded % 6 === 2
          ? [{ id: `${key}-d-${i}`, amount: 900 + (i % 3) * 400, note: "Late arrivals" }]
          : [];
      return {
        id: `${key}-${e.id}`,
        employeeId: e.id,
        employeeCode: e.employeeId,
        employee: `${e.firstName} ${e.lastName}`,
        designation: e.designation,
        department: e.department,
        accountNumber: e.accountNumber,
        routingNumber: e.routingNumber,
        accountType: "Savings",
        phone: e.phone,
        email: e.email,
        baseSalary: e.monthlySalary,
        bonuses,
        incentives,
        deductions,
        status,
        notes: `Generated payroll for ${monthLabel(month)}`,
      };
    });
}
