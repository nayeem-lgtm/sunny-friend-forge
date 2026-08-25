// Verbatim text of the RAY Advertising Employee Consent Form
// (ERP Workforce Monitoring & Tracking System). Do not paraphrase.

export type PolicyBlock = { type: "p" | "li" | "h"; text: string };
export type PolicySection = { id: string; title: string; blocks: PolicyBlock[] };

export const policySections: PolicySection[] = [
  {
    id: "purpose",
    title: "1. Purpose of the ERP System",
    blocks: [
      {
        type: "p",
        text: "RAY Advertising has implemented an internal Enterprise Resource Planning (ERP) Monitoring & Tracking System for all employees, including both remote and on-site staff. This system is proprietary internal software used exclusively for workforce monitoring and performance management purposes. It serves no other function. The system is used for the following:",
      },
      { type: "li", text: "Tracking and recording employees' working hours, including session start and end times" },
      { type: "li", text: "Monitoring attendance and managing leave records" },
      { type: "li", text: "Performance evaluation and KPI (Key Performance Indicator) maintenance" },
      {
        type: "li",
        text: "Monitoring work-related activity to assess employee productivity and engagement during designated working hours",
      },
      {
        type: "li",
        text: "Determining whether remote and on-site employees are actively working during their scheduled hours",
      },
    ],
  },
  {
    id: "installation",
    title: "2. Mandatory Installation Requirement",
    blocks: [
      {
        type: "p",
        text: "All employees — whether working remotely or on-site — are required to install the ERP Monitoring & Tracking System on their designated work computer. The software must remain installed and operational at all times during employment. Failure to install or maintain the software may result in disciplinary action in accordance with company policy.",
      },
    ],
  },
  {
    id: "operation",
    title: "3. How the System Operates",
    blocks: [
      {
        type: "p",
        text: "The ERP system operates on an employee-initiated basis. The system activates only when the employee manually turns on the tracker, which signals the start of the work session. Once activated, the software begins capturing work-related data including, but not limited to:",
      },
      { type: "li", text: "Start and end time of the work session" },
      { type: "li", text: "Active working hours and idle time" },
      { type: "li", text: "Work activity logs and task performance indicators" },
      { type: "li", text: "Attendance and leave data" },
      {
        type: "p",
        text: "Employees are advised to turn off the tracker only when they have concluded their work session or when stepping away from work responsibilities entirely. The company strongly recommends that employees refrain from using their work computers for personal activities while the tracker is active.",
      },
    ],
  },
  {
    id: "responsibility",
    title: "4. Employee Responsibility & Personal Activity Disclaimer",
    blocks: [
      {
        type: "p",
        text: "Employees are fully and solely responsible for any personal activity conducted on their work devices during active tracking sessions. RAY Advertising bears no liability whatsoever for any personal information, activities, or data captured by the ERP system as a result of an employee engaging in personal use while the tracker is running.",
      },
      { type: "p", text: "By consenting to this agreement, the employee explicitly acknowledges and accepts that:" },
      {
        type: "li",
        text: "The company is not responsible for capturing personal data if the employee engages in personal activity while the tracker is active.",
      },
      {
        type: "li",
        text: "It is the employee's complete and sole responsibility to ensure personal use is not conducted during active tracking sessions.",
      },
      {
        type: "li",
        text: "RAY Advertising will not be held accountable for any privacy concerns arising from the employee's decision to use the device for personal purposes during working hours.",
      },
      { type: "li", text: "Any data captured will be used solely for the purposes outlined in Section 1 of this form." },
    ],
  },
  {
    id: "confidentiality",
    title: "5. Scope of Data Collection & Confidentiality",
    blocks: [
      {
        type: "p",
        text: "All data collected through the ERP system is treated as confidential company information and will be used solely for internal workforce management purposes. RAY Advertising will not share individual employee monitoring data with third parties unless required by applicable law or lawful authority. Access to monitoring data is restricted to authorized management and HR personnel only.",
      },
    ],
  },
  {
    id: "acknowledgment",
    title: "6. Acknowledgment & Consent",
    blocks: [{ type: "p", text: "By signing below, I, the undersigned employee, confirm that:" }],
  },
];

export const policyFooterNote =
  "This document is confidential and must be retained in the employee's administrative file. | RAY Advertising — Internal Administrative Document";
