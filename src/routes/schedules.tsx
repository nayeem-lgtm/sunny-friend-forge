import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/schedules")({
  head: () => ({
    meta: [
      { title: "Schedules — WorkBoard" },
      { name: "description", content: "Manage employee schedules." },
      { property: "og:title", content: "Schedules — WorkBoard" },
      { property: "og:description", content: "Manage employee schedules." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Schedules" description="Manage employee schedules." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Schedules module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
