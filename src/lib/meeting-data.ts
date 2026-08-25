import { employees } from "./employee-data";

export type Meeting = {
  id: string;
  title: string;
  agenda: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  durationMinutes: number;
  platform: "Omni Meet" | "Google Meet" | "Zoom" | "Microsoft Teams";
  link: string;
  host: string;
  attendees: string[]; // employee ids
  allEmployees: boolean;
  invitesSent: boolean;
  calendarSynced: boolean;
  createdAt: string;
};

const KEY = "omniwork.meetings.v1";

export const meetingPlatforms: Meeting["platform"][] = [
  "Omni Meet",
  "Google Meet",
  "Zoom",
  "Microsoft Teams",
];

export function makeMeetingLink(platform: Meeting["platform"]) {
  const slug = () => Math.random().toString(36).slice(2, 6);
  const code = `${slug()}-${slug()}-${slug()}`;
  switch (platform) {
    case "Google Meet":
      return `https://meet.google.com/${code}`;
    case "Zoom":
      return `https://zoom.us/j/${Math.floor(Math.random() * 9_000_000_000 + 1_000_000_000)}`;
    case "Microsoft Teams":
      return `https://teams.microsoft.com/l/meetup-join/${code}`;
    default:
      return `https://meet.omniwork.app/${code}`;
  }
}

function iso(date: string, time: string) {
  return new Date(`${date}T${time || "09:00"}:00`);
}

export function meetingStart(m: Meeting) {
  return iso(m.date, m.time);
}

export function meetingEnd(m: Meeting) {
  return new Date(meetingStart(m).getTime() + m.durationMinutes * 60_000);
}

export function attendeeNames(m: Meeting) {
  if (m.allEmployees) return employees.map((e) => `${e.firstName} ${e.lastName}`);
  return m.attendees
    .map((id) => employees.find((e) => e.id === id))
    .filter(Boolean)
    .map((e) => `${e!.firstName} ${e!.lastName}`);
}

function fmtIcs(d: Date) {
  return `${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

export function meetingToIcs(m: Meeting) {
  const emails = (m.allEmployees ? employees : employees.filter((e) => m.attendees.includes(e.id)))
    .map((e) => `ATTENDEE;CN=${e.firstName} ${e.lastName};RSVP=TRUE:mailto:${e.email}`)
    .join("\r\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OmniWork//Meetings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${m.id}@omniwork`,
    `DTSTAMP:${fmtIcs(new Date())}`,
    `DTSTART:${fmtIcs(meetingStart(m))}`,
    `DTEND:${fmtIcs(meetingEnd(m))}`,
    `SUMMARY:${m.title}`,
    `DESCRIPTION:${(m.agenda || "").replace(/\n/g, "\\n")}\\n\\nJoin: ${m.link}`,
    `LOCATION:${m.link}`,
    `ORGANIZER;CN=${m.host}:mailto:hr@rayadvertising.com`,
    emails,
    "BEGIN:VALARM",
    "TRIGGER:-PT10M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadIcs(m: Meeting) {
  const blob = new Blob([meetingToIcs(m)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${m.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const seedMeetings: Meeting[] = [
  {
    id: "mtg-1",
    title: "Company All-Hands — August Review",
    agenda: "Monthly performance review, department highlights and Q4 roadmap.",
    date: dateOffset(1),
    time: "11:00",
    durationMinutes: 60,
    platform: "Omni Meet",
    link: "https://meet.omniwork.app/all-hands-ray",
    host: "Nayeem Ahmad",
    attendees: [],
    allEmployees: true,
    invitesSent: true,
    calendarSynced: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "mtg-2",
    title: "Affiliate Department Standup",
    agenda: "Weekly pipeline sync and blockers.",
    date: dateOffset(0),
    time: "16:30",
    durationMinutes: 30,
    platform: "Google Meet",
    link: "https://meet.google.com/aff-sync-ray",
    host: "Operations",
    attendees: employees.slice(0, 5).map((e) => e.id),
    allEmployees: false,
    invitesSent: true,
    calendarSynced: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "mtg-3",
    title: "QA & IT Release Checkpoint",
    agenda: "Regression status before the release window.",
    date: dateOffset(-2),
    time: "14:00",
    durationMinutes: 45,
    platform: "Zoom",
    link: "https://zoom.us/j/1029384756",
    host: "IT Department",
    attendees: employees.slice(3, 9).map((e) => e.id),
    allEmployees: false,
    invitesSent: true,
    calendarSynced: false,
    createdAt: new Date().toISOString(),
  },
];

export function loadMeetings(): Meeting[] {
  if (typeof window === "undefined") return seedMeetings;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seedMeetings;
    return JSON.parse(raw) as Meeting[];
  } catch {
    return seedMeetings;
  }
}

export function saveMeetings(list: Meeting[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
