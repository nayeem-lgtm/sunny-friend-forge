import { Eye, Plus, RotateCcw, Save, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmSubmitStep } from "@/components/employees/ConfirmSubmitStep";
import { ConsentStep } from "@/components/employees/ConsentStep";
import { OnboardingFormFields } from "@/components/employees/OnboardingFormFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defaultOnboardingConfig,
  saveFormConfig,
  type OnboardingFormConfig,
} from "@/lib/onboarding-store";

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "tel", label: "Phone" },
  { value: "textarea", label: "Long text" },
];
const previewSteps = ["Your details", "Consent & signature", "Confirm & submit"];


const slugify = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "") || `field${Date.now()}`;

export function OnboardingFormBuilder({
  config,
  onConfigChange,
}: {
  config: OnboardingFormConfig;
  onConfigChange: (config: OnboardingFormConfig) => void;
}) {
  const [draft, setDraft] = useState<OnboardingFormConfig>(config);
  const [preview, setPreview] = useState<Record<string, string>>({});
  const [newGroup, setNewGroup] = useState("");
  const [newDoc, setNewDoc] = useState("");
  const [newField, setNewField] = useState<Record<string, { label: string; type: string }>>({});
  const [previewStep, setPreviewStep] = useState<0 | 1 | 2>(0);
  const [previewConsents, setPreviewConsents] = useState<string[]>([]);
  const [previewSignature, setPreviewSignature] = useState("");

  const update = (next: OnboardingFormConfig) => setDraft(next);

  const addGroup = () => {
    const title = newGroup.trim();
    if (!title) return;
    update({
      ...draft,
      groups: [...draft.groups, { id: `${slugify(title)}-${Date.now()}`, title, fields: [] }],
    });
    setNewGroup("");
  };

  const addField = (groupId: string) => {
    const entry = newField[groupId];
    const label = entry?.label.trim();
    if (!label) return;
    const key = slugify(label);
    update({
      ...draft,
      groups: draft.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              fields: [
                ...g.fields,
                { key: g.fields.some((f) => f.key === key) ? `${key}${g.fields.length}` : key, label, type: entry?.type ?? "text" },
              ],
            }
          : g,
      ),
    });
    setNewField((s) => ({ ...s, [groupId]: { label: "", type: entry?.type ?? "text" } }));
  };

  const save = () => {
    saveFormConfig(draft);
    onConfigChange(draft);
    toast.success("Onboarding form saved");
  };

  const reset = () => {
    setDraft(defaultOnboardingConfig);
    toast.info("Reverted to the default form — save to apply");
  };

  return (
    <Tabs defaultValue="preview">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="preview">
            <Eye className="size-4" /> Employee preview
          </TabsTrigger>
          <TabsTrigger value="customize">
            <Settings2 className="size-4" /> Customize
          </TabsTrigger>
        </TabsList>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="size-4" /> Reset
          </Button>
          <Button size="sm" onClick={save}>
            <Save className="size-4" /> Save form
          </Button>
        </div>
      </div>

      <TabsContent value="preview" className="mt-4">
        <p className="mb-4 text-sm text-muted-foreground">
          This is exactly what the employee sees after opening their onboarding link — walk through every
          step below.
        </p>
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-6 rounded-xl border border-border bg-card p-6">
            <h1 className="text-2xl font-semibold">Welcome, John 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete your details, review the policy, sign and submit.
            </p>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {previewSteps.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setPreviewStep(i as 0 | 1 | 2)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-colors ${
                  previewStep === i
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                    previewStep >= i ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  {i + 1}
                </span>
                {label}
              </button>
            ))}
          </div>

          {previewStep === 0 && (
            <OnboardingFormFields
              config={draft}
              values={preview}
              onChange={(k, v) => setPreview((p) => ({ ...p, [k]: v }))}
              files={[]}
              disabled
            />
          )}

          {previewStep === 1 && (
            <ConsentStep
              fullName={`${preview["firstName"] ?? "John"} ${preview["lastName"] ?? "Doe"}`.trim()}
              acknowledged={previewConsents}
              onToggle={(id, checked) =>
                setPreviewConsents((prev) =>
                  checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id),
                )
              }
              signedName={previewSignature}
              onSignedName={setPreviewSignature}
            />
          )}

          {previewStep === 2 && (
            <ConfirmSubmitStep
              fullName={`${preview["firstName"] ?? "John"} ${preview["lastName"] ?? "Doe"}`.trim()}
              email={preview["email"] ?? "john.doe@example.com"}
              documents={draft.documents}
              files={[]}
              acknowledged={previewConsents}
              signedName={previewSignature}
            />
          )}

          <div className="flex flex-wrap justify-between gap-2 pt-6">
            <Button
              variant="outline"
              size="lg"
              disabled={previewStep === 0}
              onClick={() => setPreviewStep((s) => (s === 0 ? 0 : ((s - 1) as 0 | 1)))}
            >
              Back
            </Button>
            {previewStep < 2 ? (
              <Button size="lg" onClick={() => setPreviewStep((s) => ((s + 1) as 1 | 2))}>
                {previewStep === 0 ? "Continue to consent & signature" : "Continue to confirm"}
              </Button>
            ) : (
              <Button size="lg" disabled>
                Confirm &amp; submit onboarding
              </Button>
            )}
          </div>
        </div>
      </TabsContent>


      <TabsContent value="customize" className="mt-4 space-y-6">
        {draft.groups.map((group) => (
          <section key={group.id} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Input
                value={group.title}
                onChange={(e) =>
                  update({
                    ...draft,
                    groups: draft.groups.map((g) =>
                      g.id === group.id ? { ...g, title: e.target.value } : g,
                    ),
                  })
                }
                className="max-w-xs font-medium"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  update({ ...draft, groups: draft.groups.filter((g) => g.id !== group.id) })
                }
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>

            <div className="space-y-2">
              {group.fields.map((f) => (
                <div
                  key={f.key}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2"
                >
                  <Input
                    value={f.label}
                    onChange={(e) =>
                      update({
                        ...draft,
                        groups: draft.groups.map((g) =>
                          g.id === group.id
                            ? {
                                ...g,
                                fields: g.fields.map((x) =>
                                  x.key === f.key ? { ...x, label: e.target.value } : x,
                                ),
                              }
                            : g,
                        ),
                      })
                    }
                    className="w-56"
                  />
                  <Select
                    value={f.type ?? "text"}
                    onValueChange={(v) =>
                      update({
                        ...draft,
                        groups: draft.groups.map((g) =>
                          g.id === group.id
                            ? {
                                ...g,
                                fields: g.fields.map((x) => (x.key === f.key ? { ...x, type: v } : x)),
                              }
                            : g,
                        ),
                      })
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!f.required}
                      onCheckedChange={(c) =>
                        update({
                          ...draft,
                          groups: draft.groups.map((g) =>
                            g.id === group.id
                              ? {
                                  ...g,
                                  fields: g.fields.map((x) =>
                                    x.key === f.key ? { ...x, required: c } : x,
                                  ),
                                }
                              : g,
                          ),
                        })
                      }
                    />
                    <span className="text-xs text-muted-foreground">Required</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={() =>
                      update({
                        ...draft,
                        groups: draft.groups.map((g) =>
                          g.id === group.id
                            ? { ...g, fields: g.fields.filter((x) => x.key !== f.key) }
                            : g,
                        ),
                      })
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input
                placeholder="New field label"
                className="w-56"
                value={newField[group.id]?.label ?? ""}
                onChange={(e) =>
                  setNewField((s) => ({
                    ...s,
                    [group.id]: { label: e.target.value, type: s[group.id]?.type ?? "text" },
                  }))
                }
                onKeyDown={(e) => e.key === "Enter" && addField(group.id)}
              />
              <Select
                value={newField[group.id]?.type ?? "text"}
                onValueChange={(v) =>
                  setNewField((s) => ({
                    ...s,
                    [group.id]: { label: s[group.id]?.label ?? "", type: v },
                  }))
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => addField(group.id)}>
                <Plus className="size-4" /> Add field
              </Button>
            </div>
          </section>
        ))}

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="New section title"
            className="w-64"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGroup()}
          />
          <Button variant="outline" size="sm" onClick={addGroup}>
            <Plus className="size-4" /> Add section
          </Button>
        </div>

        <section className="rounded-xl border border-border bg-card p-5">
          <Label className="text-sm font-semibold">Required documents</Label>
          <div className="mt-3 flex flex-wrap gap-2">
            {draft.documents.map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-sm"
              >
                {d}
                <button
                  type="button"
                  onClick={() =>
                    update({ ...draft, documents: draft.documents.filter((x) => x !== d) })
                  }
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={`Remove ${d}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Input
              placeholder="New document name"
              className="w-64"
              value={newDoc}
              onChange={(e) => setNewDoc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const name = newDoc.trim();
                if (!name || draft.documents.includes(name)) return;
                update({ ...draft, documents: [...draft.documents, name] });
                setNewDoc("");
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const name = newDoc.trim();
                if (!name || draft.documents.includes(name)) return;
                update({ ...draft, documents: [...draft.documents, name] });
                setNewDoc("");
              }}
            >
              <Plus className="size-4" /> Add document
            </Button>
          </div>
        </section>
      </TabsContent>
    </Tabs>
  );
}
