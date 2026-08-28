import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Clock,
  FileText,
  CalendarCheck,
  CalendarDays,
  FolderKanban,
  Activity,
  MessagesSquare,
  Video,
  Megaphone,
  Wallet,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { employees, type Employee } from "@/lib/employee-data";

const KEY = "omniwork.employee.session.v1";

export const activeEmployees: Employee[] = employees.filter((e) => e.status !== "Inactive");

export const defaultEmployee: Employee = activeEmployees[0]!;

export const fullName = (e: Employee) => `${e.firstName} ${e.lastName}`;

/** Date at local midnight — deterministic between SSR and hydration. */
export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useEmployeeSession() {
  const [employeeId, setEmployeeId] = useState<string>(defaultEmployee.id);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      if (stored && activeEmployees.some((e) => e.id === stored)) setEmployeeId(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const select = useCallback((id: string) => {
    setEmployeeId(id);
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const employee = activeEmployees.find((e) => e.id === employeeId) ?? defaultEmployee;
  return { employee, name: fullName(employee), select };
}

export type EmployeeNavItem = { title: string; url: string; icon: LucideIcon };

export const employeeNav: EmployeeNavItem[] = [
  { title: "My Dashboard", url: "/me", icon: LayoutDashboard },
  { title: "My Attendance", url: "/me/attendance", icon: Clock },
  { title: "My Worklogs", url: "/me/worklogs", icon: FileText },
  { title: "Leave", url: "/me/leave", icon: CalendarCheck },
  { title: "Holiday Calendar", url: "/me/holidays", icon: CalendarDays },
  { title: "Workboard", url: "/me/board", icon: FolderKanban },
  { title: "My KPI", url: "/me/kpi", icon: Activity },
  { title: "Omni Chat By Ray", url: "/me/chat", icon: MessagesSquare },
  { title: "Meetings", url: "/me/meetings", icon: Video },
  { title: "Announcements", url: "/me/announcements", icon: Megaphone },
  { title: "My Payslips", url: "/me/payslips", icon: Wallet },
  { title: "My Profile", url: "/me/profile", icon: UserRound },
];

export const employeePageTitles: Record<string, string> = Object.fromEntries(
  employeeNav.map((i) => [i.url, i.title]),
);
