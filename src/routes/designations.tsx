import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/designations")({
  head: () => ({
    meta: [
      { title: "Designations — Ray ERP" },
      { name: "description", content: "Create and oversee job titles." },
      { property: "og:title", content: "Designations — Ray ERP" },
      { property: "og:description", content: "Create and oversee job titles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Designations" description="Create and oversee job titles." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Designations module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
