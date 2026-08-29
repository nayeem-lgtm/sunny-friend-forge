import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarCheck, CalendarPlus, CalendarX, Clock3, Paperclip, Upload, X } from "lucide-react";
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
import { LeaveComments } from "@/components/leave/LeaveComments";
import { EmployeeMultiCombobox } from "@/components/shared/EmployeeMultiCombobox";
import { employees } from "@/lib/employee-data";
import { useLeaveThread, type LeaveAttachment, type LeaveComment } from "@/lib/leave-thread-store";
import { MessagesSquare } from "lucide-react";

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
  const [docs, setDocs] = useState<string[]>([]);
  const [handover, setHandover] = useState<"yes" | "no">("no");
  const [handoverTo, setHandoverTo] = useState<string[]>([]);
  const colleagues = useMemo(
    () =>
      employees
        .filter((e) => e.id !== employee.id)
        .map((e) => `${e.firstName} ${e.lastName}`)
        .sort((a, b) => a.localeCompare(b)),
    [employee.id],
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const { overrides, commentsFor, post, override } = useLeaveThread();

  useEffect(() => {
    setLocal(loadMyLeave().filter((l) => l.employeeId === employee.id));
  }, [employee.id]);

  const generated = useMemo(
    () => generateLeaveRequests(today).filter((l) => l.employeeId === employee.id),
    [today, employee.id],
  );

  const rows = useMemo(
    () =>
      [...local, ...generated]
        .map((r) => {
          const o = overrides[r.id];
          return o?.status ? { ...r, status: o.status as LeaveRequest["status"] } : r;
        })
        .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)),
    [local, generated, overrides],
  );

  const active = rows.find((r) => r.id === openId) ?? null;

  const threadFor = (r: LeaveRequest): LeaveComment[] =>
    [
      ...r.feedback.map((f) => ({
        id: f.id,
        requestId: r.id,
        author: f.author,
        role: "admin" as const,
        text: f.text,
        at: f.at,
      })),
      ...commentsFor(r.id),
    ].sort((a, b) => a.at.localeCompare(b.at));

  const confirmWithdraw = () => {
    if (!withdrawId) return;
    if (withdrawReason.trim().length < 5) {
      toast.error("Please tell HR why you are withdrawing this request.");
      return;
    }
    override(withdrawId, {
      status: "Withdrawn",
      withdrawReason: withdrawReason.trim(),
      withdrawnAt: new Date().toISOString(),
    });
    post({
      requestId: withdrawId,
      author: name,
      role: "employee",
      text: `Withdrew this leave request. Reason: ${withdrawReason.trim()}`,
    });
    setWithdrawId(null);
    setWithdrawReason("");
    toast.success("Request withdrawn — HR has been notified.");
  };

  const used = usedDays(rows, employee.id, today.getFullYear());
  const pending = rows.filter((r) => r.status === "Pending").length;
  const monthPrefix = todayKey.slice(0, 7);
  const takenThisMonth = rows
    .filter((r) => r.status === "Approved" && r.from.startsWith(monthPrefix))
    .reduce((s, r) => s + r.days, 0);

  const year = today.getFullYear();
  const inYear = rows.filter((r) => r.from.startsWith(String(year)));
  const ptoTaken = inYear
    .filter((r) => r.type === "PTO" && r.status === "Approved")
    .reduce((s, r) => s + r.days, 0);
  const ptoPending = inYear
    .filter((r) => r.type === "PTO" && r.status === "Pending")
    .reduce((s, r) => s + r.days, 0);
  const ptoLeft = Math.max(0, ANNUAL_ALLOWANCE - ptoTaken);
  const unpaidTaken = inYear
    .filter((r) => r.type === "Unpaid" && r.status === "Approved")
    .reduce((s, r) => s + r.days, 0);
  const ptoPct = Math.min(100, (ptoTaken / ANNUAL_ALLOWANCE) * 100);

  const apply = () => {
    if (to < from) {
      toast.error("The end date cannot be before the start date.");
      return;
    }
    if (reason.trim().length < 10) {
      toast.error("Please add a short reason for your request.");
      return;
    }
    if (handover === "yes" && handoverTo.length === 0) {
      toast.error("Please choose at least one colleague who will take over your work.");
      return;
    }
    const days = daysBetween(from, to);
    if (days > MONTHLY_CAP) {
      toast.error(`You can request at most ${MONTHLY_CAP} days of leave per month.`);
      return;
    }
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
      documents: docs,
      feedback: [],
      handoverRequired: handover === "yes",
      handoverTo: handover === "yes" ? handoverTo.join(", ") : "",
    };
    const next = [request, ...loadMyLeave()];
    saveMyLeave(next);
    setLocal(next.filter((l) => l.employeeId === employee.id));
    setOpen(false);
    setReason("");
    setDocs([]);
    setHandover("no");
    setHandoverTo([]);
    toast.success("Leave request submitted — HR will review it shortly.");
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

                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <Label>Handover required</Label>
                  <div className="mt-2 flex gap-2">
                    {(["yes", "no"] as const).map((v) => (
                      <Button
                        key={v}
                        type="button"
                        size="sm"
                        variant={handover === v ? "default" : "outline"}
                        onClick={() => setHandover(v)}
                      >
                        {v === "yes" ? "Yes" : "No"}
                      </Button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Handover</span> means transferring
                    responsibility for your ongoing work, tasks, projects, clients or other job-related
                    responsibilities to another team member during your absence, so that work can
                    continue without interruption.
                  </p>
                  {handover === "yes" && (
                    <div className="mt-3">
                      <Label>Handover to</Label>
                      <p className="mb-1.5 mt-1 text-xs text-muted-foreground">
                        Search and select one or more colleagues who will cover your work.
                      </p>
                      <EmployeeMultiCombobox
                        value={handoverTo}
                        onChange={setHandoverTo}
                        names={colleagues}
                        placeholder="Select colleagues"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label>Supporting documents</Label>
                  <label
                    htmlFor="leave-docs"
                    className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-secondary/30 p-5 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <Upload className="size-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Upload supporting materials</span>
                    <span className="text-xs text-muted-foreground">
                      Medical certificate, travel proof or any relevant file (PDF, image, doc)
                    </span>
                    <input
                      id="leave-docs"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const names = Array.from(e.target.files ?? []).map((f) => f.name);
                        if (names.length) setDocs((prev) => [...prev, ...names]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {docs.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {docs.map((d, i) => (
                        <li
                          key={`${d}-${i}`}
                          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs"
                        >
                          <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{d}</span>
                          <button
                            type="button"
                            className="ml-auto text-muted-foreground hover:text-destructive"
                            onClick={() => setDocs((prev) => prev.filter((_, idx) => idx !== i))}
                            aria-label={`Remove ${d}`}
                          >
                            <X className="size-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Caution:</span> the maximum allowed
                    leave — PTO or unpaid — is {MONTHLY_CAP} days per month. Requests longer than that
                    cannot be submitted, and anything beyond the cap may be denied or treated as
                    unauthorised absence.
                  </p>
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
                <div className="ml-auto flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setOpenId(r.id)}>
                    <MessagesSquare className="mr-1.5 size-3.5" />
                    Comments
                    {threadFor(r).length > 0 && (
                      <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 text-[11px] font-semibold text-primary">
                        {threadFor(r).length}
                      </span>
                    )}
                  </Button>
                  {r.status === "Pending" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        setWithdrawId(r.id);
                        setWithdrawReason("");
                      }}
                    >
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.reason}</p>
              {r.handoverRequired && (
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Handover:</span>{" "}
                  {r.handoverTo || "not specified"}
                </p>
              )}
              {overrides[r.id]?.withdrawReason && (
                <p className="mt-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Withdrawn:</span>{" "}
                  {overrides[r.id]?.withdrawReason}
                </p>
              )}
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

      <Dialog open={!!active} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {formatDate(active.from)} → {formatDate(active.to)} · {active.type}
                </DialogTitle>
                <DialogDescription>
                  Talk to HR about this request. Everything here is visible to both of you.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={active.status} />
                <span className="text-xs text-muted-foreground">
                  {active.days} day{active.days === 1 ? "" : "s"} · applied {formatDateTime(active.appliedAt)}
                </span>
              </div>
              <LeaveComments
                messages={threadFor(active)}
                viewerRole="employee"
                viewerName={name}
                onSend={(text: string, files: LeaveAttachment[]) =>
                  post({ requestId: active.id, author: name, role: "employee", text, attachments: files })
                }
                placeholder="Add a comment or extra information for HR…"
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!withdrawId} onOpenChange={(o) => !o && setWithdrawId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw leave request</DialogTitle>
            <DialogDescription>
              The request will be marked as withdrawn and your reason will be shared with HR.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
            placeholder="Why are you withdrawing this request?"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawId(null)}>
              Keep request
            </Button>
            <Button variant="destructive" onClick={confirmWithdraw}>
              Withdraw request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EmployeeShell>
  );
}
