import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import {
  EMPLOYEE_HOME,
  isEmployeePath,
  isRoleFreePath,
  usePortalRole,
} from "@/lib/portal-role";

/**
 * Keeps the two portals apart: someone signed in as an employee can only reach
 * the `/me` employee portal, never the admin modules.
 */
export function PortalRoleGuard({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isEmployee, ready } = usePortalRole();

  const blocked = ready && isEmployee && !isEmployeePath(pathname) && !isRoleFreePath(pathname);

  useEffect(() => {
    if (blocked) navigate({ to: EMPLOYEE_HOME, replace: true });
  }, [blocked, navigate]);

  if (blocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
