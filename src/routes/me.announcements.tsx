import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Pin, Search } from "lucide-react";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEmployeeSession } from "@/lib/employee-session";
import {
  announcementCategories,
  categoryStyles,
  formatBytes,
  formatDateTime,
  initialAnnouncements,
  relativeTime,
  stripHtml,
  type Announcement,
} from "@/lib/announcement-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/me/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — OmniWork Employee Portal" },
      {
        name: "description",
        content: "Company announcements, policies, events and holiday notices shared with your department.",
      },
      { property: "og:title", content: "Announcements — OmniWork Employee Portal" },
      {
        property: "og:description",
        content: "Read company-wide and department announcements with attached documents.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { employee } = useEmployeeSession();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [viewing, setViewing] = useState<Announcement | null>(null);

  const items = useMemo(
    () =>
      initialAnnouncements
        .filter((a) => a.audience === "Everyone" || a.audience === employee.department)
        .filter((a) => category === "All" || a.category === category)
        .filter(
          (a) =>
            !query ||
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            stripHtml(a.html).toLowerCase().includes(query.toLowerCase()),
        )
        .sort(
          (a, b) =>
            Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt),
        ),
    [employee.department, category, query],
  );

  return (
    <EmployeeShell>
      <PageHeader
        title="Announcements"
        description={`Notices for everyone and for the ${employee.department}.`}
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="w-56 pl-8"
              placeholder="Search announcements"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["All", ...announcementCategories].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              category === c
                ? "border-primary bg-primary/15 font-medium text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <button
            key={a.id}
            onClick={() => setViewing(a)}
            className="rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              {a.pinned && <Pin className="size-3.5 text-primary" />}
              <Badge variant="outline" className={categoryStyles[a.category]}>
                {a.category}
              </Badge>
              <span className="ml-auto text-xs text-muted-foreground">
                {relativeTime(a.createdAt)}
              </span>
            </div>
            <h2 className="mt-2 text-base font-semibold">{a.title}</h2>
            <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{stripHtml(a.html)}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{a.author}</span>
              {a.files.length > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="size-3.5" /> {a.files.length} attachment
                  {a.files.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </button>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No announcements match your filters.</p>
        )}
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.title}</DialogTitle>
                <DialogDescription>
                  {viewing.author} · {formatDateTime(viewing.createdAt)} · {viewing.audience}
                </DialogDescription>
              </DialogHeader>
              <div
                className="prose-sm space-y-3 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: viewing.html }}
              />
              {viewing.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Attachments
                  </p>
                  {viewing.files.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"
                    >
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="truncate">{f.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatBytes(f.size)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </EmployeeShell>
  );
}
