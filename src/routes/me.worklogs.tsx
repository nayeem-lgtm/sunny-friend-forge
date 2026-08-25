import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, FileWarning } from "lucide-react";
import { toast } from "sonner";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
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
        content: "Submit your end-of-day work report and review every worklog you have filed.",
      },
      { property: "og:title", content: "My Worklogs — OmniWork Employee Portal" },
      {
        property: "og:description",
        content: "Write today's EOD report and browse your submission history and missed days.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { employee, name } = useEmployeeSession();
  const today = useMemo(() => startOfToday(), []);
  const todayKey = toDateKey(today);

  const [mine, setMine] = useState<MyWorklog[]>([]);
  const [draft, setDraft] = useState("");

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

  const submittedToday = mine.find((w) => w.date === todayKey);
  const submitted = history.filter((w) => w.status === "Submitted").length;
  const missing = history.filter((w) => w.status === "Not Submitted").length;

  const submit = (html: string) => {
    const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
    if (text.length < 20) {
      toast.error("Add a bit more detail — at least a couple of sentences.");
      return;
    }
    const all = loadMyWorklogs().filter((w) => !(w.employeeId === employee.id && w.date === todayKey));
    const entry: MyWorklog = {
      id: `${employee.id}-${todayKey}`,
      employeeId: employee.id,
      date: todayKey,
      report: html,
      submittedAt: new Date().toISOString(),
    };
    const next = [...all, entry];
    saveMyWorklogs(next);
    setMine(next.filter((w) => w.employeeId === employee.id));
    setDraft("");
    toast.success("Worklog submitted for today");
  };

  return (
    <EmployeeShell>
      <PageHeader
        title="My Worklogs"
        description="File your end-of-day report before 11:59 PM. Missing three reports counts as one absent day."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
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
            <div
              className="prose-sm max-w-none whitespace-pre-wrap [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: submittedToday.report }}
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setDraft(submittedToday.report);
                const next = loadMyWorklogs().filter(
                  (w) => !(w.employeeId === employee.id && w.date === todayKey),
                );
                saveMyWorklogs(next);
                setMine(next.filter((w) => w.employeeId === employee.id));
              }}
            >
              Edit report
            </Button>
          </div>
        ) : (
          <div className="mt-3">
            <RichComposer
              key={draft ? "draft" : "fresh"}
              initialHtml={draft}
              placeholder="Today I completed… (format your report, mention teammates with @)"
              submitLabel="Submit worklog"
              onPost={({ html }) => submit(html)}
            />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold">Submission history</h2>
        </div>
        <ul className="divide-y divide-border">
          {mine
            .filter((w) => w.date !== todayKey)
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((w) => (
              <li key={w.id} className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatDate(w.date)}</span>
                  <StatusPill status="Submitted" />
                </div>
                <div
                  className="prose-sm mt-1.5 max-w-none text-sm text-muted-foreground [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: w.report }}
                />
              </li>
            ))}
          {history.map((w) => (
            <li key={w.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{formatDate(w.date)}</span>
                <StatusPill status={w.status} />
                {w.submittedAt && (
                  <span className="text-xs text-muted-foreground">at {w.submittedAt}</span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {w.report || "No report submitted for this day."}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </EmployeeShell>
  );
}
