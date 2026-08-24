import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Monitoring — Ray ERP" },
      { name: "description", content: "Monitor your managed employees in real-time." },
      { property: "og:title", content: "Monitoring — Ray ERP" },
      { property: "og:description", content: "Monitor your managed employees in real-time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Monitoring" description="Monitor your managed employees in real-time." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Monitoring module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
