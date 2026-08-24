import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meetings — Ray ERP" },
      { name: "description", content: "Manage scheduled meetings and appointments." },
      { property: "og:title", content: "Meetings — Ray ERP" },
      { property: "og:description", content: "Manage scheduled meetings and appointments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Meetings" description="Manage scheduled meetings and appointments." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Meetings module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
