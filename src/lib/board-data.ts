import { departments, employees } from "@/lib/employee-data";

export type ItemStatus = string;
export type Priority = string;
export type BoardPrivacy = "Main" | "Private" | "Shareable";

export type Label = {
  id: string;
  name: string;
  /** tailwind classes for a solid pill */
  color: string;
  /** progress contribution 0-100, used when an item has no subitems */
  progress?: number;
};

export const labelPalette: { name: string; color: string }[] = [
  { name: "Green", color: "bg-success text-success-foreground" },
  { name: "Orange", color: "bg-warning text-warning-foreground" },
  { name: "Blue", color: "bg-info text-info-foreground" },
  { name: "Red", color: "bg-destructive text-destructive-foreground" },
  { name: "Mint", color: "bg-primary text-primary-foreground" },
  { name: "Purple", color: "bg-accent text-accent-foreground" },
  { name: "Grey", color: "bg-muted text-muted-foreground" },
];

export const defaultStatusLabels: Label[] = [
  { id: "st-1", name: "Not Started", color: "bg-muted text-muted-foreground", progress: 0 },
  { id: "st-2", name: "Working", color: "bg-warning text-warning-foreground", progress: 40 },
  { id: "st-3", name: "In Review", color: "bg-info text-info-foreground", progress: 75 },
  { id: "st-4", name: "Blocked", color: "bg-destructive text-destructive-foreground", progress: 25 },
  { id: "st-5", name: "Completed", color: "bg-success text-success-foreground", progress: 100 },
];

export const defaultPriorityLabels: Label[] = [
  { id: "pr-1", name: "Critical", color: "bg-destructive text-destructive-foreground" },
  { id: "pr-2", name: "High", color: "bg-warning text-warning-foreground" },
  { id: "pr-3", name: "Medium", color: "bg-info text-info-foreground" },
  { id: "pr-4", name: "Low", color: "bg-muted text-muted-foreground" },
];

export function labelColor(labels: Label[], name: string) {
  return labels.find((l) => l.name === name)?.color ?? "bg-muted text-muted-foreground";
}

export type UpdateFile = { id: string; name: string; size: number; type: string };

export type UpdateReply = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

export type ItemUpdate = {
  id: string;
  author: string;
  text: string;
  mentions: string[];
  files: UpdateFile[];
  likes: number;
  createdAt: string;
  replies: UpdateReply[];
};

export type ActivityEntry = {
  id: string;
  actor: string;
  action: string;
  from?: string;
  to?: string;
  at: string;
};

export type Subitem = {
  id: string;
  name: string;
  ownerIds: string[];
  status: ItemStatus;
  priority: Priority;
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
};

export type Item = {
  id: string;
  code: string;
  name: string;
  ownerIds: string[];
  status: ItemStatus;
  priority: Priority;
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  department: string;
  tags: string[];
  notes: string;
  subitems: Subitem[];
  updates: ItemUpdate[];
  activity: ActivityEntry[];
};


export type Group = {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
  items: Item[];
};

export type Board = {
  id: string;
  name: string;
  description: string;
  icon: string;
  privacy: BoardPrivacy;
  folderId: string | null;
  workspaceId: string;
  favorite: boolean;
  groups: Group[];
};

export type Folder = {
  id: string;
  name: string;
  workspaceId: string;
};

export type Workspace = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

export const groupColors = [
  "bg-primary",
  "bg-info",
  "bg-warning",
  "bg-success",
  "bg-destructive",
  "bg-accent",
];

export const workspaces: Workspace[] = [
  { id: "ws-exec", name: "Executive Management", icon: "◆", description: "Company-wide initiatives" },
  { id: "ws-mkt", name: "Marketing", icon: "◈", description: "Campaigns and brand" },
  { id: "ws-media", name: "Media Buying", icon: "◉", description: "Paid acquisition" },
  { id: "ws-aff", name: "Affiliate Management", icon: "◎", description: "Partners and publishers" },
  { id: "ws-dev", name: "Development", icon: "◇", description: "Product and engineering" },
  { id: "ws-ops", name: "Operations", icon: "○", description: "Internal operations" },
];

