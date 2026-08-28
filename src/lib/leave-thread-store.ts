import { useCallback, useEffect, useState } from "react";

export type LeaveCommentRole = "employee" | "admin";

export type LeaveComment = {
  id: string;
  requestId: string;
  author: string;
  role: LeaveCommentRole;
  text: string;
  at: string; // ISO
};

export type LeaveOverride = {
  status?: "Approved" | "Denied" | "Pending" | "Cancelled" | "Withdrawn";
  withdrawReason?: string;
  withdrawnAt?: string;
  updatedAt: string;
};

const COMMENTS_KEY = "omniwork.leave.comments.v1";
const OVERRIDES_KEY = "omniwork.leave.overrides.v1";
const EVENT = "omniwork:leave-thread";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore */
  }
}

export const loadLeaveComments = () => read<LeaveComment[]>(COMMENTS_KEY, []);
export const loadLeaveOverrides = () => read<Record<string, LeaveOverride>>(OVERRIDES_KEY, {});

export function addLeaveComment(input: Omit<LeaveComment, "id" | "at">) {
  const comment: LeaveComment = {
    ...input,
    id: `lc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
  };
  write(COMMENTS_KEY, [...loadLeaveComments(), comment]);
  return comment;
}

export function setLeaveOverride(requestId: string, patch: Partial<LeaveOverride>) {
  const all = loadLeaveOverrides();
  all[requestId] = { ...(all[requestId] ?? {}), ...patch, updatedAt: new Date().toISOString() };
  write(OVERRIDES_KEY, all);
}

/** Subscribe to changes made in this tab or any other tab (near real-time sync). */
export function subscribeLeaveThread(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key === COMMENTS_KEY || e.key === OVERRIDES_KEY) cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  const poll = window.setInterval(cb, 3000);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
    window.clearInterval(poll);
  };
}

export function useLeaveThread() {
  const [comments, setComments] = useState<LeaveComment[]>([]);
  const [overrides, setOverrides] = useState<Record<string, LeaveOverride>>({});

  const refresh = useCallback(() => {
    setComments(loadLeaveComments());
    setOverrides(loadLeaveOverrides());
  }, []);

  useEffect(() => {
    refresh();
    return subscribeLeaveThread(refresh);
  }, [refresh]);

  const commentsFor = useCallback(
    (requestId: string) =>
      comments.filter((c) => c.requestId === requestId).sort((a, b) => a.at.localeCompare(b.at)),
    [comments],
  );

  const post = useCallback(
    (input: Omit<LeaveComment, "id" | "at">) => {
      addLeaveComment(input);
      refresh();
    },
    [refresh],
  );

  const override = useCallback(
    (requestId: string, patch: Partial<LeaveOverride>) => {
      setLeaveOverride(requestId, patch);
      refresh();
    },
    [refresh],
  );

  return { comments, overrides, commentsFor, post, override, refresh };
}

export function formatCommentTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
