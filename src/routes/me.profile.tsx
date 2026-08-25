import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import {
  Briefcase,
  CalendarDays,
  Camera,
  Copy,
  Landmark,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { readFileAsDataUrl, useMyAvatar } from "@/lib/my-avatar-store";
import { Badge } from "@/components/ui/badge";
import { fullName, useEmployeeSession } from "@/lib/employee-session";
import { formatBDT } from "@/lib/payroll-data";
import { formatDate } from "@/lib/leave-data";
import { initials } from "@/lib/board-data";

export const Route = createFileRoute("/me/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — OmniWork Employee Portal" },
      {
        name: "description",
        content: "Your OmniWork profile: employment details, contact information, leave allowance and banking details.",
      },
      { property: "og:title", content: "My Profile — OmniWork Employee Portal" },
      {
        property: "og:description",
        content: "Review your employment, contact and payroll information on OmniWork.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" /> {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Page() {
  const { employee } = useEmployeeSession();
  const name = fullName(employee);
  const { avatarUrl, save, remove } = useMyAvatar(employee.id);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG or PNG).");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image is too large — keep it under 3 MB.");
      return;
    }
    try {
      save(await readFileAsDataUrl(file));
      toast.success("Profile picture updated");
    } catch {
      toast.error("Could not read that image.");
    }
  };

  return (
    <EmployeeShell>
      <PageHeader title="My Profile" description="Your details as recorded by HR." />

      <div className="mb-6 flex flex-wrap items-center gap-5 rounded-xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6">
        <div className="relative">
          <Avatar className="size-20 ring-2 ring-background">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
            <AvatarFallback className="text-lg">{initials(name)}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title="Change profile picture"
            className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition hover:bg-muted"
          >
            <Camera className="size-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              void pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{name}</h2>
          <p className="text-sm text-muted-foreground">
            {employee.designation} · {employee.department}
          </p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(employee.email);
              toast.success("Email copied");
            }}
            className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <Mail className="size-3.5 shrink-0 text-primary" />
            <span className="truncate">{employee.email}</span>
            <Copy className="size-3 shrink-0" />
          </button>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Camera className="mr-1.5 size-3.5" /> {avatarUrl ? "Change photo" : "Upload photo"}
            </Button>
            {avatarUrl ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  remove();
                  toast.success("Profile picture removed");
                }}
              >
                <Trash2 className="mr-1.5 size-3.5" /> Remove
              </Button>
            ) : null}
          </div>
        </div>

        <div className="ml-auto flex flex-wrap gap-2">
          <Badge variant="outline">{employee.employeeId}</Badge>
          <Badge variant="outline">{employee.roleType}</Badge>
          <Badge
            variant="outline"
            className={
              employee.status === "Active"
                ? "border-success/30 bg-success/15 text-success"
                : "border-warning/30 bg-warning/15 text-warning"
            }
          >
            {employee.status}
          </Badge>
          {employee.onProbation && (
            <Badge variant="outline" className="border-warning/30 bg-warning/15 text-warning">
              On probation
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Employment" icon={Briefcase}>
          <Field label="Employee ID" value={employee.employeeId} />
          <Field label="Designation" value={employee.designation} />
          <Field label="Department" value={employee.department} />
          <Field label="Role type" value={employee.roleType} />
          <Field label="Joining date" value={formatDate(employee.joiningDate)} />
          <Field label="Schedule" value={employee.schedule} />
        </Section>

        <Section title="Contact" icon={Mail}>
          <Field label="Work email" value={employee.email} />
          <Field label="Phone" value={employee.phone} />
          <Field label="Date of birth" value={formatDate(employee.dateOfBirth)} />
          <Field label="Emergency contact" value={employee.emergencyContact} />
          <div className="sm:col-span-2">
            <Field label="Address" value={employee.address} />
          </div>
        </Section>

        <Section title="Leave allowance" icon={CalendarDays}>
          <Field label="Casual leave" value={`${employee.casualLeave} days`} />
          <Field label="Sick leave" value={`${employee.sickLeave} days`} />
          <Field label="Annual leave" value={`${employee.annualLeave} days`} />
          <Field
            label="Total allowance"
            value={`${employee.casualLeave + employee.sickLeave + employee.annualLeave} days`}
          />
        </Section>

        <Section title="Payroll & banking" icon={Landmark}>
          <Field label="Monthly salary" value={formatBDT(employee.monthlySalary)} />
          <Field label="Currency" value={employee.currency} />
          <Field label="Bank" value={employee.bankName} />
          <Field label="Branch" value={employee.branchName} />
          <Field label="Account holder" value={employee.accountHolderName} />
          <Field label="Account number" value={employee.accountNumber} />
          <Field label="Routing number" value={employee.routingNumber} />
          <Field label="SWIFT" value={employee.swiftCode} />
        </Section>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          These records are managed by HR. If something looks wrong — address, phone, banking or
          leave allowance — message HR in Omni Chat By Ray and they will update it for you.
        </p>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="size-3.5" /> {employee.bankDistrict || "Head office"} ·{" "}
        <Phone className="size-3.5" /> {employee.phone}
      </p>
    </EmployeeShell>
  );
}
