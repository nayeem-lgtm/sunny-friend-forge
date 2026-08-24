import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";

import { PeopleCell } from "@/components/board/cells";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label as UiLabel } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CustomField, CustomFieldType } from "@/lib/board-data";
import { cn } from "@/lib/utils";

export function DateField({
  value,
  onChange,
  placeholder = "Pick a date",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const date = value ? parseISO(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 w-full justify-start px-2 text-xs font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
          {date ? format(date, "MMM d, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "longtext", label: "Notes / long text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "people", label: "People" },
  { value: "checkbox", label: "Checkbox" },
  { value: "link", label: "Link" },
];

export function AddFieldButton({ onAdd }: { onAdd: (field: CustomField) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<CustomFieldType>("text");
  const [options, setOptions] = useState("Option 1, Option 2");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-full min-h-[62px] w-full justify-center border-dashed text-xs text-muted-foreground"
        >
          <Plus className="mr-1 h-4 w-4" /> Add field
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3" align="start">
        <div className="space-y-1.5">
          <UiLabel className="text-xs">Field name</UiLabel>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Client, Budget, Notes"
            className="h-8"
          />
        </div>
        <div className="space-y-1.5">
          <UiLabel className="text-xs">Field type</UiLabel>
          <Select value={type} onValueChange={(v) => setType(v as CustomFieldType)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {type === "dropdown" ? (
          <div className="space-y-1.5">
            <UiLabel className="text-xs">Options (comma separated)</UiLabel>
            <Input
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        ) : null}
        <Button
          size="sm"
          className="w-full"
          onClick={() => {
            if (!label.trim()) return;
            onAdd({
              id: `cf-${Math.random().toString(36).slice(2, 9)}`,
              label: label.trim(),
              type,
              value: "",
              ...(type === "dropdown"
                ? {
                    options: options
                      .split(",")
                      .map((o) => o.trim())
                      .filter(Boolean),
                  }
                : {}),
            });
            setLabel("");
            setType("text");
            setOpen(false);
          }}
        >
          Add field
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function CustomFieldControl({
  field,
  onChange,
  onRemove,
  onRename,
}: {
  field: CustomField;
  onChange: (value: string) => void;
  onRemove: () => void;
  onRename: (label: string) => void;
}) {
  return (
    <div className="group relative rounded-lg border border-border px-3 py-2">
      <input
        value={field.label}
        onChange={(e) => onRename(e.target.value)}
        className="w-[calc(100%-1.5rem)] bg-transparent text-[10px] font-semibold uppercase tracking-wide text-muted-foreground outline-none"
      />
      <button
        type="button"
        aria-label="Remove field"
        onClick={onRemove}
        className="absolute right-2 top-2 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="mt-1 text-sm">
        {field.type === "date" ? (
          <DateField value={field.value} onChange={onChange} />
        ) : field.type === "longtext" ? (
          <Textarea
            value={field.value}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            placeholder="Add notes…"
            className="min-h-0 text-xs"
          />
        ) : field.type === "dropdown" ? (
          <Select {...(field.value ? { value: field.value } : {})} onValueChange={onChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((o) => (
                <SelectItem key={o} value={o} className="text-xs">
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === "people" ? (
          <PeopleCell
            value={field.value ? field.value.split(",") : []}
            onChange={(v) => onChange(v.join(","))}
          />
        ) : field.type === "checkbox" ? (
          <Checkbox
            checked={field.value === "true"}
            onCheckedChange={(c) => onChange(c ? "true" : "false")}
          />
        ) : (
          <Input
            value={field.value}
            type={field.type === "number" ? "number" : "text"}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.type === "link" ? "https://…" : "Add value"}
            className="h-8 text-xs"
          />
        )}
      </div>
    </div>
  );
}
