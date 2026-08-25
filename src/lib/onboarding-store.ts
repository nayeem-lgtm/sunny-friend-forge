import type { RoleType } from "@/lib/employee-data";

export type UploadedFile = {
  slot: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
};

export type SubmissionStatus = "Pending" | "Approved" | "Rejected";

export type ConsentRecord = {
  /** ids of acknowledged consent clauses */
  acknowledged: string[];
  signedName: string;
  signedAt: string;
  /** data URL of the drawn signature, when provided */
  signatureImage?: string;
  documentTitle: string;
  documentVersion: string;
};

export type OnboardingSubmission = {
  token: string;
  submittedAt: string;
  status: SubmissionStatus;
  reviewNote?: string;
  fields: Record<string, string>;
  files: UploadedFile[];
  consent?: ConsentRecord;
};

export type OnboardingInvite = {
  id: string;
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  roleType: RoleType;
  sentAt: string;
  /** Pending | Opened | Submitted | Approved | Rejected | Expired */
  status: string;
};

const INVITES_KEY = "omniwork.onboarding.invites";
const SUBMISSIONS_KEY = "omniwork.onboarding.submissions";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — ignore */
  }
}

export const loadInvites = () => read<OnboardingInvite[]>(INVITES_KEY, []);
export const saveInvites = (invites: OnboardingInvite[]) => write(INVITES_KEY, invites);

export const loadSubmissions = () => read<OnboardingSubmission[]>(SUBMISSIONS_KEY, []);
export const saveSubmissions = (subs: OnboardingSubmission[]) => write(SUBMISSIONS_KEY, subs);

export function findInvite(token: string) {
  return loadInvites().find((i) => i.token === token);
}

export function findSubmission(token: string) {
  return loadSubmissions().find((s) => s.token === token);
}

export function upsertSubmission(submission: OnboardingSubmission) {
  const rest = loadSubmissions().filter((s) => s.token !== submission.token);
  saveSubmissions([submission, ...rest]);
}

export function setInviteStatus(token: string, status: string) {
  saveInvites(loadInvites().map((i) => (i.token === token ? { ...i, status } : i)));
}

export function makeToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export function onboardingLink(token: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/onboarding/${token}`;
}

export type OnboardingField = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
};

export type OnboardingGroup = {
  id: string;
  title: string;
  fields: OnboardingField[];
};

export type OnboardingFormConfig = {
  groups: OnboardingGroup[];
  documents: string[];
};

export const defaultOnboardingGroups: OnboardingGroup[] = [
  {
    id: "personal",
    title: "Personal Information",
    fields: [
      { key: "firstName", label: "First Name", required: true },
      { key: "lastName", label: "Last Name", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "phone", label: "Phone Number", required: true },
      { key: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
      { key: "nid", label: "NID / Passport No." },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    fields: [
      { key: "address", label: "Present Address", required: true },
      { key: "permanentAddress", label: "Permanent Address" },
      { key: "emergencyContact", label: "Emergency Contact", required: true },
      { key: "emergencyRelation", label: "Emergency Contact Relation" },
    ],
  },
  {
    id: "banking",
    title: "Banking",
    fields: [
      { key: "bankName", label: "Bank Name", required: true },
      { key: "accountNumber", label: "Account Number", required: true },
      { key: "accountHolderName", label: "Account Holder Name", required: true },
      { key: "routingNumber", label: "Routing Number" },
      { key: "branchName", label: "Branch Name" },
      { key: "bankDistrict", label: "Bank District" },
    ],
  },
];

export const defaultOnboardingDocuments = [
  "Resume/CV",
  "Gov Approved ID — National ID",
  "Gov Approved ID — Passport",
  "Gov Approved ID — Driving License",
  "Tax Forms",
  "Educational Certificates",
  "Release Letter of Previous Employment",
  "Recommendation Letter of Previous Employment",
];

export const defaultOnboardingConfig: OnboardingFormConfig = {
  groups: defaultOnboardingGroups,
  documents: defaultOnboardingDocuments,
};

const CONFIG_KEY = "omniwork.onboarding.formConfig";

export function loadFormConfig(): OnboardingFormConfig {
  const cfg = read<OnboardingFormConfig | null>(CONFIG_KEY, null);
  if (!cfg || !Array.isArray(cfg.groups) || !Array.isArray(cfg.documents)) {
    return defaultOnboardingConfig;
  }
  return cfg;
}

export const saveFormConfig = (config: OnboardingFormConfig) => write(CONFIG_KEY, config);

/** Legacy export kept for compatibility. */
export const onboardingFieldGroups = defaultOnboardingGroups;

