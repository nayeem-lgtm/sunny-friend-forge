import { createFileRoute } from "@tanstack/react-router";
import { Building2, CalendarCheck, RefreshCw, UserCheck, Users } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ray ERP Operations Platform" },
      {
        name: "description",
        content:
          "Ray ERP dashboard: headcount, attendance, leave and project insight for a digital advertising agency.",
      },
      { property: "og:title", content: "Dashboard — Ray ERP Operations Platform" },
      {
        property: "og:description",
        content: "Headcount, attendance, leave and project insight in one internal ops platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <AppShell>
      <PageHeader
        title="Hi Arlene! Welcome Back"
        description="Super Admin — full access to every module and action."
        actions={
          <Button variant="outline" className="gap-2">
            <RefreshCw className="size-4" /> Refresh Data
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Employees" value={26} caption="3 inactive" highlight />
        <StatCard icon={Building2} label="Total Departments" value={12} caption="Across the agency" />
        <StatCard icon={UserCheck} label="Today's Attendance" value={21} caption="of 23 active employees" />
        <StatCard icon={CalendarCheck} label="On Leave" value={2} caption="Today" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground lg:col-span-2">
          Attendance Overview chart arrives in a later phase.
        </div>
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
          Leave Type Breakdown
        </div>
      </div>
    </AppShell>
  );
}
