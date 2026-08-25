import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Banknote,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Gift,
  Minus,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";


import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";



import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { departments } from "@/lib/employee-data";
import { initials } from "@/lib/leave-data";
import { cn } from "@/lib/utils";
import {
  formatBDT,
  generatePayroll,
  monthLabel,
  netPay,
  payrollStatusTone,
  payrollStatuses,
  periodLabel,
  sumAdjustments,
  type PayrollRow,
  type PayrollStatus,
} from "@/lib/payroll-data";

export const Route = createFileRoute("/payroll")({
  head: () => ({
    meta: [
      { title: "Payroll — OmniWork" },
      {
        name: "description",
        content:
          "Generate monthly payroll, add bonuses, incentives and deductions, and approve payments in one sheet.",
      },
      { property: "og:title", content: "Payroll — OmniWork" },
      {
        property: "og:description",
        content:
          "Generate monthly payroll, add bonuses, incentives and deductions, and approve payments in one sheet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type AdjKind = "bonus" | "incentive" | "deduction";

const adjMeta: Record<AdjKind, { title: string; tone: string; sign: string }> = {
  bonus: { title: "Add Bonus", tone: "text-success", sign: "+" },
  incentive: { title: "Add Incentive", tone: "text-info", sign: "+" },
  deduction: { title: "Add Deduction", tone: "text-destructive", sign: "-" },
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function Page() {
  const base = new Date(2026, 7, 1);
  const years = Array.from({ length: 5 }, (_, i) => base.getFullYear() - 3 + i);
  const quickMonths = [
    { label: "This month", date: base },
    { label: "Last month", date: new Date(base.getFullYear(), base.getMonth() - 1, 1) },
    { label: "2 months ago", date: new Date(base.getFullYear(), base.getMonth() - 2, 1) },
  ];
  const [month, setMonth] = useState(base);
  const [custom, setCustom] = useState<DateRange | undefined>();
  const [rows, setRows] = useState<PayrollRow[]>(() => generatePayroll(base));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [department, setDepartment] = useState("all");
  const [detail, setDetail] = useState<PayrollRow | null>(null);
  const [adj, setAdj] = useState<{ row: PayrollRow; kind: AdjKind } | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const setMonthTo = (m: number, y: number) => {
    const next = new Date(y, m, 1);
    setCustom(undefined);
    setMonth(next);
    setRows(generatePayroll(next));
  };

  const applyCustom = (r: DateRange | undefined) => {
    setCustom(r);
    if (r?.from) {
      const next = new Date(r.from.getFullYear(), r.from.getMonth(), 1);
      setMonth(next);
      setRows(generatePayroll(next));
    }
  };


  const shiftMonth = (delta: number) =>
    setMonthTo(month.getMonth() + delta, month.getFullYear());

  const exportReport = async () => {
    const XLSX = await import("xlsx");
    const remark = `Salary ${monthLabel(month)}`;
    const data = filtered.map((r) => ({
      Reason: "Monthly Salary Pay",
      "Sender Account No": "",
      "Receiving Bank Routing No": r.routingNumber,
      "Beneficiary Bank Account  No": r.accountNumber,
      "Account Type": r.accountType,
      Amount: Number(netPay(r).toFixed(2)),
      "Receiver ID": r.employeeCode,
      "Receiver Name": r.employee,
      Remarks: remark,
      "Receiver Mobile Number": r.phone,
      "Receiver Email Address": r.email,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [18, 18, 24, 26, 14, 12, 14, 24, 20, 22, 32].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const guide = XLSX.utils.aoa_to_sheet([
      ["Data Field", "Data Type", "Description", "Is Mandatory"],
      ["Reason", "String", "Type of payment. Example: Salary, Advance, Travel etc", "No"],
      ["Sender Account No", "Number", "Transaction debit account number", "Yes"],
      ["Receiving Bank Routing No", "Number", "Beneficiary bank routing number", "No"],
      ["Beneficiary Bank Account  No", "Number", "Beneficiary bank account number", "No"],
      ["Account Type", "String", "Beneficiary account type , Example : SB", "No"],
      ["Amount", "Decimal", "Transaction amount", "Yes"],
      ["Receiver ID", "Integer", "Set default value 0", "No"],
      ["Receiver Name", "String", "Beneficiary bank account title", "Yes"],
      ["Remarks", "String", "Transaction remarks (Maximum 100 letter input)", "Yes"],
    ]);
    guide["!cols"] = [28, 12, 60, 14].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, guide, "Sheet2");
    const name = `payroll-${monthNames[month.getMonth()]!.toLowerCase()}-${month.getFullYear()}.xlsx`;
    XLSX.writeFile(wb, name);
    toast.success(`Bank transfer sheet exported (${data.length} payments)`);
  };

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (status === "all" || r.status === status) &&
          (department === "all" || r.department === department) &&
          (!query.trim() ||
            r.employee.toLowerCase().includes(query.toLowerCase()) ||
            r.designation.toLowerCase().includes(query.toLowerCase())),
      ),
    [rows, status, department, query],
  );

  const totals = useMemo(() => {
    const net = rows.reduce((s, r) => s + netPay(r), 0);
    const paid = rows.filter((r) => r.status === "Paid");
    const approved = rows.filter((r) => r.status === "Approved");
    const drafted = rows.filter((r) => r.status === "Drafted");
    return {
      net,
      paid: paid.length,
      paidAmount: paid.reduce((s, r) => s + netPay(r), 0),
      approved: approved.length,
      drafted: drafted.length,
      pct: rows.length ? Math.round((paid.length / rows.length) * 100) : 0,
      bonus: rows.reduce((s, r) => s + sumAdjustments(r.bonuses) + sumAdjustments(r.incentives), 0),
      deduction: rows.reduce((s, r) => s + sumAdjustments(r.deductions), 0),
    };
  }, [rows]);

  const period =
    custom?.from
      ? {
          from: custom.from.toLocaleDateString(),
          to: (custom.to ?? custom.from).toLocaleDateString(),
        }
      : periodLabel(month);

  const update = (id: string, fn: (r: PayrollRow) => PayrollRow) =>
    setRows((prev) => prev.map((r) => (r.id === id ? fn(r) : r)));

  const saveAdjustment = () => {
    if (!adj) return;
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const entry = { id: `${adj.row.id}-${adj.kind}-${Date.now()}`, amount: value, note: note.trim() };
    update(adj.row.id, (r) => ({
      ...r,
      bonuses: adj.kind === "bonus" ? [...r.bonuses, entry] : r.bonuses,
      incentives: adj.kind === "incentive" ? [...r.incentives, entry] : r.incentives,
      deductions: adj.kind === "deduction" ? [...r.deductions, entry] : r.deductions,
    }));
    toast.success(`${adjMeta[adj.kind].title.replace("Add ", "")} added for ${adj.row.employee}`);
    setAdj(null);
    setAmount("");
    setNote("");
  };

  const setRowStatus = (row: PayrollRow, next: PayrollStatus) => {
    update(row.id, (r) => ({ ...r, status: next }));
    toast.success(`${row.employee} marked as ${next.toLowerCase()}`);
  };

  return (
    <AppShell>
      <PageHeader
        title="Payroll"
        description="Generate the monthly payroll sheet, adjust compensation and release payments."
        actions={
          <>
            <Button variant="outline" onClick={exportReport}>
              <Download className="size-4" /> Export report
            </Button>
            <Button
              onClick={() => {
                setRows((prev) =>
                  prev.map((r) => (r.status === "Drafted" ? { ...r, status: "Approved" } : r)),
                );
                toast.success("Payroll processed — drafts moved to approved");
              }}
            >
              <Send className="size-4" /> Process payroll
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Total net pay"
          value={formatBDT(totals.net)}
          caption={`${rows.length} employees · ${monthLabel(month)}`}
          highlight
        />
        <StatCard
          icon={BadgeCheck}
          label="Paid employees"
          value={totals.paid}
          caption={`${totals.pct}% of payroll released`}
        />
        <StatCard
          icon={Sparkles}
          label="Bonus & incentives"
          value={formatBDT(totals.bonus)}
          caption={`Deductions ${formatBDT(totals.deduction)}`}
        />
        <StatCard
          icon={Banknote}
          label="Pending approval"
          value={totals.drafted}
          caption={`${totals.approved} approved, ready to pay`}
        />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Select
              value={String(month.getMonth())}
              onValueChange={(v) => setMonthTo(Number(v), month.getFullYear())}
            >
              <SelectTrigger className="h-8 w-[130px] border-0 bg-transparent text-sm font-medium shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((m, i) => (
                  <SelectItem key={m} value={String(i)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(month.getFullYear())}
              onValueChange={(v) => setMonthTo(month.getMonth(), Number(v))}
            >
              <SelectTrigger className="h-8 w-[92px] border-0 bg-transparent text-sm font-medium shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {quickMonths.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => setMonthTo(q.date.getMonth(), q.date.getFullYear())}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  !custom?.from &&
                    q.date.getMonth() === month.getMonth() &&
                    q.date.getFullYear() === month.getFullYear()
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {q.label}
              </button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                    custom?.from
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <CalendarIcon className="size-3.5" />
                  {custom?.from
                    ? `${custom.from.toLocaleDateString()}${custom.to ? ` – ${custom.to.toLocaleDateString()}` : ""}`
                    : "Custom dates"}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <div className="flex flex-wrap gap-1.5 border-b border-border p-3">
                  {[0, 1, 2, 3].map((back) => {
                    const d = new Date(base.getFullYear(), base.getMonth() - back, 1);
                    return (
                      <button
                        key={back}
                        type="button"
                        onClick={() =>
                          applyCustom({
                            from: d,
                            to: new Date(d.getFullYear(), d.getMonth() + 1, 0),
                          })
                        }
                        className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Full {monthNames[d.getMonth()]!.slice(0, 3)} {d.getFullYear()}
                      </button>
                    );
                  })}
                </div>
                <Calendar
                  mode="range"
                  selected={custom}
                  onSelect={applyCustom}
                  numberOfMonths={2}
                  defaultMonth={month}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
                {custom?.from && (
                  <div className="border-t border-border p-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setMonthTo(month.getMonth(), month.getFullYear())}
                    >
                      Clear custom dates
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>



          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employee..."
              className="h-9 pl-9"
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {payrollStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="ml-auto text-sm text-muted-foreground">{filtered.length} records</span>
        </div>

        <div className="scrollbar-slim overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Base salary</th>
                <th className="px-4 py-3 font-medium">Bonus</th>
                <th className="px-4 py-3 font-medium">Incentives</th>
                <th className="px-4 py-3 font-medium">Deductions</th>
                <th className="px-4 py-3 font-medium">Net pay</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No payroll records for this filter.
                  </td>
                </tr>
              )}
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        {initials(row.employee)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.employee}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.designation} · {row.department}
                        </p>
                      </div>
                    </div>
                  </td>
                  <SalaryCell
                    value={row.baseSalary}
                    onChange={(v) => {
                      update(row.id, (r) => ({ ...r, baseSalary: v }));
                      toast.success(`Base salary updated for ${row.employee}`);
                    }}
                  />
                  <AdjustCell
                    value={sumAdjustments(row.bonuses)}
                    kind="bonus"
                    onAdd={() => setAdj({ row, kind: "bonus" })}
                  />
                  <AdjustCell
                    value={sumAdjustments(row.incentives)}
                    kind="incentive"
                    onAdd={() => setAdj({ row, kind: "incentive" })}
                  />
                  <AdjustCell
                    value={sumAdjustments(row.deductions)}
                    kind="deduction"
                    onAdd={() => setAdj({ row, kind: "deduction" })}
                  />
                  <td className="px-4 py-3 font-semibold tabular-nums">{formatBDT(netPay(row))}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={row.status}
                      onValueChange={(v) => setRowStatus(row, v as PayrollStatus)}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-7 w-[120px] rounded-full border px-3 text-xs font-medium",
                          payrollStatusTone[row.status],
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {payrollStatuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {period.from} — {period.to}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setDetail(row)}
                        aria-label={`View payroll details for ${row.employee}`}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        aria-label={`Remove ${row.employee} from this payroll run`}
                        onClick={() => {
                          setRows((prev) => prev.filter((r) => r.id !== row.id));
                          toast.success(`${row.employee} removed from this run`);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment dialog */}
      <Dialog
        open={!!adj}
        onOpenChange={(o) => {
          if (!o) {
            setAdj(null);
            setAmount("");
            setNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{adj ? adjMeta[adj.kind].title : ""}</DialogTitle>
          </DialogHeader>
          {adj && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                For <span className="font-medium text-foreground">{adj.row.employee}</span> ·{" "}
                {monthLabel(month)}
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="adj-amount">
                  Amount <span className="text-destructive">*</span>
                </label>
                <Input
                  id="adj-amount"
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {[1000, 2500, 5000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(String(v))}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    >
                      {v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="adj-note">
                  Notes
                </label>
                <Textarea
                  id="adj-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reason for this adjustment"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdj(null)}>
              Cancel
            </Button>
            <Button onClick={saveAdjustment}>{adj ? adjMeta[adj.kind].title : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payroll details</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-4">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {initials(detail.employee)}
                </span>
                <div>
                  <p className="font-medium">{detail.employee}</p>
                  <p className="text-xs text-muted-foreground">
                    {detail.designation} · {detail.department}
                  </p>
                </div>
                <span
                  className={cn(
                    "ml-auto rounded-full border px-3 py-1 text-xs font-medium",
                    payrollStatusTone[detail.status],
                  )}
                >
                  {detail.status}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm text-muted-foreground">Base salary</p>
                  <p className="mt-1 text-lg font-semibold">{formatBDT(detail.baseSalary)}</p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
                  <p className="text-sm text-muted-foreground">Net pay</p>
                  <p className="mt-1 text-lg font-semibold">{formatBDT(netPay(detail))}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Breakdown title="Bonus" tone="success" entries={detail.bonuses} />
                <Breakdown title="Incentives" tone="info" entries={detail.incentives} />
                <Breakdown title="Deductions" tone="destructive" entries={detail.deductions} negative />
              </div>

              <div className="rounded-xl border border-border p-4">
                <p className="text-sm font-medium">Absence conversion</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {detail.absence.equivalentAbsentDays} equivalent absent day
                  {detail.absence.equivalentAbsentDays === 1 ? "" : "s"} ·{" "}
                  {formatBDT(detail.dailyRate)}/day
                </p>
                <ul className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                  <li>Recorded absences: {detail.absence.recordedAbsences}</li>
                  <li>
                    Late days: {detail.absence.lateDays} → {detail.absence.fromLate} absent
                  </li>
                  <li>Incomplete-hours days: {detail.absence.fromShortHours} absent</li>
                  <li>
                    Missing work logs: {detail.absence.missingLogs} → {detail.absence.fromWorkLogs}{" "}
                    absent
                  </li>
                  <li>
                    Denied-leave no-shows: {detail.absence.deniedLeaveNoShows} →{" "}
                    {detail.absence.fromDeniedLeave} absent
                  </li>
                </ul>
              </div>


              <div>
                <p className="text-sm font-medium">Notes</p>
                <p className="mt-1 text-sm text-muted-foreground">{detail.notes}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetail(null)}>
              Close
            </Button>
            {detail && detail.status !== "Paid" && (
              <Button
                onClick={() => {
                  setRowStatus(detail, "Paid");
                  setDetail(null);
                }}
              >
                Mark as paid
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function SalaryCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    const n = Number(draft);
    setEditing(false);
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Enter a valid salary");
      setDraft(String(value));
      return;
    }
    if (n !== value) onChange(n);
  };

  return (
    <td className="px-4 py-3 tabular-nums">
      {editing ? (
        <Input
          autoFocus
          type="number"
          min={0}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(String(value));
              setEditing(false);
            }
          }}
          className="h-8 w-[140px]"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(String(value));
            setEditing(true);
          }}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left hover:bg-secondary"
          title="Click to edit base salary"
        >
          {formatBDT(value)}
          <Pencil className="size-3 text-muted-foreground" />
        </button>
      )}
    </td>
  );
}

function AdjustCell({
  value,
  kind,
  onAdd,
}: {
  value: number;
  kind: AdjKind;
  onAdd: () => void;
}) {
  const tone =
    kind === "bonus" ? "text-success" : kind === "incentive" ? "text-info" : "text-destructive";
  const Icon = kind === "deduction" ? Minus : kind === "bonus" ? Gift : Sparkles;
  return (
    <td className="px-4 py-3">
      <button
        type="button"
        onClick={onAdd}
        className="group flex flex-col items-start gap-0.5 rounded-lg px-2 py-1 text-left transition-colors hover:bg-secondary"
      >
        <span className={cn("flex items-center gap-1.5 font-medium tabular-nums", tone)}>
          <Icon className="size-3.5" />
          {kind === "deduction" ? "-" : "+"}
          {formatBDT(value)}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
          <Plus className="size-3" /> Add {kind}
        </span>
      </button>
    </td>
  );
}

function Breakdown({
  title,
  tone,
  entries,
  negative,
}: {
  title: string;
  tone: "success" | "info" | "destructive";
  entries: { id: string; amount: number; note: string }[];
  negative?: boolean;
}) {
  const total = entries.reduce((s, e) => s + e.amount, 0);
  const toneMap = {
    success: "border-success/30 bg-success/10 text-success",
    info: "border-info/30 bg-info/10 text-info",
    destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  } as const;
  return (
    <div className="rounded-xl border border-border p-4">
      <div className={cn("rounded-lg border px-3 py-2 text-sm font-medium", toneMap[tone])}>
        {title} {negative ? "-" : "+"}
        {formatBDT(total)}
      </div>
      <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
        {entries.length === 0 && <li>No {title.toLowerCase()} entries.</li>}
        {entries.map((e) => (
          <li key={e.id} className="flex items-start justify-between gap-2">
            <span className="truncate">{e.note || "—"}</span>
            <span className="shrink-0 tabular-nums text-foreground">{formatBDT(e.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
