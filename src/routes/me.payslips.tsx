import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Eye, Minus, Plus, Wallet } from "lucide-react";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEmployeeSession } from "@/lib/employee-session";
import { downloadPayslipPdf, openPayslipPdf } from "@/lib/payslip-pdf";
import {
  formatBDT,
  generatePayroll,
  monthLabel,
  netPay,
  payrollStatusTone,
  periodLabel,
  sumAdjustments,
  type PayrollRow,
} from "@/lib/payroll-data";


export const Route = createFileRoute("/me/payslips")({
  head: () => ({
    meta: [
      { title: "My Payslips — OmniWork Employee Portal" },
      {
        name: "description",
        content: "Monthly payslips with base salary, bonuses, incentives, absence deductions and net pay.",
      },
      { property: "og:title", content: "My Payslips — OmniWork Employee Portal" },
      {
        property: "og:description",
        content: "Review and download your monthly salary breakdown.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const periodText = (m: Date) => {
  const p = periodLabel(m);
  return `${p.from} – ${p.to}`;
};

function Line({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          tone === "negative"
            ? "font-medium text-destructive"
            : tone === "positive"
              ? "font-medium text-success"
              : "font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}

type PayslipRow = PayrollRow;


function Page() {
  const { employee } = useEmployeeSession();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const row = useMemo(
    () => generatePayroll(month).find((r) => r.employeeId === employee.id),
    [month, employee.id],
  );

  const history = useMemo(() => {
    const out: { label: string; net: number; date: Date }[] = [];
    for (let i = 0; i < 6; i += 1) {
      const d = new Date(month.getFullYear(), month.getMonth() - i, 1);
      const r = generatePayroll(d).find((x) => x.employeeId === employee.id);
      if (r) out.push({ label: monthLabel(d), net: netPay(r), date: d });
    }
    return out;
  }, [month, employee.id]);

  const absenceDeduction = row ? row.absence.equivalentAbsentDays * row.dailyRate : 0;

  return (
    <EmployeeShell>
      <PageHeader
        title="My Payslips"
        description="Your monthly salary breakdown, including absence adjustments."
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[130px] text-center text-sm font-medium">{monthLabel(month)}</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />

      {!row ? (
        <p className="text-sm text-muted-foreground">No payslip generated for this month yet.</p>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Wallet} label="Net pay" value={formatBDT(netPay(row))} caption={periodText(month)} highlight />
            <StatCard icon={Plus} label="Earnings added" value={formatBDT(sumAdjustments(row.bonuses) + sumAdjustments(row.incentives))} caption="Bonuses + incentives" />
            <StatCard icon={Minus} label="Deductions" value={formatBDT(sumAdjustments(row.deductions) + absenceDeduction)} caption="Including absences" />
            <StatCard icon={Wallet} label="Daily rate" value={formatBDT(row.dailyRate)} caption="Used for absence maths" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">Payslip · {periodText(month)}</h2>
                <Badge variant="outline" className={payrollStatusTone[row.status]}>
                  {row.status}
                </Badge>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openPayslipPdf(row, month, { bankName: employee.bankName })}
                  >
                    <Eye className="mr-1.5 size-4" /> Preview PDF
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => downloadPayslipPdf(row, month, { bankName: employee.bankName })}
                  >
                    <Download className="mr-1.5 size-4" /> Download PDF
                  </Button>
                </div>

              </div>

              <Line label="Base salary" value={formatBDT(row.baseSalary)} />
              {row.bonuses.map((b) => (
                <Line key={b.id} label={`Bonus · ${b.note}`} value={`+${formatBDT(b.amount)}`} tone="positive" />
              ))}
              {row.incentives.map((b) => (
                <Line key={b.id} label={`Incentive · ${b.note}`} value={`+${formatBDT(b.amount)}`} tone="positive" />
              ))}
              {row.deductions.map((b) => (
                <Line key={b.id} label={`Deduction · ${b.note}`} value={`-${formatBDT(b.amount)}`} tone="negative" />
              ))}
              {absenceDeduction > 0 && (
                <Line
                  label={`Absence (${row.absence.equivalentAbsentDays} day equivalent)`}
                  value={`-${formatBDT(absenceDeduction)}`}
                  tone="negative"
                />
              )}
              <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3">
                <span className="text-sm font-medium">Net pay</span>
                <span className="text-lg font-semibold text-primary">{formatBDT(netPay(row))}</span>
              </div>

              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <p className="text-muted-foreground">
                  Bank: <span className="text-foreground">{employee.bankName}</span>
                </p>
                <p className="text-muted-foreground">
                  Account: <span className="text-foreground">{row.accountNumber}</span>
                </p>
                <p className="text-muted-foreground">
                  Account type: <span className="text-foreground">{row.accountType}</span>
                </p>
                <p className="text-muted-foreground">
                  Routing: <span className="text-foreground">{row.routingNumber}</span>
                </p>
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="mb-3 text-sm font-semibold">Absence summary</h2>
                <Line label="Recorded absences" value={String(row.absence.recordedAbsences)} />
                <Line label={`Late days (${row.absence.lateDays})`} value={`+${row.absence.fromLate} absent`} />
                <Line label={`Short-hour days (${row.absence.shortDays})`} value={`+${row.absence.fromShortHours} absent`} />
                <Line label={`Missing work logs (${row.absence.missingLogs})`} value={`+${row.absence.fromWorkLogs} absent`} />
                <Line
                  label={`Denied-leave no shows (${row.absence.deniedLeaveNoShows})`}
                  value={`+${row.absence.fromDeniedLeave} absent`}
                />
                <Line
                  label="Equivalent absent days"
                  value={String(row.absence.equivalentAbsentDays)}
                  tone="negative"
                />
              </section>

              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="mb-3 text-sm font-semibold">Last 6 months</h2>
                <div className="space-y-2">
                  {history.map((h) => (
                    <button
                      key={h.label}
                      onClick={() => setMonth(h.date)}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <span className="text-muted-foreground">{h.label}</span>
                      <span className="font-medium">{formatBDT(h.net)}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </EmployeeShell>
  );
}
