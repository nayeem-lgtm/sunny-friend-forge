import { useCallback, useEffect, useState } from "react";

export type PortalRole = "admin" | "employee";

const KEY = "omniwork.portal.role.v1";
const EVENT = "omniwork:portal-role";

/** Routes any signed-in user may reach regardless of role. */
const PUBLIC_PREFIXES = ["/login", "/auth", "/onboarding"];

export const EMPLOYEE_HOME = "/me";

export function isEmployeePath(pathname: string) {
  return pathname === "/me" || pathname.startsWith("/me/");
}

export function isRoleFreePath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function readPortalRole(): PortalRole {
  try {
    return window.localStorage.getItem(KEY) === "employee" ? "employee" : "admin";
  } catch {
    return "admin";
  }
}

export function writePortalRole(role: PortalRole) {
  try {
    window.localStorage.setItem(KEY, role);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

/**
 * Which portal the signed-in person belongs to. Defaults to "admin" during SSR
 * and resolves from storage after hydration (`ready` flips to true).
 */
export function usePortalRole() {
  const [role, setRole] = useState<PortalRole>("admin");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setRole(readPortalRole());
    sync();
    setReady(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setPortalRole = useCallback((next: PortalRole) => {
    writePortalRole(next);
    setRole(next);
  }, []);

  return { role, ready, isEmployee: role === "employee", setPortalRole };
}
