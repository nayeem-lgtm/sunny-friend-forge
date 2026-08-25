import { useState } from "react";
import { Check, ChevronsUpDown, Search, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function EmployeeCombobox({
  value,
  onChange,
  names,
  allLabel = "All employees",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  names: string[];
  allLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = names.filter((n) => n.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[220px] justify-between font-normal", className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <UserRound className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{value === "all" ? allLabel : value}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[260px] p-0">
        <div className="relative border-b border-border">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employee…"
            className="h-10 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="scrollbar-slim max-h-[260px] overflow-y-auto p-1">
          <Option
            label={allLabel}
            active={value === "all"}
            onSelect={() => {
              onChange("all");
              setOpen(false);
            }}
          />
          {filtered.map((n) => (
            <Option
              key={n}
              label={n}
              active={value === n}
              onSelect={() => {
                onChange(n);
                setOpen(false);
              }}
            />
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No employee found.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Option({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        active && "bg-primary/15 text-foreground",
      )}
    >
      <span className="truncate">{label}</span>
      {active && <Check className="size-4 text-primary" />}
    </button>
  );
}
