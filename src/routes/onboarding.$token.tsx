import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/StatusPill";
import { OnboardingFormFields } from "@/components/employees/OnboardingFormFields";
import { ConsentStep } from "@/components/employees/ConsentStep";
import { ConfirmSubmitStep } from "@/components/employees/ConfirmSubmitStep";
import { consentClauses, consentDocument } from "@/lib/consent-data";
import {
  defaultOnboardingConfig,
  findInvite,
  findSubmission,
  loadFormConfig,
  setInviteStatus,
  upsertSubmission,
  type ConsentRecord,
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

type Step = 0 | 1 | 2;

function Page() {
  const { token } = Route.useParams();
  const [invite, setInvite] = useState<OnboardingInvite | undefined>();
  const [existing, setExisting] = useState<OnboardingSubmission | undefined>();
  const [ready, setReady] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [config, setConfig] = useState<OnboardingFormConfig>(defaultOnboardingConfig);
  const [step, setStep] = useState<Step>(0);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [signedName, setSignedName] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | undefined>();

  useEffect(() => {
    const inv = findInvite(token);
    const sub = findSubmission(token);
    setConfig(loadFormConfig());
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

  const go = (next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToConsent = () => {
    const missing = config.groups
      .flatMap((g) => g.fields)
      .filter((f) => f.required && !values[f.key]?.trim());
    if (missing.length) {
      toast.error(`Please fill: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    go(1);
  };

  const goToConfirm = () => {
    const pending = consentClauses.filter((c) => !acknowledged.includes(c.id));
    if (pending.length) {
      toast.error("Please accept all consent statements before continuing.");
      return;
    }
    if (!signedName.trim()) {
      toast.error("Signing is required — type your full legal name to sign.");
      return;
    }
    go(2);
  };

  const submit = () => {
    const pending = consentClauses.filter((c) => !acknowledged.includes(c.id));
    if (pending.length) {
      toast.error("Please accept all consent statements before signing.");
      return;
    }
    if (!signedName.trim()) {
      toast.error("Please type your full legal name to sign.");
      return;
    }
    setSubmitting(true);
    const consent: ConsentRecord = {
      acknowledged,
      signedName: signedName.trim(),
      signedAt: new Date().toISOString(),
      signatureImage,
      documentTitle: consentDocument.title,
      documentVersion: consentDocument.version,
    };
    const submission: OnboardingSubmission = {
      token,
      submittedAt: new Date().toISOString(),
      status: "Pending",
      fields: values,
      files,
      consent,
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

      <Stepper step={step} />

      <div className="space-y-6">
        {step === 0 && (
          <>
            <OnboardingFormFields
              config={config}
              values={values}
              onChange={set}
              files={files}
              onFile={(slot, file) => void onFile(slot, file)}
              onRemoveFile={(slot) => setFiles((prev) => prev.filter((f) => f.slot !== slot))}
            />
            <div className="flex justify-end pb-12">
              <Button size="lg" onClick={goToConsent}>
                Continue to consent & signature <ArrowRight className="size-4" />
              </Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <ConsentStep
              fullName={`${values["firstName"] ?? ""} ${values["lastName"] ?? ""}`.trim()}
              acknowledged={acknowledged}
              onToggle={(id, checked) =>
                setAcknowledged((prev) =>
                  checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id),
                )
              }
              signedName={signedName}
              onSignedName={setSignedName}
              signatureImage={signatureImage}
              onSignatureImage={setSignatureImage}
            />
            <div className="flex flex-wrap justify-between gap-3 pb-12">
              <Button variant="outline" size="lg" onClick={() => go(0)}>
                <ArrowLeft className="size-4" /> Back to details
              </Button>
              <Button size="lg" onClick={goToConfirm}>
                Continue to confirm <ArrowRight className="size-4" />
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <ConfirmSubmitStep
              fullName={`${values["firstName"] ?? ""} ${values["lastName"] ?? ""}`.trim()}
              email={values["email"] ?? invite.email}
              documents={config.documents}
              files={files}
              acknowledged={acknowledged}
              signedName={signedName}
              signatureImage={signatureImage}
            />
            <div className="flex flex-wrap justify-between gap-3 pb-12">
              <Button variant="outline" size="lg" onClick={() => go(1)}>
                <ArrowLeft className="size-4" /> Back to signature
              </Button>
              <Button size="lg" onClick={submit} disabled={submitting || !signedName.trim()}>
                {submitting && <Loader2 className="size-4 animate-spin" />} Confirm & submit onboarding
              </Button>
            </div>
          </>
        )}
      </div>

    </Shell>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps = ["Your details", "Consent & signature", "Confirm & submit"];
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-xl border p-4 text-sm transition-colors ${
              active
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                active || done ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              {done ? <CheckCircle2 className="size-4" /> : i + 1}
            </span>
            {label}
          </div>
        );
      })}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">{children}</div>
    </div>
  );
}