export const seedFolders: Folder[] = [
  { id: "fd-q1", name: "Q1 Projects", workspaceId: "ws-dev" },
  { id: "fd-q2", name: "Q2 Projects", workspaceId: "ws-dev" },
  { id: "fd-camp", name: "2026 Campaigns", workspaceId: "ws-mkt" },
  { id: "fd-internal", name: "Internal Projects", workspaceId: "ws-ops" },
];

const people = employees.slice(0, 14);

function pid(i: number) {
  return people[i % people.length]!.id;
}

let seq = 0;
function nextCode() {
  seq += 1;
  return `RAY-${String(100 + seq)}`;
}

function iso(daysFromToday: number) {
  const base = new Date(Date.UTC(2026, 7, 24));
  base.setUTCDate(base.getUTCDate() + daysFromToday);
  return base.toISOString().slice(0, 10);
}

function makeItem(
  name: string,
  opts: Partial<Item> & { owners?: number[]; offset?: number; span?: number },
): Item {
  const offset = opts.offset ?? 0;
  const span = opts.span ?? 5;
  return {
    id: `it-${nextCode.length}-${Math.random().toString(36).slice(2, 9)}`,
    code: nextCode(),
    name,
    ownerIds: (opts.owners ?? [0]).map(pid),
    status: opts.status ?? "Not Started",
    priority: opts.priority ?? "Medium",
    startDate: iso(offset),
    dueDate: iso(offset + span),
    estimatedHours: opts.estimatedHours ?? 12,
    actualHours: opts.actualHours ?? 0,
    department: opts.department ?? departments[0]!,
    tags: opts.tags ?? [],
    notes: opts.notes ?? "",
    subitems: opts.subitems ?? [],
  };
}

function makeSub(name: string, o: Partial<Subitem> & { owner?: number } = {}): Subitem {
  return {
    id: `sb-${Math.random().toString(36).slice(2, 9)}`,
    name,
    ownerIds: [pid(o.owner ?? 1)],
    status: o.status ?? "Not Started",
    priority: o.priority ?? "Medium",
    startDate: o.startDate ?? iso(0),
    dueDate: o.dueDate ?? iso(4),
    estimatedHours: o.estimatedHours ?? 4,
    actualHours: o.actualHours ?? 0,
  };
}

