import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Clock, ExternalLink, Users, Video } from "lucide-react";
import { toast } from "sonner";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEmployeeSession } from "@/lib/employee-session";
import {
  attendeeNames,
  downloadIcs,
  loadMeetings,
  meetingEnd,
  meetingStart,
  type Meeting,
} from "@/lib/meeting-data";

export const Route = createFileRoute("/me/meetings")({
  head: () => ({
    meta: [
      { title: "My Meetings — OmniWork Employee Portal" },
      {
        name: "description",
        content: "Every meeting you are invited to, with join links and one-click calendar sync.",
      },
      { property: "og:title", content: "My Meetings — OmniWork Employee Portal" },
      {
        property: "og:description",
        content: "Join your scheduled meetings and add them to your own calendar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function MeetingCard({ meeting, live }: { meeting: Meeting; live: boolean }) {
  const start = meetingStart(meeting);
  const names = attendeeNames(meeting);
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{meeting.platform}</Badge>
        {live && (
          <Badge className="border-success/30 bg-success/15 text-success" variant="outline">
            Live now
          </Badge>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {start.toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
      <h2 className="mt-2 text-base font-semibold">{meeting.title}</h2>
      {meeting.agenda && <p className="mt-1 text-sm text-muted-foreground">{meeting.agenda}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" /> {meeting.durationMinutes} min
        </span>
        <span className="flex items-center gap-1">
          <Users className="size-3.5" /> {names.length} invited
        </span>
        <span>Host: {meeting.host}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <a href={meeting.link} target="_blank" rel="noreferrer">
            <Video className="mr-1.5 size-4" /> Join meeting
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            downloadIcs(meeting);
            toast.success("Added to your calendar");
          }}
        >
          <CalendarPlus className="mr-1.5 size-4" /> Add to calendar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            void navigator.clipboard.writeText(meeting.link);
            toast.success("Meeting link copied");
          }}
        >
          <ExternalLink className="mr-1.5 size-4" /> Copy link
        </Button>
      </div>
    </article>
  );
}

function Page() {
  const { employee } = useEmployeeSession();
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    setMeetings(loadMeetings());
  }, []);

  const mine = useMemo(
    () =>
      meetings
        .filter((m) => m.allEmployees || m.attendees.includes(employee.id))
        .sort((a, b) => meetingStart(a).getTime() - meetingStart(b).getTime()),
    [meetings, employee.id],
  );

  const now = Date.now();
  const upcoming = mine.filter((m) => meetingEnd(m).getTime() >= now);
  const past = mine.filter((m) => meetingEnd(m).getTime() < now).reverse();
  const todayCount = upcoming.filter(
    (m) => meetingStart(m).toDateString() === new Date().toDateString(),
  ).length;

  return (
    <EmployeeShell>
      <PageHeader title="My Meetings" description="Meetings you have been invited to." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Video} label="Upcoming" value={upcoming.length} caption="Invitations ahead" highlight />
        <StatCard icon={Clock} label="Today" value={todayCount} caption="Scheduled for today" />
        <StatCard icon={Users} label="Attended" value={past.length} caption="Past meetings" />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Upcoming
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {upcoming.map((m) => (
          <MeetingCard
            key={m.id}
            meeting={m}
            live={meetingStart(m).getTime() <= now && meetingEnd(m).getTime() >= now}
          />
        ))}
        {upcoming.length === 0 && (
          <p className="text-sm text-muted-foreground">No upcoming meetings right now.</p>
        )}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Past meetings
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {past.slice(0, 6).map((m) => (
              <MeetingCard key={m.id} meeting={m} live={false} />
            ))}
          </div>
        </>
      )}
    </EmployeeShell>
  );
}
