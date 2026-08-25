import consentAsset from "@/assets/ray-erp-consent-form.docx.asset.json";

export const consentDocument = {
  title: "RAY Advertising — Employee Consent Form",
  version: "ERP Workforce Monitoring & Tracking System",
  scope: "Internal Administrative Document",
  url: consentAsset.url,
};


export type ConsentSection = {
  id: string;
  title: string;
  summary: string;
  points: string[];
};

export const consentSections: ConsentSection[] = [
  {
    id: "introductory",
    title: "1. Introductory Part",
    summary:
      "The Manual defines the HR policies, procedures and employment practices of Ray Advertising for its Bangladesh office, aligned with the Bangladesh Labour Act and applicable regulations.",
    points: [
      "Effective 01 May 2026 and binding on all employees of the Bangladesh office.",
      "HR at Head Office maintains and interprets the Manual; interpretations under the direction of the CEO are final.",
      "Interns, volunteers, consultants and third-party contractors are excluded, except for general provisions such as code of conduct, working hours, holidays and safety.",
      "The company may amend, replace or expand the Manual as business or legal requirements change.",
    ],
  },
  {
    id: "employment",
    title: "2. Employment",
    summary:
      "Covers the employment policy, categories of employment, probation, confirmation and the internal band structure.",
    points: [
      "Employment is governed by the appointment letter read together with this Manual.",
      "A probation period applies before confirmation, with performance assessed prior to confirmation.",
      "Roles are mapped to the company's 7-band structure.",
    ],
  },
  {
    id: "compensation",
    title: "3. Compensation, Benefits & Leave",
    summary:
      "Salary, allowances, benefits and the leave policy including annual, casual, sick and other statutory leave entitlements.",
    points: [
      "Salary is paid monthly, subject to applicable statutory deductions.",
      "Leave entitlements accrue as defined in the leave policy and require prior approval.",
      "Benefits are provided in line with company policy and local law.",
    ],
  },
  {
    id: "performance",
    title: "4-6. Increment, Promotion & Performance Management",
    summary:
      "Salary adjustments, increments and promotions are performance-linked and approved by management.",
    points: [
      "Performance is reviewed periodically against agreed objectives and KPIs.",
      "Increments, upgrades and promotions are at the discretion of management.",
      "Employees receive feedback and development guidance from their supervisor.",
    ],
  },
  {
    id: "discipline",
    title: "7. Discipline & Code of Conduct",
    summary:
      "General and remote-staff codes of conduct, disciplinary procedures and the legal references that govern them.",
    points: [
      "Employees must act professionally, honestly and respectfully at all times.",
      "Remote staff must follow the remote code of conduct, including availability and monitoring requirements.",
      "Misconduct is handled through the stated disciplinary process, including show-cause and inquiry steps.",
    ],
  },
  {
    id: "separation",
    title: "8-9. Recruitment, Separation & RRRR",
    summary:
      "Recruitment standards, resignation and termination, plus the policy on redundancy, redeployment, retrenchment and rehiring.",
    points: [
      "Separation requires one month's notice or payment in lieu of notice.",
      "Compensation on retrenchment is calculated on 'wages' as defined in the Manual.",
      "Company property and access must be returned and revoked on the last working day.",
    ],
  },
  {
    id: "conflict",
    title: "11-12. Learning & Development, Conflict of Interest",
    summary:
      "Training opportunities, and the duty to disclose direct and indirect conflicts of interest.",
    points: [
      "Employees must disclose any actual or potential conflict of interest.",
      "An annual disclosure is required from all employees.",
      "Outside engagements that compete with company interests are prohibited without approval.",
    ],
  },
  {
    id: "wellbeing",
    title: "13-16. Staff Care, Safety, Anti-Harassment & Gender Policy",
    summary:
      "Wellbeing programs, workplace safety and security, prohibition of harassment, and the gender equality policy.",
    points: [
      "The company maintains a safe, inclusive and harassment-free workplace.",
      "Prohibited behaviours and reporting channels are defined; complaints are investigated by the CHRO.",
      "Gender equality objectives apply across recruitment, development and daily operations.",
    ],
  },
];

export type ConsentClause = { id: string; label: string };

export const consentClauses: ConsentClause[] = [
  {
    id: "read",
    label:
      "I confirm I have read and understood the Ray Advertising Corporate Service Rules Manual 2026 in full.",
  },
  {
    id: "comply",
    label:
      "I agree to comply with all policies, the code of conduct, and the disciplinary procedures described in the Manual.",
  },
  {
    id: "confidentiality",
    label:
      "I agree to maintain confidentiality of company, client and employee information during and after my employment.",
  },
  {
    id: "monitoring",
    label:
      "I consent to workplace monitoring (including activity, application and screenshot capture) for remote and in-office work as described in the code of conduct.",
  },
  {
    id: "data",
    label:
      "I consent to Ray Advertising collecting, storing and processing the personal information and documents I have submitted for employment and payroll purposes.",
  },
  {
    id: "accurate",
    label:
      "I declare that all information and documents provided by me during onboarding are true, accurate and complete.",
  },
];
