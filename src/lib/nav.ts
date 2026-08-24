import {
  LayoutDashboard,
  Building2,
  Clock,
  CalendarCheck,
  Wallet,
  FolderKanban,
  Activity,
  CalendarDays,
  Megaphone,
  ShieldCheck,
  FileCheck2,
  Users2,
  BookOpen,
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
      { title: "Departments", url: "/departments" },
      { title: "Designations", url: "/designations" },
      { title: "Employee Directory", url: "/employees" },
      { title: "Schedules", url: "/schedules" },
    ],
  },
  {
    title: "Attendance",
    icon: Clock,
    children: [
      { title: "Attendance Logs", url: "/attendance" },
      { title: "Worklogs", url: "/worklogs" },
      { title: "KPI Reports", url: "/kpi-reports" },
    ],
  },
  { title: "Leave Management", icon: CalendarCheck, url: "/leave" },
  { title: "Payroll", icon: Wallet, url: "/payroll" },
  { title: "Projects", icon: FolderKanban, url: "/projects" },
  { title: "Monitoring", icon: Activity, url: "/monitoring" },
  {
    title: "Calendar",
    icon: CalendarDays,
    children: [
      { title: "Meetings", url: "/meetings" },
      { title: "Holidays", url: "/holidays" },
    ],
  },
  { title: "Announcements", icon: Megaphone, url: "/announcements" },
  { title: "Permissions", icon: ShieldCheck, url: "/permissions" },
  { title: "Compliance", icon: FileCheck2, external: "https://example.com/compliance" },
  { title: "HRMS", icon: Users2, external: "https://example.com/hrms" },
  { title: "Ray Wiki", icon: BookOpen, external: "https://example.com/wiki" },
];

export const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/departments": "Departments",
  "/designations": "Designations",
  "/employees": "Employee Directory",
  "/schedules": "Schedules",
  "/attendance": "Attendance Logs",
  "/worklogs": "Worklogs",
  "/kpi-reports": "KPI Reports",
  "/leave": "Leave Management",
  "/payroll": "Payroll",
  "/projects": "Projects",
  "/monitoring": "Monitoring",
  "/meetings": "Meetings",
  "/holidays": "Holidays",
  "/announcements": "Announcements",
  "/permissions": "Permissions",
};
