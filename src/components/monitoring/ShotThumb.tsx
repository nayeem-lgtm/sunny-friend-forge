import { cn } from "@/lib/utils";

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic synthetic preview of a captured desktop screen. */
export function ShotThumb({ id, app, className }: { id: string; app: string; className?: string }) {
  const h = hash(id);
  const rows = 7 + (h % 5);
  const dark = h % 3 !== 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-border/60",
        dark ? "bg-[#101a19]" : "bg-[#eef2f1]",
        className,
      )}
    >
      {/* window chrome */}
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1",
          dark ? "bg-[#16211f]" : "bg-[#dde5e3]",
        )}
      >
        <span className="size-1.5 rounded-full bg-red-400/70" />
        <span className="size-1.5 rounded-full bg-yellow-400/70" />
        <span className="size-1.5 rounded-full bg-green-400/70" />
        <span
          className={cn(
            "ml-2 h-1.5 flex-1 rounded-full",
            dark ? "bg-white/10" : "bg-black/10",
          )}
        />
      </div>
      <div className="flex h-full gap-1.5 p-1.5">
        {/* sidebar */}
        <div className={cn("w-1/5 space-y-1 rounded-sm p-1", dark ? "bg-white/5" : "bg-black/5")}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn("h-1 rounded-full", dark ? "bg-primary/30" : "bg-black/15")}
              style={{ width: `${55 + ((h + i * 17) % 40)}%` }}
            />
          ))}
        </div>
        {/* content */}
        <div className="flex-1 space-y-1">
          <div
            className={cn(
              "h-4 rounded-sm",
              dark ? "bg-primary/20" : "bg-primary/25",
            )}
          />
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className={cn("h-1 rounded-full", dark ? "bg-white/12" : "bg-black/12")}
              style={{ width: `${40 + ((h + i * 29) % 58)}%` }}
            />
          ))}
        </div>
      </div>
      <span className="absolute bottom-1 right-1 rounded bg-background/70 px-1 text-[9px] text-muted-foreground">
        {app}
      </span>
    </div>
  );
}
