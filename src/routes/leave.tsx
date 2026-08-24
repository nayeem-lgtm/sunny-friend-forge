import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/leave")({
  head: () => ({
    meta: [
      { title: "Leave Management — Ray ERP" },
      { name: "description", content: "Manage employee leave requests and approvals." },
      { property: "og:title", content: "Leave Management — Ray ERP" },
      { property: "og:description", content: "Manage employee leave requests and approvals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Leave Management" description="Manage employee leave requests and approvals." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Leave Management module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
