import { Bolt, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AutomationRule = {
  id: string;
  trigger: string;
  value: string;
  action: string;
  target: string;
  enabled: boolean;
};

const TRIGGERS = [
  "When status changes to",
  "When priority changes to",
  "When due date arrives",
  "When an item is created",
  "When assignee changes to",
];

const ACTIONS = [
  "notify the assignee",
  "notify the board owner",
  "move item to group",
  "set status to",
  "set priority to",
  "create a subitem",
];

export function AutomationPanel({
  statusOptions,
  priorityOptions,
  groupOptions,
  rules,
  onChange,
}: {
  statusOptions: string[];
  priorityOptions: string[];
  groupOptions: string[];
  rules: AutomationRule[];
  onChange: (rules: AutomationRule[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<AutomationRule, "id" | "enabled">>({
    trigger: TRIGGERS[0]!,
    value: statusOptions[0] ?? "",
    action: ACTIONS[0]!,
    target: "",
  });

  const valueOptions = draft.trigger.includes("priority")
    ? priorityOptions
    : draft.trigger.includes("status")
      ? statusOptions
      : [];

  const targetOptions = draft.action.includes("group")
    ? groupOptions
    : draft.action.includes("status")
      ? statusOptions
      : draft.action.includes("priority")
        ? priorityOptions
        : [];

  const add = () => {
    onChange([
      ...rules,
      {
        id: `au-${Math.random().toString(36).slice(2, 8)}`,
        ...draft,
        enabled: true,
      },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bolt className="mr-1.5 h-4 w-4" /> Automation
          {rules.length > 0 && (
            <span className="ml-1.5 rounded bg-primary/15 px-1.5 text-[11px] text-primary">
              {rules.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Board automations</DialogTitle>
          <DialogDescription>
            Create simple when / then rules that run on this board.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {rules.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No automations yet. Build your first rule below.
            </p>
          )}
          {rules.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm"
            >
              <Bolt className="h-4 w-4 shrink-0 text-primary" />
              <p className="flex-1">
                <span className="text-muted-foreground">When</span>{" "}
                {r.trigger.replace(/^When /, "")} {r.value && <b>{r.value}</b>}{" "}
                <span className="text-muted-foreground">then</span> {r.action}{" "}
                {r.target && <b>{r.target}</b>}
              </p>
              <Switch
                checked={r.enabled}
                onCheckedChange={(v) =>
                  onChange(rules.map((x) => (x.id === r.id ? { ...x, enabled: v } : x)))
                }
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onChange(rules.filter((x) => x.id !== r.id))}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-lg border border-border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            New rule
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              value={draft.trigger}
              onValueChange={(v) => setDraft((d) => ({ ...d, trigger: v, value: "" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGERS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {valueOptions.length > 0 ? (
              <Select value={draft.value} onValueChange={(v) => setDraft((d) => ({ ...d, value: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose value" />
                </SelectTrigger>
                <SelectContent>
                  {valueOptions.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground">
                No value needed
              </div>
            )}
            <Select
              value={draft.action}
              onValueChange={(v) => setDraft((d) => ({ ...d, action: v, target: "" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {targetOptions.length > 0 ? (
              <Select value={draft.target} onValueChange={(v) => setDraft((d) => ({ ...d, target: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose target" />
                </SelectTrigger>
                <SelectContent>
                  {targetOptions.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground">
                No target needed
              </div>
            )}
          </div>
          <Button size="sm" onClick={add}>
            <Plus className="mr-1.5 h-4 w-4" /> Add automation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
