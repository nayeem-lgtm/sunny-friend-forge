import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Ray ERP" },
      { name: "description", content: "Manage and track project delivery." },
      { property: "og:title", content: "Projects — Ray ERP" },
      { property: "og:description", content: "Manage and track project delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AppShell>
      <PageHeader title="Projects" description="Manage and track project delivery." />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        Projects module arrives in an upcoming phase.
      </div>
    </AppShell>
  );
}
