import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/StatusPill";
import { OnboardingFormFields } from "@/components/employees/OnboardingFormFields";
import {
  defaultOnboardingConfig,
  findInvite,
  findSubmission,
  loadFormConfig,
  setInviteStatus,
  upsertSubmission,
  type OnboardingFormConfig,
  type OnboardingInvite,
  type OnboardingSubmission,
  type UploadedFile,
} from "@/lib/onboarding-store";


export const Route = createFileRoute("/onboarding/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Complete Your Onboarding — OmniWork" },
      {
        name: "description",
        content: "Fill in your details and upload the required documents to finish onboarding.",
      },
      { property: "og:title", content: "Complete Your Onboarding — OmniWork" },
      {
        property: "og:description",
        content: "Fill in your details and upload the required documents to finish onboarding.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const MAX_INLINE = 1_500_000;

function Page() {
  const { token } = Route.useParams();
  const [invite, setInvite] = useState<OnboardingInvite | undefined>();
  const [existing, setExisting] = useState<OnboardingSubmission | undefined>();
  const [ready, setReady] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const inv = findInvite(token);
    const sub = findSubmission(token);
    setInvite(inv);
    setExisting(sub);
    setValues(
      sub?.fields ?? {
        firstName: inv?.firstName ?? "",
        lastName: inv?.lastName ?? "",
        email: inv?.email ?? "",
      },
    );
    setFiles(sub?.files ?? []);
    if (inv && !sub && inv.status === "Pending") setInviteStatus(token, "Opened");
    setReady(true);
  }, [token]);

  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const onFile = async (slot: string, file: File | undefined) => {
    if (!file) return;
    const entry: UploadedFile = { slot, name: file.name, size: file.size, type: file.type };
    if (file.size <= MAX_INLINE) {
      entry.dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
    }
    setFiles((prev) => [...prev.filter((f) => f.slot !== slot), entry]);
  };

  const submit = () => {
    const missing = onboardingFieldGroups
      .flatMap((g) => g.fields)
      .filter((f) => f.required && !values[f.key]?.trim());
    if (missing.length) {
      toast.error(`Please fill: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    setSubmitting(true);
    const submission: OnboardingSubmission = {
      token,
      submittedAt: new Date().toISOString(),
      status: "Pending",
      fields: values,
      files,
    };
    upsertSubmission(submission);
    setInviteStatus(token, "Submitted");
    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
    }, 500);
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invite) {
    return (
      <Shell>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold">This onboarding link is not valid</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The invite may have been revoked or the link is incorrect. Please contact your HR team.
          </p>
        </div>
      </Shell>
    );
  }

  if (done || (existing && existing.status !== "Rejected")) {
    const status = done ? "Pending" : existing!.status;
    return (
      <Shell>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-success" />
          <h1 className="mt-4 text-lg font-semibold">Onboarding submitted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thanks {values["firstName"] || invite.firstName}! Your details and documents were sent to the
            HR team for review.
          </p>
          <div className="mt-4 flex justify-center">
            <StatusPill status={status === "Approved" ? "Approved" : "Pending"} />
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-sm text-primary">
          <ShieldCheck className="size-4" /> Secure onboarding link
        </div>
        <h1 className="mt-2 text-2xl font-semibold">
          Welcome{invite.firstName ? `, ${invite.firstName}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You have been invited to join OmniWork as {invite.designation || "a team member"}
          {invite.department ? ` in ${invite.department}` : ""}. Complete the form below and upload your
          documents to finish onboarding.
        </p>
        {existing?.status === "Rejected" && existing.reviewNote && (
          <p className="mt-3 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
            Your previous submission needs changes: {existing.reviewNote}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {onboardingFieldGroups.map((group) => (
          <section key={group.title} className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {group.title}
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {group.fields.map((f) => (
                <div
                  key={f.key}
                  className={f.key.toLowerCase().includes("address") ? "space-y-1.5 md:col-span-2" : "space-y-1.5"}
                >
                  <Label className="text-xs text-muted-foreground">
                    {f.label}
                    {f.required && <span className="ml-0.5 text-destructive">*</span>}
                  </Label>
                  {f.key.toLowerCase().includes("address") ? (
                    <Textarea
                      rows={2}
                      value={values[f.key] ?? ""}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      type={f.type ?? "text"}
                      value={values[f.key] ?? ""}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Documents
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {documentSlots.map((slot) => {
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
                        onClick={() => setFiles((prev) => prev.filter((f) => f.slot !== slot))}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-secondary/40">
                      <span>Click to upload (PDF, DOC, DOCX, JPG, PNG)</span>
                      <span className="inline-flex items-center gap-1.5 text-foreground">
                        <FolderOpen className="size-4" /> Select File
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => void onFile(slot, e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex justify-end pb-12">
          <Button size="lg" onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />} Submit onboarding
          </Button>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">{children}</div>
    </div>
  );
}
