import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, ChevronLeft, ChevronRight, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HolidayCalendar, HolidayLegend } from "@/components/holidays/HolidayCalendar";
import { HolidayHighlights } from "@/components/holidays/HolidayHighlights";
import {
  durationDays,
  formatRange,
  holidayTypeTone,
  holidayTypes,
  sortHolidays,
  useHolidays,
  type Holiday,
  type HolidayType,
} from "@/lib/holiday-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/holidays")({
  head: () => ({
    meta: [
      { title: "Holiday Calendar — OmniWork" },
      { name: "description", content: "Publish, edit and postpone the company holiday calendar." },
      { property: "og:title", content: "Holiday Calendar — OmniWork" },
      { property: "og:description", content: "Publish, edit and postpone the company holiday calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Draft = {
  name: string;
  start: string;
  end: string;
  type: HolidayType;
  greeting: string;
  note: string;
};

const emptyDraft = (year: number): Draft => ({
  name: "",
  start: `${year}-01-01`,
  end: `${year}-01-01`,
  type: "Public",
  greeting: "",
  note: "",
});

function Page() {
  const { holidays, add, update, remove, postpone, reset } = useHolidays();
  const [year, setYear] = useState(new Date().getFullYear());
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Holiday | null>(null);
  const [postponing, setPostponing] = useState<Holiday | null>(null);
  const [postponeTo, setPostponeTo] = useState({ start: "", end: "" });

  const list = useMemo(
    () => sortHolidays(holidays.filter((h) => h.start.startsWith(String(year)))),
    [holidays, year],
  );

  const openAdd = () => {
    setEditing(null);
    setDraft(emptyDraft(year));
  };

  const openEdit = (h: Holiday) => {
    setEditing(h);
    setDraft({
      name: h.name,
      start: h.start,
      end: h.end,
      type: h.type,
      greeting: h.greeting ?? "",
      note: h.note ?? "",
    });
  };

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Give the holiday a name.");
      return;
    }
    const end = draft.end < draft.start ? draft.start : draft.end;
    const payload = { ...draft, end, name: draft.name.trim() };
    if (editing) {
      update(editing.id, payload);
      toast.success("Holiday updated");
    } else {
      add(payload);
      toast.success("Holiday added");
    }
    setDraft(null);
    setEditing(null);
  };

  return (
    <AppShell>
      <PageHeader
        title="Holiday Calendar"
        description="Employees see this calendar read-only — you can add, edit, postpone or remove any holiday."
      />

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <Button variant="ghost" size="icon" onClick={() => setYear((y) => y - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-14 text-center text-sm font-medium">{year}</span>
            <Button variant="ghost" size="icon" onClick={() => setYear((y) => y + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { reset(year); toast.success(`Default ${year} holidays restored`); }}>
              <RotateCcw className="mr-2 size-4" /> Load defaults
            </Button>
            <Button onClick={openAdd}>
              <Plus className="mr-2 size-4" /> Add holiday
            </Button>
          </div>
        </div>

        <HolidayHighlights holidays={holidays} year={year} />

        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="manage">Manage ({list.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <HolidayLegend />
            <HolidayCalendar year={year} holidays={holidays} onSelectHoliday={openEdit} />
          </TabsContent>

          <TabsContent value="manage">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {list.map((h) => (
                <div
                  key={h.id}
                  className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0"
                >
                  <div className="min-w-48 flex-1">
                    <p className="text-sm font-medium">{h.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRange(h)} · {durationDays(h)} day{durationDays(h) === 1 ? "" : "s"}
                      {h.postponedFrom && h.postponedFrom !== h.start ? " · postponed" : ""}
                    </p>
                  </div>
                  <Badge variant="secondary" className={cn("ring-1", holidayTypeTone[h.type])}>
                    {h.type}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPostponing(h);
                        setPostponeTo({ start: h.start, end: h.end });
                      }}
                    >
                      <CalendarClock className="mr-1.5 size-4" /> Postpone
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(h)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(h)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {!list.length && (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  No holidays for {year} yet.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit holiday" : "Add holiday"}</DialogTitle>
            <DialogDescription>Employees will see this on their holiday calendar instantly.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Holiday name</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Eid-ul-Fitr"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={draft.start}
                    onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End date</Label>
                  <Input
                    type="date"
                    value={draft.end}
                    onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select
                    value={draft.type}
                    onValueChange={(v) => setDraft({ ...draft, type: v as HolidayType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {holidayTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Greeting</Label>
                <Input
                  value={draft.greeting}
                  onChange={(e) => setDraft({ ...draft, greeting: e.target.value })}
                  placeholder="Eid Mubarak to you and your family!"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Internal note (optional)</Label>
                <Textarea
                  rows={2}
                  value={draft.note}
                  onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save}>{editing ? "Save changes" : "Add holiday"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!postponing} onOpenChange={(o) => !o && setPostponing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Postpone {postponing?.name}</DialogTitle>
            <DialogDescription>Pick the new dates — the original date is kept for reference.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>New start</Label>
              <Input
                type="date"
                value={postponeTo.start}
                onChange={(e) => setPostponeTo({ ...postponeTo, start: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>New end</Label>
              <Input
                type="date"
                value={postponeTo.end}
                onChange={(e) => setPostponeTo({ ...postponeTo, end: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostponing(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!postponing) return;
                const end = postponeTo.end < postponeTo.start ? postponeTo.start : postponeTo.end;
                postpone(postponing.id, postponeTo.start, end);
                setPostponing(null);
                toast.success("Holiday postponed");
              }}
            >
              Postpone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the holiday from every employee calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) remove(deleting.id);
                setDeleting(null);
                toast.success("Holiday deleted");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
