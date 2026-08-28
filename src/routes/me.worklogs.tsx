import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, FileWarning, History, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichComposer } from "@/components/board/RichComposer";
import { startOfToday, useEmployeeSession } from "@/lib/employee-session";
import { generateWorklogs, toDateKey } from "@/lib/worklog-data";
import { formatDate } from "@/lib/leave-data";
import { loadMyWorklogs, saveMyWorklogs, type MyWorklog } from "@/lib/my-requests-store";

export const Route = createFileRoute("/me/worklogs")({
  head: () => ({
    meta: [
      { title: "My Worklogs — OmniWork Employee Portal" },
      {
        name: "description",
        content:
          "Submit your end-of-day work report, edit earlier worklogs and see the full update audit trail.",
      },
      { property: "og:title", content: "My Worklogs — OmniWork Employee Portal" },
      {
        property: "og:description",
        content:
          "Write today's EOD report, revise previous reports and review every submission and edit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const richClasses =
  "prose-sm max-w-none whitespace-pre-wrap [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5";

function fmtStamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function AuditTrail({ log }: { log: MyWorklog }) {
  const [open, setOpen] = useState(false);
  const revisions = log.revisions ?? [];
  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <History className="size-3.5" />
        <span>Submitted {fmtStamp(log.submittedAt)}</span>
        {log.updatedAt && (
          <>
            <span aria-hidden>·</span>
            <span>
              Updated by {log.updatedBy ?? "you"} on {fmtStamp(log.updatedAt)}
            </span>
            <Badge variant="outline">
              {revisions.length} edit{revisions.length === 1 ? "" : "s"}
            </Badge>
          </>
        )}
        {revisions.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-6 px-2 text-xs"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide" : "View"} update history
          </Button>
        )}
      </div>
      {open && (
        <ol className="mt-3 space-y-3 border-l border-border pl-3">
          {revisions
            .slice()
            .reverse()
            .map((rev, i) => (
              <li key={`${rev.at}-${i}`}>
                <p className="text-xs font-medium text-muted-foreground">
                  Version before edit by {rev.by ?? log.updatedBy ?? "you"} on {fmtStamp(rev.at)}
                </p>
                <div
                  className={`${richClasses} mt-1 text-sm text-muted-foreground`}
                  dangerouslySetInnerHTML={{ __html: rev.report }}
                />
              </li>
            ))}
        </ol>
      )}
    </div>
  );
}

function Page() {
  const { employee, name } = useEmployeeSession();
  const today = useMemo(() => startOfToday(), []);
  const todayKey = toDateKey(today);

  const [mine, setMine] = useState<MyWorklog[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setMine(loadMyWorklogs().filter((w) => w.employeeId === employee.id));
  }, [employee.id]);

  const history = useMemo(
    () =>
      generateWorklogs(today)
        .filter((w) => w.employee === name)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [name, today],
  );

  const myLogs = useMemo(
    () => [...mine].sort((a, b) => b.date.localeCompare(a.date)),
    [mine],
  );
  const submittedToday = mine.find((w) => w.date === todayKey);
  const submitted = history.filter((w) => w.status === "Submitted").length;
  const missing = history.filter((w) => w.status === "Not Submitted").length;
  const totalEdits = mine.reduce((acc, w) => acc + (w.revisions?.length ?? 0), 0);

  const persist = (next: MyWorklog[]) => {
    saveMyWorklogs(next);
    setMine(next.filter((w) => w.employeeId === employee.id));
  };

  const validate = (html: string) => {
    const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
    if (text.length < 20) {
      toast.error("Add a bit more detail — at least a couple of sentences.");
      return false;
    }
    return true;
  };

  const submitToday = (html: string) => {
    if (!validate(html)) return;
    const all = loadMyWorklogs();
    const entry: MyWorklog = {
      id: `${employee.id}-${todayKey}`,
      employeeId: employee.id,
      date: todayKey,
      report: html,
      submittedAt: new Date().toISOString(),
    };
    persist([...all, entry]);
    toast.success("Worklog submitted for today");
  };

  const saveEdit = (log: MyWorklog, html: string) => {
    if (!validate(html)) return;
    const at = new Date().toISOString();
    const all = loadMyWorklogs().map((w) =>
      w.id === log.id
        ? {
            ...w,
            report: html,
            updatedAt: at,
            updatedBy: name,
            revisions: [...(w.revisions ?? []), { at, report: w.report, by: name }],
          }
        : w,
    );
    persist(all);
    setEditingId(null);
    toast.success("Worklog updated", { description: "The edit was recorded in the audit trail." });
  };

  /** Revise a day that only exists in the older records — keeps the original as revision 1. */
  const saveHistoricalEdit = (
    entry: { id: string; date: string; report: string; submittedAt: string | null; status: string },
    html: string,
  ) => {
    if (!validate(html)) return;
    const at = new Date().toISOString();
    const original = entry.status === "Submitted" ? `<p>${entry.report}</p>` : "<p>No report submitted for this day.</p>";
    const submittedIso = entry.submittedAt
      ? new Date(`${entry.date}T${entry.submittedAt}:00`).toISOString()
      : at;
    const created: MyWorklog = {
      id: `${employee.id}-${entry.date}`,
      employeeId: employee.id,
      date: entry.date,
      report: html,
      submittedAt: submittedIso,
      updatedAt: at,
      updatedBy: name,
      revisions: [{ at, report: original, by: name }],
    };
    persist([...loadMyWorklogs().filter((w) => w.id !== created.id), created]);
    setEditingId(null);
    toast.success("Worklog updated", { description: "The edit was recorded in the audit trail." });
  };



  return (
    <EmployeeShell>
      <PageHeader
        title="My Worklogs"
        description="File your end-of-day report before 11:59 PM. You can edit an earlier report — every update is recorded."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Submitted"
          value={submitted + mine.length}
          caption="Reports filed"
          highlight
        />
        <StatCard icon={FileWarning} label="Missed" value={missing} caption="Days without a report" />
        <StatCard
          icon={FileText}
          label="Today"
          value={submittedToday ? "Submitted" : "Pending"}
          caption={formatDate(todayKey)}
        />
        <StatCard icon={History} label="Edits" value={totalEdits} caption="Recorded updates" />
      </div>

      <section className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Today's EOD report</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Summarise what you worked on, what you completed and anything blocked.
        </p>
        {submittedToday ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-4 text-sm">
            <div className="mb-2 flex items-center gap-2">
              <StatusPill status="Submitted" />
              <span className="text-xs text-muted-foreground">
                {new Date(submittedToday.submittedAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {editingId === submittedToday.id ? (
              <>
                <RichComposer
                  initialHtml={submittedToday.report}
                  placeholder="Update today's report…"
                  submitLabel="Save update"
                  onPost={({ html }) => saveEdit(submittedToday, html)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => setEditingId(null)}
                >
                  <X className="mr-1.5 size-4" /> Cancel
                </Button>
              </>
            ) : (
              <>
                <div
                  className={richClasses}
                  dangerouslySetInnerHTML={{ __html: submittedToday.report }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setEditingId(submittedToday.id)}
                >
                  <Pencil className="mr-1.5 size-4" /> Edit report
                </Button>
              </>
            )}
            <AuditTrail log={submittedToday} />
          </div>
        ) : (
          <div className="mt-3">
            <RichComposer
              placeholder="Today I completed… (format your report, mention teammates with @)"
              submitLabel="Submit worklog"
              onPost={({ html }) => submitToday(html)}
            />
          </div>
        )}
      </section>

      <section className="mb-6 rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold">My submissions</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Reports you filed in OmniWork — edit any of them and the update audit is kept.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {myLogs
            .filter((w) => w.date !== todayKey)
            .map((w) => (
              <li key={w.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{formatDate(w.date)}</span>
                  <StatusPill status="Submitted" />
                  {w.updatedAt && <Badge variant="outline">Edited</Badge>}
                  {editingId !== w.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => setEditingId(w.id)}
                    >
                      <Pencil className="mr-1.5 size-4" /> Edit
                    </Button>
                  )}
                </div>
                {editingId === w.id ? (
                  <div className="mt-3">
                    <RichComposer
                      initialHtml={w.report}
                      placeholder="Update this report…"
                      submitLabel="Save update"
                      onPost={({ html }) => saveEdit(w, html)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="mr-1.5 size-4" /> Cancel
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`${richClasses} mt-1.5 text-sm text-muted-foreground`}
                    dangerouslySetInnerHTML={{ __html: w.report }}
                  />
                )}
                <AuditTrail log={w} />
              </li>
            ))}
          {myLogs.filter((w) => w.date !== todayKey).length === 0 && (
            <li className="p-4 text-sm text-muted-foreground">
              No earlier reports filed from the portal yet.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold">Earlier records</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            You can revise any earlier day — the original version and your name are kept in the
            audit trail.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {history
            .filter((w) => !mine.some((m) => m.date === w.date))
            .map((w) => (
              <li key={w.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{formatDate(w.date)}</span>
                  <StatusPill status={w.status} />
                  {w.submittedAt && (
                    <span className="text-xs text-muted-foreground">at {w.submittedAt}</span>
                  )}
                  {editingId !== w.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => setEditingId(w.id)}
                    >
                      <Pencil className="mr-1.5 size-4" /> Edit
                    </Button>
                  )}
                </div>
                {editingId === w.id ? (
                  <div className="mt-3">
                    <RichComposer
                      initialHtml={w.status === "Submitted" ? `<p>${w.report}</p>` : ""}
                      placeholder="Update this report…"
                      submitLabel="Save update"
                      onPost={({ html }) => saveHistoricalEdit(w, html)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="mr-1.5 size-4" /> Cancel
                    </Button>
                  </div>
                ) : (
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {w.report || "No report submitted for this day."}
                  </p>
                )}
              </li>
            ))}
        </ul>
      </section>
    </EmployeeShell>
  );
}
