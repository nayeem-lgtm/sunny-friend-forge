import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/permissions")({
  head: () => ({
    meta: [
      { title: "Permissions — OmniWork" },
      { name: "description", content: "Manage and view employee role permissions." },
      { property: "og:title", content: "Permissions — OmniWork" },
      { property: "og:description", content: "Manage and view employee role permissions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Permissions" description="Manage and view employee role permissions." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Permissions module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
