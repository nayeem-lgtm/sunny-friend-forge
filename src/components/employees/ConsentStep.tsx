import { CheckCircle2, Eraser, ExternalLink, FileText, PenLine, ScrollText } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { consentClauses, consentDocument, consentSections } from "@/lib/consent-data";

export function ConsentStep({
  fullName,
  acknowledged,
  onToggle,
  signedName,
  onSignedName,
  signatureImage,
  onSignatureImage,
  disabled,
}: {
  fullName: string;
  acknowledged: string[];
  onToggle?: (id: string, checked: boolean) => void;
  signedName: string;
  onSignedName?: (value: string) => void;
  signatureImage?: string;
  onSignatureImage?: (value: string | undefined) => void;
  disabled?: boolean;
}) {
  const [reviewed, setReviewed] = useState(false);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <ScrollText className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold">{consentDocument.title}</h2>
              <p className="text-xs text-muted-foreground">
                {consentDocument.version} · {consentDocument.scope}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={consentDocument.url} target="_blank" rel="noreferrer">
              <FileText className="size-4" /> Open full PDF
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>

        <ScrollArea
          className="mt-5 h-[380px] rounded-lg border border-border bg-secondary/30 p-5"
          onScrollCapture={(e) => {
            const el = e.target as HTMLElement;
            if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) setReviewed(true);
          }}
        >
          <div className="space-y-5 pr-3">
            {consentSections.map((s) => (
              <article key={s.id}>
                <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.summary}</p>
                <ul className="mt-2 space-y-1.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
            <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
              This is a structured summary for review. The complete and binding text is in the attached
              PDF of the Corporate Service Rules Manual 2026.
            </p>
          </div>
        </ScrollArea>

        <p
          className={`mt-3 flex items-center gap-2 text-xs ${
            reviewed ? "text-success" : "text-muted-foreground"
          }`}
        >
          <CheckCircle2 className="size-3.5" />
          {reviewed ? "You have reviewed the full policy summary." : "Scroll to the end to review the full policy."}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Consent & Declarations
        </h2>
        <div className="space-y-3">
          {consentClauses.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-sm transition-colors hover:border-primary/40"
            >
              <Checkbox
                className="mt-0.5"
                disabled={disabled}
                checked={acknowledged.includes(c.id)}
                onCheckedChange={(v) => onToggle?.(c.id, Boolean(v))}
              />
              <span className="text-muted-foreground">{c.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <PenLine className="size-4" /> Signature
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Type your full legal name<span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input
              disabled={disabled}
              placeholder={fullName || "Full name"}
              value={signedName}
              onChange={(e) => onSignedName?.(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Typing your name acts as your electronic signature.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input disabled value={new Date().toLocaleDateString()} />
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Draw your signature (optional)</Label>
          <SignaturePad
            disabled={disabled}
            value={signatureImage}
            onChange={(v) => onSignatureImage?.(v)}
          />
        </div>

        {signedName.trim() && (
          <p className="mt-4 rounded-lg border border-primary/25 bg-primary/10 p-3 text-xs text-muted-foreground">
            Signed by <span className="font-medium text-foreground">{signedName}</span> on{" "}
            {new Date().toLocaleString()} for {consentDocument.title} ({consentDocument.version}).
          </p>
        )}
      </section>
    </div>
  );
}

function SignaturePad({
  value,
  onChange,
  disabled,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#7ee7b8";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(undefined);
  };

  if (disabled) {
    return value ? (
      <img
        src={value}
        alt="Signature"
        className="h-32 w-full rounded-lg border border-border bg-secondary/30 object-contain"
      />
    ) : (
      <p className="text-sm text-muted-foreground">No drawn signature provided.</p>
    );
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={640}
        height={160}
        className="h-40 w-full touch-none rounded-lg border border-dashed border-border bg-secondary/30"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <Button type="button" variant="ghost" size="sm" onClick={clear}>
        <Eraser className="size-4" /> Clear signature
      </Button>
    </div>
  );
}
