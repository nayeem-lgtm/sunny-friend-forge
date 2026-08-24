export type EmployeeStatus = "Active" | "Inactive" | "Onboarding";
export type RoleType = "Employee" | "Manager" | "Admin" | "Intern";

export type Employee = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  joiningDate: string;
  department: string;
  designation: string;
  monthlySalary: number;
  hireDate: string;
  roleType: RoleType;
  onProbation: boolean;
  address: string;
  emergencyContact: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  routingNumber: string;
  swiftCode: string;
  branchName: string;
  bankDistrict: string;
  currency: string;
  casualLeave: number;
  sickLeave: number;
  annualLeave: number;
  schedule: string;
  status: EmployeeStatus;
  onboardingProgress: number;
};

export type InviteStatus = "Pending" | "Accepted" | "Expired";

export type Invite = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  roleType: RoleType;
  sentAt: string;
  status: InviteStatus;
};

export const departments = [
  "IT Department",
  "Affiliate Department",
  "Business Development Department",
  "QA Department",
  "Accounting Department",
];

export const designations = [
  "Software Engineer",
  "Senior Software Engineer",
  "Affiliate Manager",
  "Affiliate Executive",
  "Business Development Executive",
  "Business Development Manager",
  "QA Engineer",
  "Accountant",
];

/** Designations that belong to each department. */
export const departmentDesignations: Record<string, string[]> = {
  "IT Department": ["Software Engineer", "Senior Software Engineer"],
  "Affiliate Department": ["Affiliate Manager", "Affiliate Executive"],
  "Business Development Department": [
    "Business Development Executive",
    "Business Development Manager",
  ],
  "QA Department": ["QA Engineer"],
  "Accounting Department": ["Accountant"],
};

export const roleTypes: RoleType[] = ["Employee", "Manager", "Admin", "Intern"];

export const schedules = ["General (10:00 - 19:00)", "Morning (08:00 - 17:00)", "Night (22:00 - 07:00)"];

const names: [string, string][] = [
  ["Rahat", "Ahmed"],
  ["Nusrat", "Jahan"],
  ["Tanvir", "Hasan"],
  ["Sadia", "Rahman"],
  ["Imran", "Khan"],
  ["Farhana", "Akter"],
  ["Shakib", "Chowdhury"],
  ["Mehedi", "Islam"],
  ["Ayesha", "Siddika"],
  ["Rifat", "Kabir"],
  ["Sabbir", "Alam"],
  ["Tasnim", "Nahar"],
];

export const employees: Employee[] = names.map(([firstName, lastName], i) => {
  const status: EmployeeStatus = i % 7 === 3 ? "Onboarding" : i % 9 === 8 ? "Inactive" : "Active";
  return {
    id: `emp-${i + 1}`,
    employeeId: `EM-${String(i + 1).padStart(3, "0")}`,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@rayagency.com`,
    phone: `018${String(10000000 + i * 13571).slice(0, 8)}`,
    dateOfBirth: `199${i % 10}-0${(i % 9) + 1}-1${i % 9}`,
    joiningDate: `202${(i % 5) + 1}-0${(i % 9) + 1}-0${(i % 8) + 1}`,
    department: departments[i % departments.length]!,
    designation: (() => {
      const dept = departments[i % departments.length]!;
      const list = departmentDesignations[dept] ?? designations;
      return list[i % list.length]!;
    })(),
    monthlySalary: 45000 + (i % 6) * 10000,
    hireDate: `202${(i % 5) + 1}-0${(i % 9) + 1}-0${(i % 8) + 1}`,
    roleType: roleTypes[i % roleTypes.length]!,
    onProbation: i % 4 === 0,
    address: "48/5/B, Wast Hazipara, DIT Rd, Dhaka 1219",
    emergencyContact: "+8801871312505, +8801758921216",
    bankName: "The City Bank",
    accountNumber: `1502${String(100000000 + i * 7919)}`,
    accountHolderName: `${firstName} ${lastName}`,
    routingNumber: `2252${String(10000 + i * 37)}`,
    swiftCode: "CIBLBDDH",
    branchName: "Mouchak Branch",
    bankDistrict: "Dhaka",
    currency: "BDT",
    casualLeave: 10,
    sickLeave: 14,
    annualLeave: 12,
    schedule: schedules[i % schedules.length]!,
    status,
    onboardingProgress: status === "Onboarding" ? 40 + (i % 3) * 20 : 100,
  };
});

export const initialInvites: Invite[] = [
  {
    id: "inv-1",
    email: "arif.hossain@rayagency.com",
    firstName: "Arif",
    lastName: "Hossain",
    department: "Affiliate Department",
    designation: "Affiliate Executive",
    roleType: "Employee",
    sentAt: "2026-08-18",
    status: "Pending",
  },
  {
    id: "inv-2",
    email: "mim.chowdhury@rayagency.com",
    firstName: "Mim",
    lastName: "Chowdhury",
    department: "QA Department",
    designation: "QA Engineer",
    roleType: "Employee",
    sentAt: "2026-08-12",
    status: "Accepted",
  },
  {
    id: "inv-3",
    email: "zahid.karim@rayagency.com",
    firstName: "Zahid",
    lastName: "Karim",
    department: "IT Department",
    designation: "Senior Software Engineer",
    roleType: "Manager",
    sentAt: "2026-07-29",
    status: "Expired",
  },
];

export const documentSlots = [
  "Resume/CV",
  "ID Documents",
  "Employee Contract",
  "Tax Forms",
  "Benefits Enrollment",
  "Certifications & License",
  "Performance Reviews",
];
