import { departments } from "@/lib/employee-data";

export type AnnouncementFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
};

export type AnnouncementCategory = "General" | "Policy" | "Event" | "Holiday" | "Urgent";

export const announcementCategories: AnnouncementCategory[] = [
  "General",
  "Policy",
  "Event",
  "Holiday",
  "Urgent",
];

export const categoryStyles: Record<AnnouncementCategory, string> = {
  General: "bg-muted text-muted-foreground",
  Policy: "bg-info text-info-foreground",
  Event: "bg-accent text-accent-foreground",
  Holiday: "bg-success text-success-foreground",
  Urgent: "bg-destructive text-destructive-foreground",
};

export type Announcement = {
  id: string;
  title: string;
  html: string;
  category: AnnouncementCategory;
  audience: string;
  pinned: boolean;
  author: string;
  createdAt: string;
  updatedAt?: string;
  files: AnnouncementFile[];
};

export const audiences = ["Everyone", ...departments];

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatBytes(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDateTime(iso);
}

const now = Date.now();
const iso = (hoursAgo: number) => new Date(now - hoursAgo * 3600 * 1000).toISOString();

export const initialAnnouncements: Announcement[] = [
  {
    id: "an-1",
    title: "Eid holiday schedule announced",
    html: "<p>The office will remain <strong>closed from September 4 to September 8</strong>. Support rotations continue as usual — check the roster shared by your team lead.</p><ul><li>Payroll runs one day earlier</li><li>Client escalations route to the on-call channel</li></ul>",
    category: "Holiday",
    audience: "Everyone",
    pinned: true,
    author: "Nayeem Ahmad",
    createdAt: iso(5),
    files: [{ id: "f-1", name: "holiday-roster.pdf", size: 284_311, type: "application/pdf" }],
  },
  {
    id: "an-2",
    title: "Updated attendance & EOD reporting policy",
    html: '<p>Starting this month, every EOD report must be submitted before <strong>11:59 PM</strong>. Read the full policy <a href="https://example.com/policy">here</a>.</p>',
    category: "Policy",
    audience: "Everyone",
    pinned: false,
    author: "People Ops",
    createdAt: iso(30),
    files: [],
  },
  {
    id: "an-3",
    title: "Q3 town hall — Thursday 5 PM",
    html: "<p>Join us for the quarterly town hall. We'll cover revenue, new client wins, and the roadmap for the affiliate team.</p>",
    category: "Event",
    audience: "Everyone",
    pinned: false,
    author: "Nayeem Ahmad",
    createdAt: iso(72),
    files: [{ id: "f-2", name: "townhall-deck.pptx", size: 1_842_002, type: "application/vnd.ms-powerpoint" }],
  },
  {
    id: "an-4",
    title: "New QA automation guidelines",
    html: "<p>The QA department has published new regression checklists. Please review before the next sprint.</p>",
    category: "General",
    audience: "QA Department",
    pinned: false,
    author: "QA Lead",
    createdAt: iso(120),
    files: [],
  },
];
