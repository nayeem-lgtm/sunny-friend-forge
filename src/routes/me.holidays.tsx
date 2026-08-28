import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { Button } from "@/components/ui/button";
import { HolidayCalendar, HolidayLegend } from "@/components/holidays/HolidayCalendar";
import { HolidayHighlights } from "@/components/holidays/HolidayHighlights";
import { useHolidays } from "@/lib/holiday-store";

export const Route = createFileRoute("/me/holidays")({
  head: () => ({
    meta: [
      { title: "Holiday Calendar — OmniWork" },
      { name: "description", content: "See every company holiday, duration and greetings for the year." },
      { property: "og:title", content: "Holiday Calendar — OmniWork" },
      { property: "og:description", content: "See every company holiday, duration and greetings for the year." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { holidays } = useHolidays();
  const [year, setYear] = useState(new Date().getFullYear());

  return (
    <EmployeeShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Holiday Calendar</h1>
            <p className="text-sm text-muted-foreground">
              Hover any highlighted date to see the holiday, how long it runs and a note from the team.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <Button variant="ghost" size="icon" onClick={() => setYear((y) => y - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-14 text-center text-sm font-medium">{year}</span>
            <Button variant="ghost" size="icon" onClick={() => setYear((y) => y + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <HolidayHighlights holidays={holidays} year={year} />
        <HolidayLegend />
        <HolidayCalendar year={year} holidays={holidays} />
      </div>
    </EmployeeShell>
  );
}
