import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance Logs — Ray ERP" },
      { name: "description", content: "Track employee attendance across all departments." },
      { property: "og:title", content: "Attendance Logs — Ray ERP" },
      { property: "og:description", content: "Track employee attendance across all departments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Attendance Logs" description="Track employee attendance across all departments." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Attendance Logs module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
