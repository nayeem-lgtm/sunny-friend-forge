import {
  LayoutDashboard,
  Clock,
  CalendarCheck,
  Wallet,
  FolderKanban,
  Activity,
  Megaphone,
  Settings,
  Users2,
  MessagesSquare,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";


export type NavChild = { title: string; url: string };

export type NavItem = {
  title: string;
  icon: LucideIcon;
  url?: string;
  children?: NavChild[];
  external?: string;
};

export const navItems: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/" },
  {
    title: "Attendance",
    icon: Clock,
    children: [
      { title: "Attendance Logs", url: "/attendance" },
      { title: "Worklogs", url: "/worklogs" },
    ],
  },
  {
    title: "Meeting & Chat Room",
    icon: MessagesSquare,
    children: [
      { title: "Meetings", url: "/meetings" },
      { title: "Omni Chat By Ray", url: "/chat" },
    ],
  },
  { title: "Leave", icon: CalendarCheck, url: "/leave" },
  { title: "Holiday Calendar", icon: CalendarDays, url: "/holidays" },
  { title: "Payroll", icon: Wallet, url: "/payroll" },
  { title: "Workboard", icon: FolderKanban, url: "/projects" },
  { title: "Monitoring", icon: Activity, url: "/monitoring" },
  { title: "Announcements", icon: Megaphone, url: "/announcements" },
  { title: "Employee KPI", icon: Activity, url: "/kpi-reports" },
  {
    title: "Settings",
    icon: Settings,
    children: [
      { title: "Employee Directory", url: "/employees" },
      { title: "Departments", url: "/departments" },
      { title: "Schedules", url: "/schedules" },
      { title: "User Access", url: "/user-access" },
    ],
  },
  { title: "HRMS", icon: Users2, external: "https://example.com/hrms" },
];

export const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/departments": "Departments",
  "/employees": "Employee Directory",
  "/schedules": "Schedules",
  "/attendance": "Attendance Logs",
  "/worklogs": "Worklogs",
  "/kpi-reports": "Employee KPI",
  "/meetings": "Meetings",
  "/chat": "Omni Chat By Ray",
  "/leave": "Leave",
  "/holidays": "Holiday Calendar",
  "/payroll": "Payroll",
  "/projects": "Workboard",
  "/monitoring": "Monitoring",
  "/announcements": "Announcements",
  "/user-access": "User Access",
};

