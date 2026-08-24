import { Plus, Settings2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Label } from "@/lib/board-data";
import { labelPalette } from "@/lib/board-data";
import { cn } from "@/lib/utils";

export function LabelManager({
  title,
  labels,
  onChange,
  showProgress,
}: {
  title: string;
  labels: Label[];
  onChange: (labels: Label[]) => void;
  showProgress?: boolean;
}) {
  const patch = (id: string, p: Partial<Label>) =>
    onChange(labels.map((l) => (l.id === id ? { ...l, ...p } : l)));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs">
          <Settings2 className="mr-1 h-3.5 w-3.5" /> {title}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2 p-3" align="end">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Customize {title}
        </p>
        {labels.map((l) => (
          <div key={l.id} className="flex items-center gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Pick colour"
                  className={cn("h-6 w-6 shrink-0 rounded", l.color)}
                />
              </PopoverTrigger>
              <PopoverContent className="grid w-40 grid-cols-4 gap-1.5 p-2" align="start">
                {labelPalette.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => patch(l.id, { color: c.color })}
                    className={cn("h-6 w-6 rounded", c.color)}
                  />
                ))}
              </PopoverContent>
            </Popover>
            <Input
              value={l.name}
              onChange={(e) => patch(l.id, { name: e.target.value })}
              className="h-8 text-sm"
            />
            {showProgress ? (
              <Input
                type="number"
                value={l.progress ?? 0}
                onChange={(e) => patch(l.id, { progress: Number(e.target.value) || 0 })}
                className="h-8 w-16 text-center text-xs"
                title="Progress %"
              />
            ) : null}
            <button
              type="button"
              aria-label="Delete label"
              onClick={() => onChange(labels.filter((x) => x.id !== l.id))}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            onChange([
              ...labels,
              {
                id: `lb-${Math.random().toString(36).slice(2, 8)}`,
                name: "New label",
                color: labelPalette[labels.length % labelPalette.length]!.color,
                ...(showProgress ? { progress: 50 } : {}),
              },
            ])
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add label
        </Button>
      </PopoverContent>
    </Popover>
  );
}
