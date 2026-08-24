export type Announcement = {
  id: string;
  title: string;
  body: string;
  author: string;
  category: "Company" | "Policy" | "Event" | "Recognition";
  daysAgo: number;
  pinned?: boolean;
};

export const announcements: Announcement[] = [
  {
    id: "an-1",
    title: "Quarterly town hall — Thursday 4:00 PM",
    body: "Leadership will walk through Q3 targets, the new client wins and the updated bonus structure. Attendance is mandatory for all departments.",
    author: "Arlene Lane",
    category: "Company",
    daysAgo: 0,
    pinned: true,
  },
  {
    id: "an-2",
    title: "Updated EOD report policy",
    body: "EOD reports must be submitted before 21:00. Repeated misses will reflect in the monthly KPI score.",
    author: "HR Admin",
    category: "Policy",
    daysAgo: 1,
  },
  {
    id: "an-3",
    title: "Affiliate team hits record payout month",
    body: "Congratulations to the Affiliate Department for closing the highest partner payout volume so far this year.",
    author: "Marvin Hall",
    category: "Recognition",
    daysAgo: 3,
  },
  {
    id: "an-4",
    title: "Office maintenance this weekend",
    body: "Power will be down on Saturday from 9:00 to 14:00. Please take your devices home on Friday evening.",
    author: "Admin Desk",
    category: "Event",
    daysAgo: 5,
  },
];

export const announcementTone: Record<Announcement["category"], string> = {
  Company: "bg-primary/15 text-primary border-primary/30",
  Policy: "bg-info/15 text-info border-info/30",
  Event: "bg-warning/15 text-warning border-warning/30",
  Recognition: "bg-success/15 text-success border-success/30",
};

export function relativeDay(daysAgo: number) {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return `${daysAgo} days ago`;
}

export const shortDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};
