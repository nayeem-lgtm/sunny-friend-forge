import { CheckCircle2, FileText, PenLine, ShieldAlert, ShieldCheck } from "lucide-react";

import { consentClauses, consentDocument } from "@/lib/consent-data";
import type { UploadedFile } from "@/lib/onboarding-store";

export function ConfirmSubmitStep({
  fullName,
  email,
  documents,
  files,
  reviewedCount,
  reviewedTotal,
  acknowledged,
  signedName,
  signatureImage,
}: {
  fullName: string;
  email: string;
  documents: string[];
  files: UploadedFile[];
  reviewedCount: number;
  reviewedTotal: number;
  acknowledged: string[];
  signedName: string;
  signatureImage?: string | undefined;
}) {
  const signed = Boolean(signedName.trim());
  const allConsents = consentClauses.every((c) => acknowledged.includes(c.id));

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Confirm & submit</h2>
        <p className="text-sm text-muted-foreground">
          Review the summary below. Your onboarding is only completed once it is signed.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Tile label="Applicant" value={fullName || "—"} hint={email} />
          <Tile
            label="Documents reviewed"
            value={`${reviewedCount} / ${reviewedTotal}`}
            hint={`${files.length} of ${documents.length} uploaded`}
          />
          <Tile
            label="Consents accepted"
            value={`${acknowledged.length} / ${consentClauses.length}`}
            hint={consentDocument.version}
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <FileText className="size-4" /> Consent summary
        </h3>
        <ul className="space-y-2">
          {consentClauses.map((c) => {
            const ok = acknowledged.includes(c.id);
            return (
              <li
                key={c.id}
                className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-sm"
              >
                {ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                ) : (
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                )}
                <span className={ok ? "text-muted-foreground" : "text-destructive"}>{c.label}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        className={`rounded-xl border p-6 ${
          signed && allConsents
            ? "border-primary/30 bg-primary/5"
            : "border-destructive/30 bg-destructive/5"
        }`}
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          {signed && allConsents ? (
            <ShieldCheck className="size-4 text-primary" />
          ) : (
            <ShieldAlert className="size-4 text-destructive" />
          )}
          Signature required to complete
        </h3>
        {signed ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Signed by <span className="font-medium text-foreground">{signedName}</span> for{" "}
              {consentDocument.title} ({consentDocument.version}) on {new Date().toLocaleDateString()}.
            </p>
            {signatureImage && (
              <img
                src={signatureImage}
                alt="Your signature"
                className="mt-3 h-24 rounded-lg border border-border bg-secondary/40 object-contain"
              />
            )}
            {!allConsents && (
              <p className="mt-3 text-sm text-destructive">
                Some consent statements are still unchecked — go back and accept all of them.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 flex items-center gap-2 text-sm text-destructive">
            <PenLine className="size-4" /> You must sign on the previous step before your onboarding can
            be submitted.
          </p>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
      {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
