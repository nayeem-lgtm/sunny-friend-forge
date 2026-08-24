import { Save, Upload, User, FolderOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  documentSlots,
  roleTypes,
  schedules,
  type Employee,
} from "@/lib/employee-data";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function SaveBar({ onSave }: { onSave: () => void }) {
  return (
    <div className="pt-2">
      <Button size="sm" onClick={onSave}>
        <Save className="size-4" /> Save
      </Button>
    </div>
  );
}

export function EmployeeForm({ employee }: { employee?: Employee }) {
  const [onProbation, setOnProbation] = useState(employee?.onProbation ?? false);
  const save = (section: string) => toast.success(`${section} saved`);

  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
        {[
          ["personal", "Personal Information"],
          ["professional", "Professional Information"],
          ["contact", "Contact"],
          ["banking", "Banking"],
          ["documents", "Documents"],
          ["leave", "Leave Allowance"],
          ["schedule", "Schedule"],
        ].map(([v, label]) => (
          <TabsTrigger key={v} value={v!} className="rounded-md px-3 py-1.5 text-sm">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="personal" className="mt-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <User className="size-6" />
          </div>
          <Button variant="outline" size="sm">
            <Upload className="size-4" /> Upload photo
          </Button>
        </div>
        <Field label="Employee ID" required>
          <Input placeholder="e.g EM-001" defaultValue={employee?.employeeId} />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="First Name" required>
            <Input placeholder="e.g. John" defaultValue={employee?.firstName} />
          </Field>
          <Field label="Last Name" required>
            <Input placeholder="e.g Doe" defaultValue={employee?.lastName} />
          </Field>
          <Field label="Email" required>
            <Input type="email" placeholder="abc@dmain.com" defaultValue={employee?.email} />
          </Field>
          <Field label="Phone Number" required>
            <Input placeholder="01XXX-XXXXXX" defaultValue={employee?.phone} />
          </Field>
          <Field label="Date of Birth" required>
            <Input type="date" defaultValue={employee?.dateOfBirth} />
          </Field>
          <Field label="Joining Date" required>
            <Input type="date" defaultValue={employee?.joiningDate} />
          </Field>
        </div>
        <SaveBar onSave={() => save("Personal information")} />
      </TabsContent>

      <TabsContent value="professional" className="mt-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Department" required>
            <Select defaultValue={employee?.department ?? ""}>
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
          </Field>
          <Field label="Designation" required>
            <Select defaultValue={employee?.designation ?? ""}>
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
          </Field>
          <Field label="Monthly Salary">
            <Input type="number" placeholder="65,000" defaultValue={employee?.monthlySalary} />
          </Field>
          <Field label="Hire Date" required>
            <Input type="date" defaultValue={employee?.hireDate} />
          </Field>
          <Field label="Role Type">
            <Select defaultValue={employee?.roleType ?? "Employee"}>
              <SelectTrigger>
                <SelectValue placeholder="Select role type" />
              </SelectTrigger>
              <SelectContent>
                {roleTypes.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="On Probation" required>
            <div className="flex items-center gap-2">
              <Switch checked={onProbation} onCheckedChange={setOnProbation} />
              <span className="text-sm">{onProbation ? "Yes" : "No"}</span>
            </div>
          </Field>
        </div>
        <SaveBar onSave={() => save("Professional information")} />
      </TabsContent>

      <TabsContent value="contact" className="mt-6 space-y-5">
        <Field label="Address" required>
          <Textarea rows={3} defaultValue={employee?.address} placeholder="Street, city, postcode" />
        </Field>
        <Field label="Emergency Contact" required>
          <Input defaultValue={employee?.emergencyContact} placeholder="+8801XXXXXXXXX" />
        </Field>
        <SaveBar onSave={() => save("Contact details")} />
      </TabsContent>

      <TabsContent value="banking" className="mt-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Bank Name" required>
            <Input defaultValue={employee?.bankName} placeholder="The City Bank" />
          </Field>
          <Field label="Account Number" required>
            <Input defaultValue={employee?.accountNumber} placeholder="XXXXXXXXXXXX" />
          </Field>
          <Field label="Account Holder Name" required>
            <Input defaultValue={employee?.accountHolderName} placeholder="Full name" />
          </Field>
          <Field label="Routing Number" required>
            <Input defaultValue={employee?.routingNumber} placeholder="XXXXXXXXX" />
          </Field>
          <Field label="SWIFT Code">
            <Input defaultValue={employee?.swiftCode} placeholder="CIBLBDDH" />
          </Field>
          <Field label="Branch Name">
            <Input defaultValue={employee?.branchName} placeholder="Mouchak Branch" />
          </Field>
          <Field label="Bank District">
            <Input defaultValue={employee?.bankDistrict} placeholder="Dhaka" />
          </Field>
          <Field label="Currency">
            <Input defaultValue={employee?.currency ?? "BDT"} placeholder="BDT" />
          </Field>
        </div>
        <SaveBar onSave={() => save("Banking details")} />
      </TabsContent>

      <TabsContent value="documents" className="mt-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          {documentSlots.map((slot, i) => (
            <div
              key={slot}
              className={i === documentSlots.length - 1 ? "space-y-1.5 md:col-span-2" : "space-y-1.5"}
            >
              <Label className="text-xs text-muted-foreground">{slot}</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-secondary/40">
                <span>Click to upload or Drag &amp; Drop (PDF, DOC, DOCX)</span>
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  <FolderOpen className="size-4" /> Select File
                </span>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx" />
              </label>
            </div>
          ))}
        </div>
        <SaveBar onSave={() => save("Documents")} />
      </TabsContent>

      <TabsContent value="leave" className="mt-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Casual Leave (days)">
            <Input type="number" defaultValue={employee?.casualLeave ?? 10} />
          </Field>
          <Field label="Sick Leave (days)">
            <Input type="number" defaultValue={employee?.sickLeave ?? 14} />
          </Field>
          <Field label="Annual Leave (days)">
            <Input type="number" defaultValue={employee?.annualLeave ?? 12} />
          </Field>
        </div>
        <SaveBar onSave={() => save("Leave allowance")} />
      </TabsContent>

      <TabsContent value="schedule" className="mt-6 space-y-5">
        <Field label="Assigned Schedule">
          <Select defaultValue={employee?.schedule ?? schedules[0]!}>
            <SelectTrigger>
              <SelectValue placeholder="Select schedule" />
            </SelectTrigger>
            <SelectContent>
              {schedules.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <SaveBar onSave={() => save("Schedule")} />
      </TabsContent>
    </Tabs>
  );
}
