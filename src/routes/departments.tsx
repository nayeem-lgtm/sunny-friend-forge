import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/departments")({
  head: () => ({
    meta: [
      { title: "Departments — Ray ERP" },
      { name: "description", content: "Easily set up and oversee departments." },
      { property: "og:title", content: "Departments — Ray ERP" },
      { property: "og:description", content: "Easily set up and oversee departments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Departments" description="Easily set up and oversee departments." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Departments module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