export function createSeedBoards(): Board[] {
  return [
    {
      id: "bd-roadmap",
      name: "Development Roadmap",
      description: "Product and platform delivery for the engineering team.",
      icon: "◇",
      privacy: "Main",
      folderId: "fd-q1",
      workspaceId: "ws-dev",
      favorite: true,
      groups: [
        {
          id: "gr-progress",
          name: "In Progress",
          color: "bg-warning",
          collapsed: false,
          items: [
            makeItem("Build ERP Work Board", {
              owners: [0, 1],
              status: "Working",
              priority: "Critical",
              offset: -6,
              span: 14,
              estimatedHours: 60,
              actualHours: 38,
              department: "IT Department",
              tags: ["ERP", "Internal"],
              subitems: [
                makeSub("Design database architecture", { status: "Completed", actualHours: 6, owner: 0 }),
                makeSub("Create board UI", { status: "Working", actualHours: 9, owner: 1 }),
                makeSub("Create column system", { status: "Working", owner: 2 }),
                makeSub("Implement drag and drop", { owner: 3 }),
                makeSub("Testing & bug fixing", { owner: 4 }),
              ],
            }),
            makeItem("Build Lead Distributor AI Dashboard", {
              owners: [2],
              status: "In Review",
              priority: "High",
              offset: -3,
              span: 9,
              estimatedHours: 40,
              actualHours: 31,
              department: "IT Department",
              tags: ["AI"],
              subitems: [
                makeSub("Model integration", { status: "Completed", owner: 2 }),
                makeSub("Dashboard charts", { status: "In Review", owner: 5 }),
              ],
            }),
            makeItem("Attendance module hardening", {
              owners: [3, 4],
              status: "Blocked",
              priority: "High",
              offset: -1,
              span: 7,
              estimatedHours: 24,
              actualHours: 12,
              department: "QA Department",
              tags: ["Urgent"],
            }),
          ],
        },
        {
          id: "gr-next",
          name: "Next Week",
          color: "bg-info",
          collapsed: false,
          items: [
            makeItem("Payroll export automation", {
              owners: [5],
              priority: "Medium",
              offset: 5,
              span: 8,
              estimatedHours: 18,
              department: "Accounting Department",
              tags: ["Automation"],
            }),
            makeItem("Website redesign — phase 2", {
              owners: [6, 7],
              priority: "Low",
              offset: 7,
              span: 20,
              estimatedHours: 80,
              department: "IT Department",
              tags: ["Website"],
            }),
          ],
        },
        {
          id: "gr-done",
          name: "Completed",
          color: "bg-success",
          collapsed: false,
          items: [
            makeItem("Worklog EOD submissions", {
              owners: [1],
              status: "Completed",
              priority: "Medium",
              offset: -18,
              span: 10,
              estimatedHours: 20,
              actualHours: 22,
              department: "IT Department",
            }),
          ],
        },
      ],
    },
    {
      id: "bd-affiliate",
      name: "Affiliate Team Tasks",
      description: "Publisher onboarding and partner performance.",
      icon: "◎",
      privacy: "Main",
      folderId: null,
      workspaceId: "ws-aff",
      favorite: false,
      groups: [
        {
          id: "gr-aff-week",
          name: "This Week",
          color: "bg-primary",
          collapsed: false,
          items: [
            makeItem("Onboard 20 new publishers", {
              owners: [8],
              status: "Working",
              priority: "High",
              offset: -2,
              span: 10,
              estimatedHours: 30,
              actualHours: 14,
              department: "Affiliate Department",
              tags: ["Client"],
              subitems: [
                makeSub("Outreach list", { status: "Completed", owner: 8 }),
                makeSub("Contract templates", { status: "Working", owner: 9 }),
              ],
            }),
            makeItem("Q3 partner payout review", {
              owners: [9],
              priority: "Medium",
              offset: 1,
              span: 6,
              department: "Accounting Department",
            }),
          ],
        },
        {
          id: "gr-aff-later",
          name: "Backlog",
          color: "bg-muted-foreground",
          collapsed: false,
          items: [
            makeItem("Publisher scorecard v2", {
              owners: [10],
              priority: "Low",
              offset: 12,
              span: 15,
              department: "Affiliate Department",
            }),
          ],
        },
      ],
    },
    {
      id: "bd-marketing",
      name: "Marketing Projects",
      description: "Campaign planning and creative delivery.",
      icon: "◈",
      privacy: "Private",
      folderId: "fd-camp",
      workspaceId: "ws-mkt",
      favorite: false,
      groups: [
        {
          id: "gr-mkt-p1",
          name: "Phase 1",
          color: "bg-accent",
          collapsed: false,
          items: [
            makeItem("Brand refresh guidelines", {
              owners: [11],
              status: "Working",
              priority: "Medium",
              offset: -4,
              span: 12,
              department: "Business Development Department",
              tags: ["Campaign"],
            }),
            makeItem("Q4 campaign brief", {
              owners: [12, 13],
              priority: "High",
              offset: 3,
              span: 9,
              department: "Business Development Department",
            }),
          ],
        },
      ],
    },
  ];
}

export function boardPeople() {
  return people;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function itemProgress(item: Item) {
  if (item.subitems.length > 0) {
    const done = item.subitems.filter((s) => s.status === "Completed").length;
    return Math.round((done / item.subitems.length) * 100);
  }
  const map: Record<ItemStatus, number> = {
    "Not Started": 0,
    Working: 40,
    "In Review": 75,
    Blocked: 25,
    Completed: 100,
  };
  return map[item.status];
}
