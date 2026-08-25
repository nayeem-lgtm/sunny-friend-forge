import { FileText, FolderOpen, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OnboardingFormConfig, UploadedFile } from "@/lib/onboarding-store";

export function OnboardingFormFields({
  config,
  values,
  onChange,
  files,
  onFile,
  onRemoveFile,
  disabled,
}: {
  config: OnboardingFormConfig;
  values: Record<string, string>;
  onChange?: (key: string, value: string) => void;
  files: UploadedFile[];
  onFile?: (slot: string, file: File | undefined) => void;
  onRemoveFile?: (slot: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-6">
      {config.groups.map((group) => (
        <section key={group.id} className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </h2>
          {group.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fields in this section.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {group.fields.map((f) => {
                const isLong = f.type === "textarea" || f.key.toLowerCase().includes("address");
                return (
                  <div key={f.key} className={isLong ? "space-y-1.5 md:col-span-2" : "space-y-1.5"}>
                    <Label className="text-xs text-muted-foreground">
                      {f.label}
                      {f.required && <span className="ml-0.5 text-destructive">*</span>}
                    </Label>
                    {isLong ? (
                      <Textarea
                        rows={2}
                        disabled={disabled}
                        value={values[f.key] ?? ""}
                        onChange={(e) => onChange?.(f.key, e.target.value)}
                      />
                    ) : (
                      <Input
                        type={f.type && f.type !== "textarea" ? f.type : "text"}
                        disabled={disabled}
                        value={values[f.key] ?? ""}
                        onChange={(e) => onChange?.(f.key, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}

      {config.documents.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Documents
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {config.documents.map((slot) => {
              const uploaded = files.find((f) => f.slot === slot);
              return (
                <div key={slot} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{slot}</Label>
                  {uploaded ? (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <FileText className="size-4 shrink-0 text-primary" />
                        <span className="truncate">{uploaded.name}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        onClick={() => onRemoveFile?.(slot)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground transition-colors ${
                        disabled
                          ? "cursor-default opacity-70"
                          : "cursor-pointer hover:border-primary/50 hover:bg-secondary/40"
                      }`}
                    >
                      <span>Click to upload (PDF, DOC, DOCX, JPG, PNG)</span>
                      <span className="inline-flex items-center gap-1.5 text-foreground">
                        <FolderOpen className="size-4" /> Select File
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        disabled={disabled}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => onFile?.(slot, e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
