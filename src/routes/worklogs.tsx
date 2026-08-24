import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/worklogs")({
  head: () => ({
    meta: [
      { title: "Worklogs — Ray ERP" },
      { name: "description", content: "View and manage all worklog entries." },
      { property: "og:title", content: "Worklogs — Ray ERP" },
      { property: "og:description", content: "View and manage all worklog entries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Worklogs" description="View and manage all worklog entries." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Worklogs module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
