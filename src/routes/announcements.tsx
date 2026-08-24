import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Ray ERP" },
      { name: "description", content: "Manage and create announcements." },
      { property: "og:title", content: "Announcements — Ray ERP" },
      { property: "og:description", content: "Manage and create announcements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Announcements" description="Manage and create announcements." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Announcements module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
