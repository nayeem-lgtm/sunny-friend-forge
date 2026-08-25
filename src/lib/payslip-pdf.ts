import { jsPDF } from "jspdf";

import {
  formatBDT,
  monthLabel,
  netPay,
  periodLabel,
  sumAdjustments,
  type PayrollRow,
} from "@/lib/payroll-data";

type Meta = { bankName?: string; joiningDate?: string };

const BRAND: [number, number, number] = [24, 90, 219];
const INK: [number, number, number] = [24, 28, 38];
const MUTED: [number, number, number] = [110, 118, 134];

/** Builds a branded, print-ready payslip PDF for one employee and month. */
export function buildPayslipPdf(row: PayrollRow, month: Date, meta: Meta = {}): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 42;
  const inner = pw - margin * 2;
  const period = periodLabel(month);

  // Header band
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pw, 108, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("OmniWork", margin, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Work Smarter. Manage Better. Perform Better.", margin, 63);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("PAYSLIP", pw - margin, 42, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(monthLabel(month), pw - margin, 60, { align: "right" });
  doc.text(`${period.from} – ${period.to}`, pw - margin, 74, { align: "right" });

  let y = 140;

  // Employee card
  doc.setDrawColor(224, 228, 236);
  doc.setFillColor(248, 250, 253);
  doc.roundedRect(margin, y - 24, inner, 96, 8, 8, "FD");
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(row.employee, margin + 16, y - 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);

  const pairs: [string, string][] = [
    ["Employee ID", row.employeeCode],
    ["Designation", row.designation],
    ["Department", row.department],
    ["Email", row.email],
    ["Bank", meta.bankName ?? "—"],
    ["Account", `${row.accountNumber} (${row.accountType})`],
  ];
  pairs.forEach(([k, v], i) => {
    const col = i % 2;
    const rowIdx = Math.floor(i / 2);
    const x = margin + 16 + col * (inner / 2 - 8);
    const ty = y + 18 + rowIdx * 15;
    doc.setTextColor(...MUTED);
    doc.text(`${k}:`, x, ty);
    doc.setTextColor(...INK);
    doc.text(String(v), x + 62, ty, { maxWidth: inner / 2 - 80 });
  });

  y += 96;

  // Breakdown table
  const absenceDeduction = +(row.absence.equivalentAbsentDays * row.dailyRate).toFixed(2);
  const earnings: [string, number][] = [
    ["Base salary", row.baseSalary],
    ...row.bonuses.map((b) => [`Bonus · ${b.note}`, b.amount] as [string, number]),
    ...row.incentives.map((b) => [`Incentive · ${b.note}`, b.amount] as [string, number]),
  ];
  const deductions: [string, number][] = row.deductions.map(
    (d) => [`${d.note}`, d.amount] as [string, number],
  );

  const section = (title: string, rows: [string, number][], sign: "+" | "-") => {
    doc.setFillColor(...BRAND);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.roundedRect(margin, y, inner, 22, 4, 4, "F");
    doc.text(title, margin + 12, y + 15);
    doc.text("Amount", pw - margin - 12, y + 15, { align: "right" });
    y += 22;

    if (rows.length === 0) {
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.text("None", margin + 12, y + 16);
      y += 26;
    }
    rows.forEach(([label, amount], i) => {
      if (y > doc.internal.pageSize.getHeight() - 120) {
        doc.addPage();
        y = margin;
      }
      if (i % 2 === 0) {
        doc.setFillColor(250, 251, 253);
        doc.rect(margin, y, inner, 22, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...INK);
      doc.text(label, margin + 12, y + 15, { maxWidth: inner - 150 });
      doc.text(`${sign}${formatBDT(amount)}`, pw - margin - 12, y + 15, { align: "right" });
      y += 22;
    });

    const total = rows.reduce((s, [, a]) => s + a, 0);
    doc.setDrawColor(224, 228, 236);
    doc.line(margin, y, pw - margin, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.text(`Total ${title.toLowerCase()}`, margin + 12, y + 16);
    doc.text(`${sign}${formatBDT(total)}`, pw - margin - 12, y + 16, { align: "right" });
    y += 34;
    return total;
  };

  y += 8;
  const totalEarnings = section("Earnings", earnings, "+");
  const totalDeductions = section("Deductions", deductions, "-");

  // Net pay
  if (y > doc.internal.pageSize.getHeight() - 170) {
    doc.addPage();
    y = margin;
  }
  doc.setFillColor(238, 244, 255);
  doc.setDrawColor(...BRAND);
  doc.roundedRect(margin, y, inner, 46, 8, 8, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text("Net pay", margin + 16, y + 29);
  doc.setFontSize(16);
  doc.setTextColor(...BRAND);
  doc.text(formatBDT(netPay(row)), pw - margin - 16, y + 30, { align: "right" });
  y += 62;

  // Absence summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text("Attendance & absence summary", margin, y);
  y += 8;
  const a = row.absence;
  const items: [string, string][] = [
    ["Recorded absences", String(a.recordedAbsences)],
    ["Late days", `${a.lateDays} (= ${a.fromLate} absent)`],
    ["Short-hour days", `${a.shortDays} (= ${a.fromShortHours} absent)`],
    ["Missing work logs", `${a.missingLogs} (= ${a.fromWorkLogs} absent)`],
    ["Denied-leave no shows", `${a.deniedLeaveNoShows} (= ${a.fromDeniedLeave} absent)`],
    ["Equivalent absent days", String(a.equivalentAbsentDays)],
    ["Daily rate", formatBDT(row.dailyRate)],
    ["Absence deduction", `-${formatBDT(absenceDeduction)}`],
  ];
  items.forEach(([k, v], i) => {
    const col = i % 2;
    const rowIdx = Math.floor(i / 2);
    const x = margin + col * (inner / 2);
    const ty = y + 16 + rowIdx * 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`${k}:`, x, ty);
    doc.setTextColor(...INK);
    doc.text(v, x + 132, ty);
  });
  y += 16 + Math.ceil(items.length / 2) * 15 + 16;

  // Footer
  const fy = doc.internal.pageSize.getHeight() - 48;
  doc.setDrawColor(224, 228, 236);
  doc.line(margin, fy - 16, pw - margin, fy - 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    `Status: ${row.status} · Gross earnings ${formatBDT(totalEarnings)} · Deductions ${formatBDT(totalDeductions)}`,
    margin,
    fy,
  );
  doc.text(
    "Generated electronically by OmniWork. This is a system-generated payslip and needs no signature.",
    margin,
    fy + 12,
  );

  return doc;
}

export function payslipFileName(row: PayrollRow, month: Date) {
  return `payslip-${row.employeeCode}-${monthLabel(month).replace(/\s+/g, "-").toLowerCase()}.pdf`;
}

export function downloadPayslipPdf(row: PayrollRow, month: Date, meta?: Meta) {
  buildPayslipPdf(row, month, meta).save(payslipFileName(row, month));
}

export function openPayslipPdf(row: PayrollRow, month: Date, meta?: Meta) {
  const url = buildPayslipPdf(row, month, meta).output("bloburl");
  window.open(url as unknown as string, "_blank", "noopener");
}

export { sumAdjustments };
