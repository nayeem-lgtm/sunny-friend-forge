import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileText,
  Mail,
  Plus,
  Send,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DocumentReviewStep } from "@/components/employees/DocumentReviewStep";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  departments,
  designations,
  employees,
  initialInvites,
  roleTypes,
  type Employee,
  type RoleType,
} from "@/lib/employee-data";
import {
  defaultOnboardingConfig,
  loadFormConfig,
  loadInvites,
  loadSubmissions,
  makeToken,
  onboardingLink,
  saveInvites,
  saveSubmissions,
  type OnboardingFormConfig,
  type OnboardingInvite,
  type OnboardingSubmission,
} from "@/lib/onboarding-store";
import { OnboardingFormBuilder } from "@/components/employees/OnboardingFormBuilder";


export const Route = createFileRoute("/employees")({
  head: () => ({
    meta: [
      { title: "Employee Directory — OmniWork" },
      {
        name: "description",
        content: "Invite employees, run self-serve onboarding, and approve submitted documents.",
      },
      { property: "og:title", content: "Employee Directory — OmniWork" },
      {
        property: "og:description",
        content: "Invite employees, run self-serve onboarding, and approve submitted documents.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type InviteRow = OnboardingInvite & Record<string, unknown>;
type SubmissionRow = OnboardingSubmission &
  Record<string, unknown> & { name: string; email: string; department: string };

function Page() {
  const [invites, setInvites] = useState<OnboardingInvite[]>([]);
  const [submissions, setSubmissions] = useState<OnboardingSubmission[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [review, setReview] = useState<OnboardingSubmission | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [hrReviewed, setHrReviewed] = useState<string[]>([]);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [formConfig, setFormConfig] = useState<OnboardingFormConfig>(defaultOnboardingConfig);


  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    designation: "",
    roleType: "Employee" as RoleType,
  });

  useEffect(() => {
    const stored = loadInvites();
    if (stored.length) {
      setInvites(stored);
    } else {
      const seeded: OnboardingInvite[] = initialInvites.map((i) => ({
        ...i,
        token: makeToken(),
        status: i.status,
      }));
      saveInvites(seeded);
      setInvites(seeded);
    }
    setSubmissions(loadSubmissions());
    setFormConfig(loadFormConfig());

  }, []);

  const persistInvites = (next: OnboardingInvite[]) => {
    setInvites(next);
    saveInvites(next);
  };
  const persistSubmissions = (next: OnboardingSubmission[]) => {
    setSubmissions(next);
    saveSubmissions(next);
  };

  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.status === "Active").length,
      pendingReview: submissions.filter((s) => s.status === "Pending").length,
      pending: invites.filter((i) => i.status === "Pending" || i.status === "Opened").length,
    }),
    [invites, submissions],
  );

  const copyLink = (token: string) => {
    const link = onboardingLink(token);
    void navigator.clipboard?.writeText(link);
    setLastLink(link);
    toast.success("Onboarding link copied");
  };

  const sendInvite = () => {
    if (!form.email.trim() || !form.firstName.trim()) {
      toast.error("First name and email are required");
      return;
    }
    const token = makeToken();
    const invite: OnboardingInvite = {
      id: `inv-${Date.now()}`,
      token,
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      department: form.department || "—",
      designation: form.designation || "—",
      roleType: form.roleType,
      sentAt: new Date().toISOString().slice(0, 10),
      status: "Pending",
    };
    persistInvites([invite, ...invites]);
    setLastLink(onboardingLink(token));
    void navigator.clipboard?.writeText(onboardingLink(token));
    toast.success(`Onboarding link sent to ${invite.email} (copied to clipboard)`);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      department: "",
      designation: "",
      roleType: "Employee",
    });
    setInviteOpen(false);
  };

  const decide = (status: "Approved" | "Rejected") => {
    if (!review) return;
    const next = submissions.map((s) =>
      s.token === review.token
        ? { ...s, status, reviewNote: reviewNote.trim(), reviewedDocuments: hrReviewed }
        : s,
    );
    persistSubmissions(next);
    persistInvites(invites.map((i) => (i.token === review.token ? { ...i, status } : i)));
    toast.success(status === "Approved" ? "Onboarding approved" : "Submission sent back to employee");
    setReview(null);
    setReviewNote("");
    setHrReviewed([]);
  };

  const inviteFor = (token: string) => invites.find((i) => i.token === token);

  const submissionRows: SubmissionRow[] = submissions.map((s) => {
    const inv = inviteFor(s.token);
    return {
      ...s,
      name:
        `${s.fields["firstName"] ?? inv?.firstName ?? ""} ${s.fields["lastName"] ?? inv?.lastName ?? ""}`.trim() ||
        "Unknown",
      email: s.fields["email"] ?? inv?.email ?? "—",
      department: inv?.department ?? "—",
    };
  });

  const employeeColumns: Column<Employee & Record<string, unknown>>[] = [
    { key: "employeeId", header: "ID", searchable: true },
    {
      key: "name",
      header: "Employee",
      accessor: (r) => `${r.firstName} ${r.lastName}`,
      cell: (r) => (
        <div>
          <p className="font-medium">
            {r.firstName} {r.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{r.email}</p>
        </div>
      ),
    },
    { key: "department", header: "Department" },
    { key: "designation", header: "Designation" },
    { key: "roleType", header: "Role" },
    {
      key: "onboardingProgress",
      header: "Onboarding",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${r.onboardingProgress}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{r.onboardingProgress}%</span>
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status} /> },
  ];

  const inviteColumns: Column<InviteRow>[] = [
    {
      key: "name",
      header: "Invitee",
      accessor: (r) => `${r.firstName} ${r.lastName}`,
      cell: (r) => (
        <div>
          <p className="font-medium">
            {r.firstName} {r.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{r.email}</p>
        </div>
      ),
    },
    { key: "department", header: "Department" },
    { key: "designation", header: "Designation" },
    { key: "roleType", header: "Role" },
    { key: "sentAt", header: "Sent" },
    { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status} /> },
    {
      key: "link",
      header: "Onboarding link",
      cell: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            copyLink(r.token);
          }}
        >
          <Copy className="size-3.5" /> Copy link
        </Button>
      ),
    },
  ];

  const submissionColumns: Column<SubmissionRow>[] = [
    {
      key: "name",
      header: "Employee",
      searchable: true,
      cell: (r) => (
        <div>
          <p className="font-medium">{r.name}</p>
          <p className="text-xs text-muted-foreground">{r.email}</p>
        </div>
      ),
    },
    { key: "department", header: "Department" },
    {
      key: "submittedAt",
      header: "Submitted",
      cell: (r) => new Date(r.submittedAt).toLocaleString(),
    },
    {
      key: "files",
      header: "Documents",
      cell: (r) => <span className="text-sm">{r.files.length} uploaded</span>,
    },
    { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Employee Directory"
        description="Send onboarding links, review employee submissions and manage records."
        actions={
          <>
            <Button variant="outline" onClick={() => setBuilderOpen(true)}>
              <Eye className="size-4" /> Preview & Customize Form
            </Button>
            <Button variant="outline" onClick={() => setInviteOpen(true)}>
              <Mail className="size-4" /> Invite Employee
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" /> Add Employee
            </Button>
          </>
        }

      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Employees" value={stats.total} />
        <StatCard icon={UserCheck} label="Active" value={stats.active} />
        <StatCard icon={FileText} label="Awaiting Review" value={stats.pendingReview} />
        <StatCard icon={UserPlus} label="Open Invites" value={stats.pending} />
      </div>

      {lastLink && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
          <span className="text-sm text-muted-foreground">Latest onboarding link:</span>
          <code className="truncate rounded bg-secondary px-2 py-1 text-xs">{lastLink}</code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard?.writeText(lastLink);
              toast.success("Copied");
            }}
          >
            <Copy className="size-3.5" /> Copy
          </Button>
        </div>
      )}

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="submissions">Onboarding Submissions</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="mt-4">
          <DataTable
            data={employees as (Employee & Record<string, unknown>)[]}
            columns={employeeColumns}
            filters={[
              { key: "department", label: "Departments", options: departments },
              { key: "status", label: "Status", options: ["Active", "Onboarding", "Inactive"] },
            ]}
            onRowClick={(row) => setSelected(row)}
          />
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <DataTable
            data={submissionRows}
            columns={submissionColumns}
            filters={[{ key: "status", label: "Status", options: ["Pending", "Approved", "Rejected"] }]}
            emptyMessage="No onboarding submissions yet. Invite an employee to get started."
            onRowClick={(row) => {
              setReview(row);
              setReviewNote(row.reviewNote ?? "");
              setHrReviewed(row.reviewedDocuments ?? []);
            }}
          />
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          <DataTable
            data={invites as InviteRow[]}
            columns={inviteColumns}
            filters={[
              {
                key: "status",
                label: "Status",
                options: ["Pending", "Opened", "Submitted", "Approved", "Rejected", "Expired"],
              },
            ]}
            emptyMessage="No invites sent yet."
            actions={[
              {
                label: "Copy onboarding link",
                onSelect: (row) => copyLink(row.token),
              },
              {
                label: "Resend invite",
                onSelect: (row) => toast.success(`Onboarding link resent to ${row.email}`),
              },
              {
                label: "Revoke invite",
                destructive: true,
                onSelect: (row) => {
                  persistInvites(invites.filter((i) => i.id !== row.id));
                  toast.success("Invite revoked");
                },
              },
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite employee</DialogTitle>
            <DialogDescription>
              We generate a secure onboarding link. The employee fills in their details and uploads
              documents; you approve them here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">First Name *</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="e.g. John"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Last Name</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="e.g. Doe"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Work Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="abc@domain.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Department</Label>
              <Select
                value={form.department}
                onValueChange={(v) => setForm((f) => ({ ...f, department: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Designation</Label>
              <Select
                value={form.designation}
                onValueChange={(v) => setForm((f) => ({ ...f, designation: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Role Type</Label>
              <Select
                value={form.roleType}
                onValueChange={(v) => setForm((f) => ({ ...f, roleType: v as RoleType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleTypes.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendInvite}>
              <Send className="size-4" /> Send onboarding link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Onboarding form preview & builder */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Onboarding form</DialogTitle>
            <DialogDescription>
              Preview the form exactly as the employee sees it, and add or delete any section, field
              or document.
            </DialogDescription>
          </DialogHeader>
          <OnboardingFormBuilder config={formConfig} onConfigChange={setFormConfig} />
        </DialogContent>
      </Dialog>

      {/* Add employee dialog */}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add employee</DialogTitle>
            <DialogDescription>Complete each onboarding section for the new hire.</DialogDescription>
          </DialogHeader>
          <EmployeeForm />
        </DialogContent>
      </Dialog>

      {/* Employee detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selected.firstName} {selected.lastName}
                </DialogTitle>
                <DialogDescription>
                  {selected.employeeId} · {selected.designation} · {selected.department}
                </DialogDescription>
              </DialogHeader>
              <EmployeeForm employee={selected} />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Submission review dialog */}
      <Dialog open={!!review} onOpenChange={(o) => !o && setReview(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {review && (
            <>
              <DialogHeader>
                <DialogTitle>Review onboarding submission</DialogTitle>
                <DialogDescription>
                  Submitted {new Date(review.submittedAt).toLocaleString()} ·{" "}
                  {inviteFor(review.token)?.email}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(review.fields).map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-border bg-card p-3">
                      <p className="text-xs capitalize text-muted-foreground">
                        {key.replace(/([A-Z])/g, " $1")}
                      </p>
                      <p className="text-sm">{value || "—"}</p>
                    </div>
                  ))}
                </div>

                <DocumentReviewStep
                  documents={formConfig.documents}
                  files={review.files}
                  reviewed={hrReviewed}
                  hrMode
                  onToggle={(slot, checked) =>
                    setHrReviewed((prev) =>
                      checked ? [...new Set([...prev, slot])] : prev.filter((x) => x !== slot),
                    )
                  }
                />

                {review.consent && (
                  <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
                    <h3 className="mb-1 text-sm font-semibold">Policy consent signed</h3>
                    <p className="text-xs text-muted-foreground">
                      {review.consent.documentTitle} ({review.consent.documentVersion})
                    </p>
                    <p className="mt-2 text-sm">
                      Signed by{" "}
                      <span className="font-medium">{review.consent.signedName}</span> on{" "}
                      {new Date(review.consent.signedAt).toLocaleString()} ·{" "}
                      {review.consent.acknowledged.length} declarations accepted
                    </p>
                    {review.consent.signatureImage && (
                      <img
                        src={review.consent.signatureImage}
                        alt="Employee signature"
                        className="mt-3 h-24 rounded-lg border border-border bg-secondary/40 object-contain"
                      />
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openConsentPdf(review)}>
                        View signed consent PDF
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => downloadConsentPdf(review)}>
                        Download PDF
                      </Button>
                    </div>
                  </div>
                )}




                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Review note (optional)</Label>
                  <Textarea
                    rows={3}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Tell the employee what needs fixing if you send it back."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => decide("Rejected")}>
                    <XCircle className="size-4" /> Send back
                  </Button>
                  <Button
                    onClick={() => decide("Approved")}
                    disabled={hrReviewed.length < formConfig.documents.length + 1}
                  >
                    <CheckCircle2 className="size-4" /> Approve
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
