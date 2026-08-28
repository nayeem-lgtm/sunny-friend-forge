import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneMap: Record<string, Tone> = {
  active: "success",
  present: "success",
  approved: "success",
  paid: "success",
  completed: "success",
  live: "success",
  done: "success",
  pending: "warning",
  late: "warning",
  "on break": "warning",
  idle: "warning",
  drafted: "warning",
  draft: "warning",
  planning: "warning",
  working: "warning",
  inactive: "neutral",
  offline: "neutral",
  unpaid: "neutral",
  submitted: "success",
  onboarding: "info",
  accepted: "success",
  expired: "neutral",
  "not submitted": "danger",
  rejected: "danger",
  denied: "danger",
  missing: "danger",
  absent: "danger",
  cancelled: "danger",
  withdrawn: "neutral",
  stuck: "danger",
  high: "danger",
  medium: "warning",
  low: "info",
};

const toneClasses: Record<Tone, string> = {
  success: "bg-success/15 text-success border-success/25",
  warning: "bg-warning/15 text-warning border-warning/25",
  danger: "bg-destructive/15 text-destructive border-destructive/25",
  info: "bg-info/15 text-info border-info/25",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function StatusPill({
  status,
  tone,
  className,
}: {
  status: string;
  tone?: Tone;
  className?: string;
}) {
  const resolved = tone ?? toneMap[status.toLowerCase()] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        toneClasses[resolved],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
