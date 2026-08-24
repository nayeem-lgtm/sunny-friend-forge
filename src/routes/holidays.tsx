import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/holidays")({
  head: () => ({
    meta: [
      { title: "Holidays — Ray ERP" },
      { name: "description", content: "View and organize company holidays." },
      { property: "og:title", content: "Holidays — Ray ERP" },
      { property: "og:description", content: "View and organize company holidays." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Holidays" description="View and organize company holidays." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Holidays module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
