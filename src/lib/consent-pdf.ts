import { jsPDF } from "jspdf";

import { consentClauses, consentDocument } from "@/lib/consent-data";
import type { OnboardingSubmission } from "@/lib/onboarding-store";

/** Builds a signed consent PDF for a submitted onboarding form. */
export function buildConsentPdf(submission: OnboardingSubmission): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  const consent = submission.consent;
  const name =
    consent?.signedName ||
    `${submission.fields["firstName"] ?? ""} ${submission.fields["lastName"] ?? ""}`.trim() ||
    "Employee";
  const email = submission.fields["email"] ?? submission.fields["workEmail"] ?? "—";

  const line = (text: string, size = 10, style: "normal" | "bold" = "normal", gap = 6) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, width) as string[];
    for (const l of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(l, margin, y);
      y += size + 2;
    }
    y += gap;
  };

  line("Employee Consent & Acknowledgement", 16, "bold", 4);
  line(consentDocument.title, 11, "bold", 2);
  line(`${consentDocument.version} · ${consentDocument.scope}`, 9, "normal", 14);

  line("Employee details", 11, "bold", 4);
  line(`Name: ${name}`);
  line(`Email: ${email}`);
  line(`Submitted: ${new Date(submission.submittedAt).toLocaleString()}`, 10, "normal", 14);

  line("Declarations accepted", 11, "bold", 6);
  consentClauses.forEach((clause, i) => {
    const accepted = consent?.acknowledged.includes(clause.id);
    line(`${accepted ? "[x]" : "[ ]"} ${i + 1}. ${clause.label}`, 10, "normal", 4);
  });

  y += 10;
  line("Signature", 11, "bold", 6);
  line(`Signed by (typed legal name): ${consent?.signedName ?? "Not signed"}`);
  line(`Date signed: ${consent ? new Date(consent.signedAt).toLocaleString() : "—"}`, 10, "normal", 10);

  if (consent?.signatureImage) {
    if (y > doc.internal.pageSize.getHeight() - margin - 90) {
      doc.addPage();
      y = margin;
    }
    try {
      doc.addImage(consent.signatureImage, "PNG", margin, y, 200, 70);
      y += 80;
    } catch {
      /* ignore unsupported signature image */
    }
  }

  doc.setDrawColor(150);
  doc.line(margin, y, margin + 220, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "This document was generated electronically by OmniWork and constitutes a signed consent record.",
    margin,
    y,
  );

  return doc;
}

export function consentPdfFileName(submission: OnboardingSubmission) {
  const name =
    `${submission.fields["firstName"] ?? ""}-${submission.fields["lastName"] ?? ""}`.trim() || submission.token;
  return `signed-consent-${name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
}

export function openConsentPdf(submission: OnboardingSubmission) {
  const doc = buildConsentPdf(submission);
  const url = doc.output("bloburl");
  window.open(url as unknown as string, "_blank", "noopener");
}

export function downloadConsentPdf(submission: OnboardingSubmission) {
  buildConsentPdf(submission).save(consentPdfFileName(submission));
}
