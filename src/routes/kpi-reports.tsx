import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/kpi-reports")({
  head: () => ({
    meta: [
      { title: "KPI Reports — Ray ERP" },
      { name: "description", content: "Daily KPI scores, goals, and AI insights per employee." },
      { property: "og:title", content: "KPI Reports — Ray ERP" },
      { property: "og:description", content: "Daily KPI scores, goals, and AI insights per employee." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="KPI Reports" description="Daily KPI scores, goals, and AI insights per employee." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        KPI Reports module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
