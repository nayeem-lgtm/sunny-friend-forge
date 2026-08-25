import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarPlus,
  CalendarCheck2,
  Copy,
  Link2,
  Trash2,
  Users,
  Video,
  Clock,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { employees } from "@/lib/employee-data";
import {
  attendeeNames,
  downloadIcs,
  loadMeetings,
  makeMeetingLink,
  meetingPlatforms,
  meetingStart,
  saveMeetings,
  type Meeting,
} from "@/lib/meeting-data";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meetings — OmniWork" },
      {
        name: "description",
        content: "Schedule team meetings, auto-send join links to employees and sync with their calendars.",
      },
      { property: "og:title", content: "Meetings — OmniWork" },
      {
        property: "og:description",
        content: "Schedule team meetings, auto-send join links to employees and sync with their calendars.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const emptyDraft = () => ({
  title: "",
  agenda: "",
  date: todayStr(),
  time: "10:00",
  durationMinutes: 30,
  platform: "Omni Meet" as Meeting["platform"],
  allEmployees: true,
  attendees: [] as string[],
  autoInvite: true,
  calendarSync: true,
});

function Page() {
  const [meetings, setMeetings] = useState<Meeting[]>(() => loadMeetings());
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [search, setSearch] = useState("");

  const persist = (next: Meeting[]) => {
    setMeetings(next);
    saveMeetings(next);
  };

  const now = Date.now();
  const sorted = useMemo(
    () =>
      [...meetings]
        .filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => meetingStart(a).getTime() - meetingStart(b).getTime()),
    [meetings, search],
  );
  const upcoming = sorted.filter((m) => meetingStart(m).getTime() >= now - 30 * 60_000);
  const past = sorted.filter((m) => meetingStart(m).getTime() < now - 30 * 60_000).reverse();

  const createMeeting = () => {
    if (!draft.title.trim()) {
      toast.error("Give the meeting a title");
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
      host: "Nayeem Ahmad",
      attendees: draft.allEmployees ? [] : draft.attendees,
      allEmployees: draft.allEmployees,
      invitesSent: draft.autoInvite,
      calendarSynced: draft.calendarSync,
      createdAt: new Date().toISOString(),
    };
    persist([meeting, ...meetings]);
    setOpen(false);
    setDraft(emptyDraft());
    const count = meeting.allEmployees ? employees.length : meeting.attendees.length;
    toast.success("Meeting created", {
      description: `${draft.autoInvite ? `Join link sent to ${count} employee${count === 1 ? "" : "s"}. ` : ""}${
        draft.calendarSync ? "Synced to their calendars." : ""
      }`,
    });
  };

  const remove = (id: string) => {
    persist(meetings.filter((m) => m.id !== id));
    toast.success("Meeting cancelled", { description: "Attendees were notified." });
  };

  const copy = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Join link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const resend = (m: Meeting) => {
    persist(meetings.map((x) => (x.id === m.id ? { ...x, invitesSent: true, calendarSynced: true } : x)));
    const count = m.allEmployees ? employees.length : m.attendees.length;
    toast.success(`Invite re-sent to ${count} employee${count === 1 ? "" : "s"}`);
  };

  const totalInvited = meetings.reduce(
    (acc, m) => acc + (m.allEmployees ? employees.length : m.attendees.length),
    0,
  );

  return (
    <AppShell>
      <PageHeader
        title="Meetings"
        description="Create meetings, auto-send join links to employees and sync them to everyone's calendar."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <CalendarPlus className="mr-2 h-4 w-4" /> New meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create meeting</DialogTitle>
                <DialogDescription>
                  A join link is generated automatically and delivered to every invited employee.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="m-title">Title</Label>
                  <Input
                    id="m-title"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Weekly all-hands"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="m-agenda">Agenda</Label>
                  <Textarea
                    id="m-agenda"
                    rows={3}
                    value={draft.agenda}
                    onChange={(e) => setDraft({ ...draft, agenda: e.target.value })}
                    placeholder="What will be covered..."
                  />
                </div>
                <div>
                  <Label htmlFor="m-date">Date</Label>
                  <Input
                    id="m-date"
                    type="date"
                    value={draft.date}
                    onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="m-time">Time</Label>
                  <Input
                    id="m-time"
                    type="time"
                    value={draft.time}
                    onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="m-dur">Duration (minutes)</Label>
                  <Input
                    id="m-dur"
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

                <div className="md:col-span-2 space-y-3 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Invite all employees</p>
                      <p className="text-xs text-muted-foreground">{employees.length} people in the directory</p>
                    </div>
                    <Switch
                      checked={draft.allEmployees}
                      onCheckedChange={(v) => setDraft({ ...draft, allEmployees: v })}
                    />
                  </div>
                  {!draft.allEmployees && (
                    <ScrollArea className="h-40 rounded-md border border-border p-2">
                      <div className="space-y-2">
                        {employees.map((e) => {
                          const checked = draft.attendees.includes(e.id);
                          return (
                            <label key={e.id} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) =>
                                  setDraft({
                                    ...draft,
                                    attendees: v
                                      ? [...draft.attendees, e.id]
                                      : draft.attendees.filter((id) => id !== e.id),
                                  })
                                }
                              />
                              <span>
                                {e.firstName} {e.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground">{e.department}</span>
                            </label>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Send join link automatically</p>
                    <Switch
                      checked={draft.autoInvite}
                      onCheckedChange={(v) => setDraft({ ...draft, autoInvite: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Sync to employee calendars</p>
                    <Switch
                      checked={draft.calendarSync}
                      onCheckedChange={(v) => setDraft({ ...draft, calendarSync: v })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createMeeting}>Create & send invites</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Upcoming meetings" value={String(upcoming.length)} icon={CalendarCheck2} />
        <StatCard title="Total meetings" value={String(meetings.length)} icon={Video} />
        <StatCard title="Invites delivered" value={String(totalInvited)} icon={Send} />
        <StatCard
          title="Calendar synced"
          value={String(meetings.filter((m) => m.calendarSynced).length)}
          icon={CalendarPlus}
        />
      </div>

      <div className="mb-4 max-w-sm">
        <Input placeholder="Search meetings..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcoming.length === 0 && <EmptyState />}
          {upcoming.map((m) => (
            <MeetingCard key={m.id} meeting={m} onCopy={copy} onRemove={remove} onResend={resend} />
          ))}
        </TabsContent>
        <TabsContent value="past" className="mt-4 space-y-3">
          {past.length === 0 && <EmptyState label="No past meetings yet." />}
          {past.map((m) => (
            <MeetingCard key={m.id} meeting={m} past onCopy={copy} onRemove={remove} onResend={resend} />
          ))}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function EmptyState({ label = "No meetings scheduled. Create one to get started." }: { label?: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function MeetingCard({
  meeting,
  past,
  onCopy,
  onRemove,
  onResend,
}: {
  meeting: Meeting;
  past?: boolean;
  onCopy: (link: string) => void;
  onRemove: (id: string) => void;
  onResend: (m: Meeting) => void;
}) {
  const names = attendeeNames(meeting);
  const start = meetingStart(meeting);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{meeting.title}</h3>
            <Badge variant="secondary">{meeting.platform}</Badge>
            {meeting.invitesSent && <Badge variant="outline">Invites sent</Badge>}
            {meeting.calendarSynced && <Badge variant="outline">Calendar synced</Badge>}
          </div>
          {meeting.agenda && <p className="mt-1 text-sm text-muted-foreground">{meeting.agenda}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {start.toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
              · {meeting.durationMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {meeting.allEmployees ? "All employees" : `${names.length} attendees`}
            </span>
            <span className="flex items-center gap-1 truncate">
              <Link2 className="h-3.5 w-3.5" />
              <span className="truncate">{meeting.link}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!past && (
            <Button size="sm" asChild>
              <a href={meeting.link} target="_blank" rel="noreferrer">
                <Video className="mr-2 h-4 w-4" /> Join
              </a>
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onCopy(meeting.link)}>
            <Copy className="mr-2 h-4 w-4" /> Copy link
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadIcs(meeting)}>
            <CalendarPlus className="mr-2 h-4 w-4" /> Add to calendar
          </Button>
          {!past && (
            <Button size="sm" variant="ghost" onClick={() => onResend(meeting)}>
              <Send className="mr-2 h-4 w-4" /> Resend invite
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onRemove(meeting.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
