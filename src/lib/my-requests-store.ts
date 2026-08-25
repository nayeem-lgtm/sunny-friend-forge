import type { LeaveRequest } from "@/lib/leave-data";

const LEAVE_KEY = "omniwork.my.leave.v1";
const LOG_KEY = "omniwork.my.worklogs.v1";

export type MyWorklog = {
  id: string;
  employeeId: string;
  date: string; // yyyy-MM-dd
  report: string;
  submittedAt: string; // ISO
};

function read<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, list: T[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export const loadMyLeave = () => read<LeaveRequest>(LEAVE_KEY);
export const saveMyLeave = (list: LeaveRequest[]) => write(LEAVE_KEY, list);

export const loadMyWorklogs = () => read<MyWorklog>(LOG_KEY);
export const saveMyWorklogs = (list: MyWorklog[]) => write(LOG_KEY, list);
