import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import omniMarkUrl from "@/assets/omniwork-mark.png.asset.json";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — OmniWork by Ray Advertising" },
      {
        name: "description",
        content:
          "Sign in to OmniWork, the in-house team management and workforce operations platform by Ray Advertising.",
      },
      { property: "og:title", content: "Sign in — OmniWork by Ray Advertising" },
      {
        property: "og:description",
        content: "Work Smarter. Manage Better. Perform Better.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" }) as { next?: string };
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");

  useEffect(() => {
    if (user && !authLoading) {
      const next = typeof search.next === "string" && search.next.startsWith("/") ? search.next : "/";
      navigate({ to: next, replace: true });
    }
  }, [user, authLoading, navigate, search.next]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Please enter your work email.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (resetError) throw resetError;
      toast.success("Check your email", {
        description: "We sent a password reset link to your inbox.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background">
      {/* Animated ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[60rem] w-[60rem] rounded-full bg-primary/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 h-[50rem] w-[50rem] rounded-full bg-chart-2/10 blur-[100px] animate-pulse-slower" />
        <div className="absolute left-1/3 top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full bg-sidebar-primary/10 blur-[90px]" />
      </div>

      {/* Decorative grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Left brand panel */}
      <div className="relative z-10 hidden w-1/2 flex-col justify-between p-10 lg:flex xl:p-16">
        <div className="flex items-center gap-3">
          <img src={omniMarkUrl.url} alt="OmniWork mark" className="size-10 object-contain" />
          <span className="text-2xl font-semibold tracking-tight text-foreground">OmniWork</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="max-w-xl text-5xl font-semibold leading-[1.1] tracking-tight text-foreground xl:text-6xl">
              Work Smarter. <br />
              <span className="text-primary">Manage Better.</span> <br />
              Perform Better.
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
              OmniWork is an in-house team management and workforce operations platform by{" "}
              <span className="font-medium text-foreground">Ray Advertising</span>, built to bring
              your entire organization together in one powerful workspace.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
            <span className="text-sm font-medium tracking-wide text-primary">
              One Team. One Platform. Total Visibility.
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/40 to-transparent" />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          OmniWork — A Product of Ray Advertising
        </p>
      </div>

      {/* Right login panel */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          {/* Mobile-only brand header */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <img src={omniMarkUrl.url} alt="OmniWork mark" className="size-9 object-contain" />
            <span className="text-xl font-semibold tracking-tight text-foreground">OmniWork</span>
          </div>

          <div className="mb-8 space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {mode === "signin"
                ? "Welcome back"
                : mode === "signup"
                ? "Create your account"
                : "Reset your password"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to access your workspace."
                : mode === "signup"
                ? "Sign up to join the OmniWork workspace."
                : "Enter your work email and we'll send you a reset link."}
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={mode === "forgot" ? handleForgotSubmit : handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Work email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@rayadvertising.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border-border/60 bg-background/50 pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl border-border/60 bg-background/50 pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "signin" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl bg-primary font-medium text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "signin"
                    ? "Signing in…"
                    : mode === "signup"
                    ? "Creating account…"
                    : "Sending link…"}
                </>
              ) : mode === "signin" ? (
                "Sign in"
              ) : mode === "signup" ? (
                "Create account"
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            className="h-11 w-full rounded-xl border-border/60 bg-background/50 font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <GoogleIcon />
            Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === "signin" ? "signup" : "signin"));
                setError(null);
              }}
              className="font-medium text-primary hover:underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>

          <p className="mt-6 text-center text-xs text-muted-foreground lg:hidden">
            OmniWork — A Product of Ray Advertising
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.05); }
        }
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.08); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animate-pulse-slower {
          animation: pulse-slower 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
