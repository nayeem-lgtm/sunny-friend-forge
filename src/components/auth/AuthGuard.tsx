import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/onboarding/$token"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isPublic = PUBLIC_PATHS.some((p) => location.pathname === p || location.pathname.startsWith("/onboarding/"));

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublic) {
      navigate({ to: "/login", search: { next: location.pathname }, replace: true });
    }

    if (user && location.pathname === "/login") {
      const search = location.search as { next?: string };
      const next = typeof search.next === "string" && search.next.startsWith("/") ? search.next : "/";
      navigate({ to: next, replace: true });
    }
  }, [user, loading, isPublic, location.pathname, location.search, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // On public routes, always render (login/callback/onboarding)
  if (isPublic) {
    return <>{children}</>;
  }

  // On protected routes, only render when authenticated
  return user ? <>{children}</> : null;
}
