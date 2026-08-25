import { CheckCircle2, ExternalLink, FileText, FileWarning } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { consentDocument } from "@/lib/consent-data";
import type { UploadedFile } from "@/lib/onboarding-store";

export const POLICY_DOC_SLOT = "__policy__";

export function DocumentReviewStep({
  documents,
  files,
  reviewed,
  onToggle,
  disabled,
}: {
  documents: string[];
  files: UploadedFile[];
  reviewed: string[];
  onToggle?: (slot: string, checked: boolean) => void;
  disabled?: boolean;
}) {
  const rows = [
    {
      slot: POLICY_DOC_SLOT,
      label: consentDocument.title,
      hint: `${consentDocument.version} · provided by HR`,
      name: "ray-corporate-service-rules-2026.pdf",
      href: consentDocument.url,
      uploaded: true,
    },
    ...documents.map((slot) => {
      const file = files.find((f) => f.slot === slot);
      return {
        slot,
        label: slot,
        hint: file
          ? `${file.name} · ${(file.size / 1000).toFixed(0)} KB`
          : "Not uploaded — you can go back and add it",
        name: file?.name ?? "",
        href: file?.dataUrl,
        uploaded: Boolean(file),
      };
    }),
  ];

  const doneCount = rows.filter((r) => reviewed.includes(r.slot)).length;

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Review your documents</h2>
          <p className="text-sm text-muted-foreground">
            Open each file, confirm it is correct and readable, then mark it as reviewed.
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          {doneCount} / {rows.length} reviewed
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {rows.map((r) => {
          const isReviewed = reviewed.includes(r.slot);
          return (
            <div
              key={r.slot}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 transition-colors ${
                isReviewed ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/30"
              }`}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                    r.uploaded ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.uploaded ? <FileText className="size-4" /> : <FileWarning className="size-4" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.hint}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {r.href ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={r.href} target="_blank" rel="noreferrer" download={r.name || undefined}>
                      Open <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">No preview</span>
                )}
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    disabled={disabled}
                    checked={isReviewed}
                    onCheckedChange={(v) => onToggle?.(r.slot, Boolean(v))}
                  />
                  Reviewed
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <p
        className={`mt-4 flex items-center gap-2 text-xs ${
          doneCount === rows.length ? "text-success" : "text-muted-foreground"
        }`}
      >
        <CheckCircle2 className="size-3.5" />
        {doneCount === rows.length
          ? "All documents reviewed — you can continue to signing."
          : "Mark every document as reviewed to continue to signing."}
      </p>
    </section>
  );
}
