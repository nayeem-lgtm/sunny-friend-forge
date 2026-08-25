import consentAsset from "@/assets/ray-erp-consent-form.docx.asset.json";

export const consentDocument = {
  title: "RAY Advertising — Employee Consent Form",
  version: "ERP Workforce Monitoring & Tracking System",
  scope: "Internal Administrative Document",
  url: consentAsset.url,
};


export type ConsentClause = { id: string; label: string };

export const consentClauses: ConsentClause[] = [
  { id: "read", label: "1. I have read, understood, and agree to the terms outlined in this consent form." },
  { id: "install", label: "2. I consent to the installation and operation of the ERP Monitoring & Tracking System on my designated work device." },
  { id: "tracking", label: "3. I understand that the system will track my working hours, attendance, leave, and work activity whenever the tracker is active." },
  { id: "liability", label: "4. I acknowledge that any personal activity I conduct while the tracker is running is entirely my own responsibility, and RAY Advertising bears no liability for any personal information captured as a result." },
  { id: "condition", label: "5. I understand that this consent is a condition of my employment and continued engagement with RAY Advertising." },
  { id: "comply", label: "6. I agree to comply with all related company policies and guidelines regarding use of the ERP system." },
];
