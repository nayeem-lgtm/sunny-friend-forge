import { useState } from "react";
import { Check, ChevronDown, Clock, Plus } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { boardPeople, initials, labelColor, labelPalette } from "@/lib/board-data";
import type { Label } from "@/lib/board-data";
import { cn } from "@/lib/utils";

function AddLabelInline({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const commit = () => {
    const v = name.trim();
    if (v) onAdd(v);
    setName("");
    setAdding(false);
  };
  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="mt-1 flex w-full items-center gap-1 rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"
      >
        <Plus className="h-3.5 w-3.5" /> Add option
      </button>
    );
  }
  return (
    <Input
      autoFocus
      value={name}
      placeholder="Option name"
      onChange={(e) => setName(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setAdding(false);
      }}
      className="mt-1 h-8 text-xs"
    />
  );
}


export function StatusCell({
  value,
  labels,
  onChange,
  onAddLabel,
}: {
  value: string;
  labels: Label[];
  onChange: (v: string) => void;
  onAddLabel?: (l: Label) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-8 w-full text-xs font-medium transition-opacity hover:opacity-90",
            labelColor(labels, value),
          )}
        >
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        {labels.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.name)}
            className={cn("mb-1 block h-8 w-full rounded text-xs font-medium", s.color)}
          >
            {s.name}
          </button>
        ))}
        {onAddLabel ? (
          <AddLabelInline
            onAdd={(name) => {
              const label: Label = {
                id: `st-${Math.random().toString(36).slice(2, 8)}`,
                name,
                color: labelPalette[labels.length % labelPalette.length]!.color,
              };
              onAddLabel(label);
              onChange(name);
            }}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export function PriorityCell({
  value,
  labels,
  onChange,
  onAddLabel,
}: {
  value: string;
  labels: Label[];
  onChange: (v: string) => void;
  onAddLabel?: (l: Label) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "mx-auto flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium",
            labelColor(labels, value),
          )}
        >
          {value}
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start">
        {labels.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.name)}
            className={cn("mb-1 block w-full rounded-full px-2.5 py-1 text-xs font-medium", p.color)}
          >
            {p.name}
          </button>
        ))}
        {onAddLabel ? (
          <AddLabelInline
            onAdd={(name) => {
              const label: Label = {
                id: `pr-${Math.random().toString(36).slice(2, 8)}`,
                name,
                color: labelPalette[labels.length % labelPalette.length]!.color,
              };
              onAddLabel(label);
              onChange(name);
            }}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}


export function PeopleCell({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const people = boardPeople();
  const selected = people.filter((p) => value.includes(p.id));
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="mx-auto flex items-center -space-x-2">
          {selected.length === 0 ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-border text-[10px] text-muted-foreground">
              +
            </span>
          ) : (
            selected.slice(0, 3).map((p) => (
              <Avatar key={p.id} className="h-7 w-7 border border-background">
                <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
                  {initials(`${p.firstName} ${p.lastName}`)}
                </AvatarFallback>
              </Avatar>
            ))
          )}
          {selected.length > 3 ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-background bg-muted text-[10px]">
              +{selected.length - 3}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-h-72 w-64 overflow-y-auto p-1" align="start">
        {people.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.id)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
                {initials(`${p.firstName} ${p.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate">
              {p.firstName} {p.lastName}
              <span className="block text-[10px] text-muted-foreground">{p.department}</span>
            </span>
            {value.includes(p.id) ? <Check className="h-4 w-4 text-primary" /> : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** value is "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" */
export function DateCell({
  value,
  onChange,
  overdue,
}: {
  value: string;
  onChange: (v: string) => void;
  overdue?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const datePart = value ? value.slice(0, 10) : "";
  const timePart = value && value.length > 10 ? value.slice(11, 16) : "";
  const selected = datePart ? new Date(`${datePart}T00:00:00`) : undefined;

  const setDate = (iso: string) => onChange(timePart ? `${iso}T${timePart}` : iso);
  const setTime = (t: string) => {
    const d = datePart || new Date().toISOString().slice(0, 10);
    onChange(t ? `${d}T${t}` : d);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-7 w-full rounded px-1 text-center text-xs hover:bg-muted",
            overdue ? "text-destructive" : "text-foreground",
            !value && "text-muted-foreground",
          )}
        >
          {datePart
            ? `${selected!.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}${timePart ? `, ${timePart}` : ""}`
            : "Set date"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          {...(selected ? { defaultMonth: selected } : {})}
          onSelect={(d) => {
            if (d) {
              const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              setDate(iso);
            }
          }}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
        <div className="flex items-center gap-2 border-t border-border p-3">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="time"
            value={timePart}
            onChange={(e) => setTime(e.target.value)}
            className="h-8 w-32 text-xs"
          />
          <Button variant="ghost" size="sm" className="ml-auto h-8 text-xs" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function parseWhen(v: string): number | null {
  if (!v) return null;
  const t = new Date(v.length > 10 ? v : `${v}T00:00:00`).getTime();
  return Number.isNaN(t) ? null : t;
}

function formatSpan(ms: number) {
  const mins = Math.round(ms / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Time-based progress between start and due datetimes. */
export function TimingBar({
  start,
  due,
  fallback = 0,
  done,
}: {
  start: string;
  due: string;
  fallback?: number;
  done?: boolean;
}) {
  const s = parseWhen(start);
  const e = parseWhen(due);
  const now = Date.now();

  if (s === null || e === null || e <= s) {
    return <ProgressBar value={fallback} />;
  }

  const pct = done ? 100 : Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100)));
  const remaining = e - now;
  const overdue = !done && remaining < 0;
  const label = done ? "Done" : overdue ? `${formatSpan(-remaining)} over` : `${formatSpan(remaining)} left`;

  return (
    <div className="mx-auto w-28">
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            done ? "bg-success" : overdue ? "bg-destructive" : pct > 80 ? "bg-warning" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          "mt-0.5 block text-center text-[10px]",
          overdue ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}



export function NumberCell({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="h-7 border-none bg-transparent px-1 text-center text-xs shadow-none focus-visible:ring-1"
    />
  );
}

export function TextCell({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <Input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-7 border-none bg-transparent px-1 text-sm shadow-none focus-visible:ring-1",
        className,
      )}
    />
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mx-auto flex w-24 items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right text-[11px] text-muted-foreground">{value}%</span>
    </div>
  );
}

export { Button };
