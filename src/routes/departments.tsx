import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { departments as seedDepartments, employees } from "@/lib/employee-data";

export const Route = createFileRoute("/departments")({
  head: () => ({
    meta: [
      { title: "Departments — Ray ERP" },
      { name: "description", content: "Create and oversee Ray's departments and their team sizes." },
      { property: "og:title", content: "Departments — Ray ERP" },
      {
        property: "og:description",
        content: "Create and oversee Ray's departments and their team sizes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type DepartmentRow = Record<string, unknown> & {
  name: string;
  head: string;
  description: string;
  members: number;
};

const departmentMeta: Record<string, { head: string; description: string }> = {
  "IT Department": {
    head: "Cody Fisher",
    description: "Internal tooling, web platforms, integrations and technical support.",
  },
  "Affiliate Department": {
    head: "Marvin Hall",
    description: "Affiliate partnerships, offer management and commission tracking.",
  },
  "Business Development Department": {
    head: "Arlene Lane",
    description: "New business, client acquisition, proposals and pipeline growth.",
  },
  "QA Department": {
    head: "Kristin Ward",
    description: "Quality assurance, release testing and defect management.",
  },
  "Accounting Department": {
    head: "Courtney Henry",
    description: "Payroll, invoicing, reconciliation and financial reporting.",
  },
};

function Page() {
  const [list, setList] = useState<string[]>(seedDepartments);
  const [extra, setExtra] = useState<Record<string, { head: string; description: string }>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", head: "", description: "" });

  const rows = useMemo<DepartmentRow[]>(
    () =>
      list.map((name) => {
        const meta = departmentMeta[name] ?? extra[name] ?? { head: "—", description: "—" };
        return {
          name,
          head: meta.head || "—",
          description: meta.description || "—",
          members: employees.filter((e) => e.department === name).length,
        };
      }),
    [list, extra],
  );

  const columns: Column<DepartmentRow>[] = [
    {
      key: "name",
      header: "Department",
      searchable: true,
      cell: (r) => <span className="font-medium text-foreground">{r.name}</span>,
    },
    { key: "head", header: "Department Head" },
    {
      key: "description",
      header: "Description",
      cell: (r) => (
        <span className="line-clamp-1 block max-w-[22rem] text-muted-foreground" title={r.description}>
          {r.description}
        </span>
      ),
    },
    {
      key: "members",
      header: "Employees",
      accessor: (r) => r.members,
      cell: (r) => <span className="font-medium text-foreground">{r.members}</span>,
    },
  ];

  const addDepartment = () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Department name is required.");
      return;
    }
    if (list.some((d) => d.toLowerCase() === name.toLowerCase())) {
      toast.error("That department already exists.");
      return;
    }
    setList((prev) => [...prev, name]);
    setExtra((prev) => ({
      ...prev,
      [name]: { head: form.head.trim(), description: form.description.trim() },
    }));
    setForm({ name: "", head: "", description: "" });
    setOpen(false);
    toast.success(`${name} added.`);
  };

  return (
    <AppShell>
      <PageHeader
        title="Departments"
        description="Create and oversee Ray's departments and their team sizes."
        actions={
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Add Department
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Building2} label="Departments" value={list.length} highlight />
        <StatCard icon={Users} label="Employees Assigned" value={employees.length} />
        <StatCard
          icon={Users}
          label="Largest Department"
          value={
            rows.slice().sort((a, b) => b.members - a.members)[0]?.name ?? "—"
          }
        />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        actions={[
          { label: "Edit", onSelect: () => toast.info("Editing departments arrives soon.") },
          {
            label: "Delete",
            destructive: true,
            onSelect: (r) => {
              setList((prev) => prev.filter((d) => d !== r.name));
              toast.success(`${r.name} removed.`);
            },
          },
        ]}
        emptyMessage="No departments yet."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>Departments are used across the directory, attendance and worklogs.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dept-name">Department Name</Label>
              <Input
                id="dept-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Creative Department"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept-head">Department Head</Label>
              <Input
                id="dept-head"
                value={form.head}
                onChange={(e) => setForm((f) => ({ ...f, head: e.target.value }))}
                placeholder="e.g. Arlene Lane"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept-desc">Description</Label>
              <Textarea
                id="dept-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What does this department own?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addDepartment}>Add Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
