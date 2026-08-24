import { createFileRoute } from "@tanstack/react-router";
import { Mail, Plus, Send, UserCheck, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  type Invite,
  type RoleType,
} from "@/lib/employee-data";

export const Route = createFileRoute("/employees")({
  head: () => ({
    meta: [
      { title: "Employee Directory — WorkBoard" },
      {
        name: "description",
        content: "Invite employees, run onboarding, and manage full employee records.",
      },
      { property: "og:title", content: "Employee Directory — WorkBoard" },
      {
        property: "og:description",
        content: "Invite employees, run onboarding, and manage full employee records.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    designation: "",
    roleType: "Employee" as RoleType,
  });

  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.status === "Active").length,
      onboarding: employees.filter((e) => e.status === "Onboarding").length,
      pending: invites.filter((i) => i.status === "Pending").length,
    }),
    [invites],
  );

  const sendInvite = () => {
    if (!form.email.trim() || !form.firstName.trim()) {
      toast.error("First name and email are required");
      return;
    }
    setInvites((prev) => [
      {
        id: `inv-${Date.now()}`,
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        department: form.department || "—",
        designation: form.designation || "—",
        roleType: form.roleType,
        sentAt: new Date().toISOString().slice(0, 10),
        status: "Pending",
      },
      ...prev,
    ]);
    toast.success(`Invite sent to ${form.email.trim()}`);
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

  const inviteColumns: Column<Invite & Record<string, unknown>>[] = [
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
  ];

  return (
    <AppShell>
      <PageHeader
        title="Employee Directory"
        description="Invites, onboarding and complete employee records in one place."
        actions={
          <>
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
        <StatCard icon={UserPlus} label="In Onboarding" value={stats.onboarding} />
        <StatCard icon={Mail} label="Pending Invites" value={stats.pending} />
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
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

        <TabsContent value="onboarding" className="mt-4">
          <DataTable
            data={
              employees.filter((e) => e.onboardingProgress < 100) as (Employee &
                Record<string, unknown>)[]
            }
            columns={employeeColumns}
            emptyMessage="No employees currently onboarding."
            onRowClick={(row) => setSelected(row)}
          />
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          <DataTable
            data={invites as (Invite & Record<string, unknown>)[]}
            columns={inviteColumns}
            filters={[{ key: "status", label: "Status", options: ["Pending", "Accepted", "Expired"] }]}
            emptyMessage="No invites sent yet."
            actions={[
              {
                label: "Resend invite",
                onSelect: (row) => toast.success(`Invite resent to ${row.email}`),
              },
              {
                label: "Revoke invite",
                destructive: true,
                onSelect: (row) => {
                  setInvites((prev) => prev.filter((i) => i.id !== row.id));
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
              Send a signup link so the employee can complete their own onboarding.
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
              <Send className="size-4" /> Send Invite
            </Button>
          </div>
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
    </AppShell>
  );
}
