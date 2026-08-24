import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  CalendarClock,
  Check,
  CircleSlash,
  FileText,
  Hourglass,
  Paperclip,
  Plane,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { departments } from "@/lib/employee-data";
import { cn } from "@/lib/utils";
import {
  ANNUAL_ALLOWANCE,
  MONTHLY_CAP,
  dateKey,
  formatDate,
  formatDateTime,
  generateLeaveRequests,
  initials,
  leaveStatuses,
  leaveTypeTone,
  leaveTypes,
  usedDays,
  type LeaveRequest,
} from "@/lib/leave-data";

export const Route = createFileRoute("/leave")({
  head: () => ({
    meta: [
      { title: "Leave — OmniWork" },
      {
        name: "description",
        content: "Review, approve and track employee leave requests, balances and upcoming time off.",
      },
      { property: "og:title", content: "Leave — OmniWork" },
      {
        property: "og:description",
        content: "Review, approve and track employee leave requests, balances and upcoming time off.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
      {initials(name)}
    </span>
  );
}

function TypePill({ type }: { type: LeaveRequest["type"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        leaveTypeTone[type],
      )}
    >
      {type}
    </span>
  );
}

function Page() {
  const [today, setToday] = useState<Date | null>(null);
  const [rows, setRows] = useState<LeaveRequest[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
    setRows(generateLeaveRequests(d));
  }, []);

  const todayKey = today ? dateKey(today) : "";
  const year = today?.getFullYear() ?? new Date().getFullYear();

  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.status === "Pending");
    const onLeave = rows.filter((r) => r.status === "Approved" && r.from <= todayKey && r.to >= todayKey);
    const upcoming = rows.filter((r) => r.status === "Approved" && r.from > todayKey);
    const approvedDays = rows
      .filter((r) => r.status === "Approved" && r.from.startsWith(String(year)))
      .reduce((s, r) => s + r.days, 0);
    return { pending: pending.length, onLeave: onLeave.length, upcoming: upcoming.length, approvedDays };
  }, [rows, todayKey, year]);

  const active = rows.find((r) => r.id === openId) ?? null;

  const decide = (id: string, status: "Approved" | "Rejected") => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              feedback: comment.trim()
                ? [...r.feedback, { id: `fb-${Date.now()}`, author: "HR Admin", text: comment.trim(), at: new Date().toISOString() }]
                : r.feedback,
            }
          : r,
      ),
    );
    setComment("");
  };

  const postFeedback = (id: string) => {
    if (!comment.trim()) return;
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              feedback: [
                ...r.feedback,
                { id: `fb-${Date.now()}`, author: "HR Admin", text: comment.trim(), at: new Date().toISOString() },
              ],
            }
          : r,
      ),
    );
    setComment("");
  };

  const columns: Column<LeaveRequest>[] = [
    {
      key: "employee",
      header: "Employee",
      searchable: true,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.employee} />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{r.employee}</p>
            <p className="truncate text-xs text-muted-foreground">{r.designation}</p>
          </div>
        </div>
      ),
    },
    { key: "type", header: "Leave Type", accessor: (r) => r.type, cell: (r) => <TypePill type={r.type} /> },
    {
      key: "dates",
      header: "Leave Dates",
      accessor: (r) => r.from,
      cell: (r) => (
        <span className="whitespace-nowrap text-foreground">
          {formatDate(r.from)}
          {r.to !== r.from && ` – ${formatDate(r.to)}`}
        </span>
      ),
    },
    { key: "days", header: "Days", accessor: (r) => r.days, cell: (r) => <span className="tabular-nums">{r.days}</span> },
    { key: "status", header: "Status", accessor: (r) => r.status, cell: (r) => <StatusPill status={r.status} /> },
    {
      key: "appliedAt",
      header: "Applied Date",
      accessor: (r) => r.appliedAt,
      cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(r.appliedAt)}</span>,
    },
    { key: "department", header: "Department", accessor: (r) => r.department, className: "hidden" },
  ];

  const used = active ? usedDays(rows, active.employeeId, year) : 0;

  return (
    <AppShell>
      <PageHeader title="Leave" description="Review requests, track balances and keep an eye on who is off." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Hourglass} label="Pending approval" value={stats.pending} caption="Awaiting a decision" highlight />
        <StatCard icon={Plane} label="Out today" value={stats.onLeave} caption="Currently on leave" />
        <StatCard icon={CalendarClock} label="Upcoming" value={stats.upcoming} caption="Approved future leave" />
        <StatCard icon={CalendarDays} label={`Days taken in ${year}`} value={stats.approvedDays} caption="Across all employees" />
      </div>

      <div className="mt-6">
        <DataTable
          data={rows as unknown as Record<string, unknown>[] as LeaveRequest[]}
          columns={columns}
          onRowClick={(r) => {
            setOpenId(r.id);
            setComment("");
          }}
          filters={[
            { key: "type", label: "Leave Type", options: leaveTypes },
            { key: "status", label: "Status", options: leaveStatuses },
            { key: "department", label: "Department", options: [...departments] },
          ]}
          filterAccessor={(row, key) => String((row as unknown as Record<string, unknown>)[key] ?? "")}
          emptyMessage="No leave requests for this filter."
        />
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-3xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>Leave Request Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-base font-semibold text-primary">
                    {initials(active.employee)}
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{active.employee}</p>
                    <p className="text-sm text-muted-foreground">
                      {active.designation} · {active.department}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-info/25 bg-info/10 p-4">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-info/20 text-info">
                      <CalendarDays className="size-4" />
                    </span>
                    <p className="mt-3 text-sm text-muted-foreground">Days remaining</p>
                    <p className="text-2xl font-semibold text-foreground">{Math.max(0, ANNUAL_ALLOWANCE - used)}</p>
                  </div>
                  <div className="rounded-xl border border-primary/25 bg-primary/10 p-4">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
                      <CircleSlash className="size-4" />
                    </span>
                    <p className="mt-3 text-sm text-muted-foreground">Leave used</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {used}/{ANNUAL_ALLOWANCE}
                    </p>
                    <p className="text-xs text-muted-foreground">Max {MONTHLY_CAP} day(s) per month</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                    <Field label="Status">
                      <StatusPill status={active.status} />
                    </Field>
                    <Field label="Leave type">
                      <TypePill type={active.type} />
                    </Field>
                    <Field label="Days requested">
                      <p className="text-sm text-foreground">{active.days}</p>
                    </Field>
                    <Field label="Applied date">
                      <p className="text-sm text-foreground">{formatDateTime(active.appliedAt)}</p>
                    </Field>
                    <Field label="Leave dates">
                      <p className="text-sm text-foreground">
                        {formatDate(active.from)} – {formatDate(active.to)}
                      </p>
                    </Field>
                    <Field label="Reason for leave">
                      <p className="text-sm leading-relaxed text-foreground">{active.reason}</p>
                    </Field>
                    <Field label="Supporting documents">
                      {active.documents.length ? (
                        <ul className="space-y-1">
                          {active.documents.map((d) => (
                            <li key={d} className="flex items-center gap-2 text-sm text-primary">
                              <Paperclip className="size-3.5" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="size-3.5" /> None attached
                        </p>
                      )}
                    </Field>
                  </div>

                  <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Comment</p>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Type a note for the employee…"
                        rows={4}
                        disabled={active.status !== "Pending"}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        disabled={active.status !== "Pending" || !comment.trim()}
                        onClick={() => postFeedback(active.id)}
                      >
                        Post feedback
                      </Button>
                      <Button disabled={active.status !== "Pending"} onClick={() => decide(active.id, "Approved")}>
                        <Check className="size-4" /> Approve
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={active.status !== "Pending"}
                        onClick={() => decide(active.id, "Rejected")}
                      >
                        <X className="size-4" /> Reject
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Feedback and decisions are available only while the request is pending.
                    </p>

                    <div>
                      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Feedback history</p>
                      {active.feedback.length ? (
                        <ul className="space-y-3">
                          {active.feedback.map((f) => (
                            <li key={f.id} className="rounded-lg border border-border bg-secondary/40 p-3">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">{f.author}</span>
                                <span>{formatDateTime(f.at)}</span>
                              </div>
                              <p className="mt-1 text-sm text-foreground">{f.text}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No feedback posted yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
