import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarPlus, CalendarX, Clock3 } from "lucide-react";
import { toast } from "sonner";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { startOfToday, useEmployeeSession } from "@/lib/employee-session";
import {
  ANNUAL_ALLOWANCE,
  MONTHLY_CAP,
  dateKey,
  formatDate,
  formatDateTime,
  generateLeaveRequests,
  leaveTypeTone,
  leaveTypes,
  usedDays,
  type LeaveRequest,
  type LeaveType,
} from "@/lib/leave-data";
import { loadMyLeave, saveMyLeave } from "@/lib/my-requests-store";

export const Route = createFileRoute("/me/leave")({
  head: () => ({
    meta: [
      { title: "My Leave — OmniWork Employee Portal" },
      {
        name: "description",
        content: "Check your PTO balance, apply for leave and follow the approval status of every request.",
      },
      { property: "og:title", content: "My Leave — OmniWork Employee Portal" },
      {
        property: "og:description",
        content: "Apply for PTO or unpaid leave and track approvals, denials and HR feedback.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function daysBetween(from: string, to: string) {
  const a = new Date(from);
  const b = new Date(to);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1);
}

function Page() {
  const { employee, name } = useEmployeeSession();
  const today = useMemo(() => startOfToday(), []);
  const todayKey = dateKey(today);

  const [local, setLocal] = useState<LeaveRequest[]>([]);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<LeaveType>("PTO");
  const [from, setFrom] = useState(todayKey);
  const [to, setTo] = useState(todayKey);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setLocal(loadMyLeave().filter((l) => l.employeeId === employee.id));
  }, [employee.id]);

  const generated = useMemo(
    () => generateLeaveRequests(today).filter((l) => l.employeeId === employee.id),
    [today, employee.id],
  );

  const rows = useMemo(
    () => [...local, ...generated].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)),
    [local, generated],
  );

  const used = usedDays(rows, employee.id, today.getFullYear());
  const pending = rows.filter((r) => r.status === "Pending").length;
  const monthPrefix = todayKey.slice(0, 7);
  const takenThisMonth = rows
    .filter((r) => r.status === "Approved" && r.from.startsWith(monthPrefix))
    .reduce((s, r) => s + r.days, 0);

  const apply = () => {
    if (to < from) {
      toast.error("The end date cannot be before the start date.");
      return;
    }
    if (reason.trim().length < 10) {
      toast.error("Please add a short reason for your request.");
      return;
    }
    const days = daysBetween(from, to);
    const request: LeaveRequest = {
      id: `my-lv-${Date.now()}`,
      employeeId: employee.id,
      employee: name,
      designation: employee.designation,
      department: employee.department,
      type,
      from,
      to,
      days,
      status: "Pending",
      appliedAt: new Date().toISOString(),
      reason: reason.trim(),
      documents: [],
      feedback: [],
    };
    const next = [request, ...loadMyLeave()];
    saveMyLeave(next);
    setLocal(next.filter((l) => l.employeeId === employee.id));
    setOpen(false);
    setReason("");
    toast.success("Leave request submitted — HR will review it shortly.");
  };

  const cancel = (id: string) => {
    const all = loadMyLeave().map((l) =>
      l.id === id ? { ...l, status: "Cancelled" as const } : l,
    );
    saveMyLeave(all);
    setLocal(all.filter((l) => l.employeeId === employee.id));
    toast.success("Request cancelled");
  };

  return (
    <EmployeeShell>
      <PageHeader
        title="Leave"
        description={`You get ${ANNUAL_ALLOWANCE} paid days a year, with a soft cap of ${MONTHLY_CAP} days per month.`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <CalendarPlus className="mr-2 size-4" /> Apply for leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply for leave</DialogTitle>
                <DialogDescription>
                  Requests are sent to HR for approval. You will see the decision here.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Leave type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as LeaveType)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="from">From</Label>
                    <Input
                      id="from"
                      type="date"
                      value={from}
                      className="mt-1.5"
                      onChange={(e) => {
                        setFrom(e.target.value);
                        if (to < e.target.value) setTo(e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="to">To</Label>
                    <Input
                      id="to"
                      type="date"
                      value={to}
                      className="mt-1.5"
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Duration: {daysBetween(from, to)} day{daysBetween(from, to) === 1 ? "" : "s"}
                </p>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    rows={4}
                    className="mt-1.5"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tell your manager why you need this leave and how work is covered."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={apply}>Submit request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarCheck}
          label="Days remaining"
          value={Math.max(0, ANNUAL_ALLOWANCE - used)}
          caption={`${used} of ${ANNUAL_ALLOWANCE} used in ${today.getFullYear()}`}
          highlight
        />
        <StatCard icon={Clock3} label="Pending approval" value={pending} caption="Awaiting HR decision" />
        <StatCard
          icon={CalendarCheck}
          label="Taken this month"
          value={takenThisMonth}
          caption={`Monthly cap ${MONTHLY_CAP} days`}
        />
        <StatCard
          icon={CalendarX}
          label="Requests filed"
          value={rows.length}
          caption="Full history"
        />
      </div>

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold">My requests</h2>
        </div>
        <ul className="divide-y divide-border">
          {rows.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">No leave requests yet.</li>
          )}
          {rows.map((r) => (
            <li key={r.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={leaveTypeTone[r.type]}>
                  {r.type}
                </Badge>
                <StatusPill status={r.status} />
                <span className="text-sm font-medium">
                  {formatDate(r.from)} → {formatDate(r.to)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {r.days} day{r.days === 1 ? "" : "s"} · applied {formatDateTime(r.appliedAt)}
                </span>
                {r.status === "Pending" && r.id.startsWith("my-lv-") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-destructive"
                    onClick={() => cancel(r.id)}
                  >
                    Cancel request
                  </Button>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.reason}</p>
              {r.feedback.length > 0 && (
                <div className="mt-3 space-y-2">
                  {r.feedback.map((f) => (
                    <div key={f.id} className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
                      <p className="font-medium text-foreground">{f.author}</p>
                      <p className="mt-1 text-muted-foreground">{f.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </EmployeeShell>
  );
}
