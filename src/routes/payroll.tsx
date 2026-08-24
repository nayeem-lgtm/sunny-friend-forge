import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/payroll")({
  head: () => ({
    meta: [
      { title: "Payroll — Ray ERP" },
      { name: "description", content: "Process payroll and manage compensation." },
      { property: "og:title", content: "Payroll — Ray ERP" },
      { property: "og:description", content: "Process payroll and manage compensation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Payroll" description="Process payroll and manage compensation." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Payroll module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
