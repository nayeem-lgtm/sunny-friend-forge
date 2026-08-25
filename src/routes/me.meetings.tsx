import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Clock, ExternalLink, Search, Send, Users, Video } from "lucide-react";
import { toast } from "sonner";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { activeEmployees, fullName, useEmployeeSession } from "@/lib/employee-session";
import {
  attendeeNames,
  downloadIcs,
  loadMeetings,
  makeMeetingLink,
  meetingEnd,
  meetingPlatforms,
  meetingStart,
  saveMeetings,
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
        {meeting.status === "Requested" && (
          <Badge className="border-warning/30 bg-warning/15 text-warning" variant="outline">
            Requested by you
          </Badge>
        )}
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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const emptyRequest = () => ({
  title: "",
  agenda: "",
  date: todayStr(),
  time: "10:00",
  durationMinutes: 30,
  platform: "Omni Meet" as Meeting["platform"],
  attendees: [] as string[],
});

function Page() {
  const { employee } = useEmployeeSession();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyRequest);
  const [peopleSearch, setPeopleSearch] = useState("");

  useEffect(() => {
    setMeetings(loadMeetings());
  }, []);

  const colleagues = useMemo(
    () =>
      activeEmployees
        .filter((e) => e.id !== employee.id)
        .filter((e) =>
          `${fullName(e)} ${e.department}`.toLowerCase().includes(peopleSearch.toLowerCase()),
        ),
    [employee.id, peopleSearch],
  );

  const submitRequest = () => {
    if (!draft.title.trim()) {
      toast.error("Give the meeting a title");
      return;
    }
    if (draft.attendees.length === 0) {
      toast.error("Select at least one person to meet with");
      return;
    }
    const meeting: Meeting = {
      id: `mtg-${Date.now()}`,
      title: draft.title.trim(),
      agenda: draft.agenda.trim(),
      date: draft.date,
      time: draft.time,
      durationMinutes: Number(draft.durationMinutes) || 30,
      platform: draft.platform,
      link: makeMeetingLink(draft.platform),
      host: fullName(employee),
      attendees: [employee.id, ...draft.attendees],
      allEmployees: false,
      invitesSent: true,
      calendarSynced: true,
      createdAt: new Date().toISOString(),
      requestedBy: employee.id,
      status: "Requested",
    };
    const next = [meeting, ...meetings];
    setMeetings(next);
    saveMeetings(next);
    setOpen(false);
    setDraft(emptyRequest());
    setPeopleSearch("");
    toast.success("Meeting request sent", {
      description: `Invite and join link shared with ${draft.attendees.length} teammate${
        draft.attendees.length === 1 ? "" : "s"
      }.`,
    });
  };

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
      <PageHeader
        title="My Meetings"
        description="Meetings scheduled for you, plus requests you start with colleagues."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="mr-2 size-4" /> Request a meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Request a meeting</DialogTitle>
                <DialogDescription>
                  Pick colleagues from the OmniWork directory — a join link is generated and shared
                  with everyone you invite.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="r-title">Title</Label>
                  <Input
                    id="r-title"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Campaign sync with Media team"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="r-agenda">Agenda</Label>
                  <Textarea
                    id="r-agenda"
                    rows={3}
                    value={draft.agenda}
                    onChange={(e) => setDraft({ ...draft, agenda: e.target.value })}
                    placeholder="What do you want to discuss?"
                  />
                </div>
                <div>
                  <Label htmlFor="r-date">Date</Label>
                  <Input
                    id="r-date"
                    type="date"
                    value={draft.date}
                    onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="r-time">Time</Label>
                  <Input
                    id="r-time"
                    type="time"
                    value={draft.time}
                    onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="r-dur">Duration (minutes)</Label>
                  <Input
                    id="r-dur"
                    type="number"
                    min={15}
                    step={15}
                    value={draft.durationMinutes}
                    onChange={(e) => setDraft({ ...draft, durationMinutes: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Platform</Label>
                  <Select
                    value={draft.platform}
                    onValueChange={(v) => setDraft({ ...draft, platform: v as Meeting["platform"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {meetingPlatforms.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      Invite people ({draft.attendees.length} selected)
                    </p>
                    <div className="relative w-48">
                      <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="h-8 pl-7"
                        placeholder="Search people..."
                        value={peopleSearch}
                        onChange={(e) => setPeopleSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-48 rounded-md border border-border p-2">
                    <div className="space-y-2">
                      {colleagues.map((e) => (
                        <label key={e.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={draft.attendees.includes(e.id)}
                            onCheckedChange={(v) =>
                              setDraft({
                                ...draft,
                                attendees: v
                                  ? [...draft.attendees, e.id]
                                  : draft.attendees.filter((id) => id !== e.id),
                              })
                            }
                          />
                          <span>{fullName(e)}</span>
                          <span className="text-xs text-muted-foreground">
                            {e.department} · {e.designation}
                          </span>
                        </label>
                      ))}
                      {colleagues.length === 0 && (
                        <p className="p-2 text-sm text-muted-foreground">No matching people.</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitRequest}>Send request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

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
