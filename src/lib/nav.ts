import {
  LayoutDashboard,
  Building2,
  Clock,
  CalendarCheck,
  Wallet,
  FolderKanban,
  Activity,
  Megaphone,
  Settings,
  Users2,
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
    title: "Organizations",
    icon: Building2,
    children: [
      { title: "Designations", url: "/designations" },
      { title: "Employee Directory", url: "/employees" },
    ],
  },
  {
    title: "Attendance",
    icon: Clock,
    children: [
      { title: "Attendance Logs", url: "/attendance" },
      { title: "Worklogs", url: "/worklogs" },
    ],
  },
  { title: "Leave Management", icon: CalendarCheck, url: "/leave" },
  { title: "Payroll", icon: Wallet, url: "/payroll" },
  { title: "Projects", icon: FolderKanban, url: "/projects" },
  { title: "Monitoring", icon: Activity, url: "/monitoring" },
  { title: "Announcements", icon: Megaphone, url: "/announcements" },
  { title: "Employee KPI", icon: Activity, url: "/kpi-reports" },
  {
    title: "Settings",
    icon: Settings,
    children: [
      { title: "Schedules", url: "/schedules" },
      { title: "Permissions", url: "/permissions" },
    ],
  },
  { title: "HRMS", icon: Users2, external: "https://example.com/hrms" },
];

export const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/designations": "Designations",
  "/employees": "Employee Directory",
  "/schedules": "Schedules",
  "/attendance": "Attendance Logs",
  "/worklogs": "Worklogs",
  "/kpi-reports": "Employee KPI",
  "/leave": "Leave Management",
  "/payroll": "Payroll",
  "/projects": "Projects",
  "/monitoring": "Monitoring",
  "/announcements": "Announcements",
  "/permissions": "Permissions",
};

