import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/employees")({
  head: () => ({
    meta: [
      { title: "Employee Directory — Ray ERP" },
      { name: "description", content: "View, edit, and organize employee profiles." },
      { property: "og:title", content: "Employee Directory — Ray ERP" },
      { property: "og:description", content: "View, edit, and organize employee profiles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Employee Directory" description="View, edit, and organize employee profiles." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Employee Directory module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
