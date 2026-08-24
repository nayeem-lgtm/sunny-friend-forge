import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { DateCell, NumberCell, PeopleCell, PriorityCell, ProgressBar, StatusCell, TextCell } from "@/components/board/cells";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Board, Group, Item, Subitem } from "@/lib/board-data";
import { boardPeople, initials, itemProgress, statusColor } from "@/lib/board-data";
import { cn } from "@/lib/utils";

const COLS =
  "grid grid-cols-[minmax(260px,1fr)_120px_140px_130px_120px_120px_72px_72px_140px_40px] items-center";

type Drag = { groupId: string; itemId: string } | null;

function newItem(): Item {
  const id = Math.random().toString(36).slice(2, 9);
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `it-${id}`,
    code: `RAY-${Math.floor(Math.random() * 900 + 100)}`,
    name: "New task",
    ownerIds: [],
    status: "Not Started",
    priority: "Medium",
    startDate: today,
    dueDate: today,
    estimatedHours: 8,
    actualHours: 0,
    department: "IT Department",
    tags: [],
    notes: "",
    subitems: [],
  };
}

function newSub(): Subitem {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `sb-${Math.random().toString(36).slice(2, 9)}`,
    name: "New subitem",
    ownerIds: [],
    status: "Not Started",
    priority: "Medium",
    startDate: today,
    dueDate: today,
    estimatedHours: 2,
    actualHours: 0,
  };
}

export function WorkBoard({
  board,
  onChange,
}: {
  board: Board;
  onChange: (updater: (b: Board) => Board) => void;
}) {
  const [drag, setDrag] = useState<Drag>(null);
  const [openItem, setOpenItem] = useState<{ groupId: string; itemId: string } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const patchGroup = (groupId: string, fn: (g: Group) => Group) =>
    onChange((b) => ({ ...b, groups: b.groups.map((g) => (g.id === groupId ? fn(g) : g)) }));

  const patchItem = (groupId: string, itemId: string, patch: Partial<Item>) =>
    patchGroup(groupId, (g) => ({
      ...g,
      items: g.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
    }));

  const patchSub = (groupId: string, itemId: string, subId: string, patch: Partial<Subitem>) =>
    patchGroup(groupId, (g) => ({
      ...g,
      items: g.items.map((i) =>
        i.id === itemId
          ? { ...i, subitems: i.subitems.map((s) => (s.id === subId ? { ...s, ...patch } : s)) }
          : i,
      ),
    }));

  const dropOn = (targetGroupId: string, targetItemId: string | null) => {
    if (!drag) return;
    onChange((b) => {
      let moved: Item | undefined;
      const stripped = b.groups.map((g) => {
        if (g.id !== drag.groupId) return g;
        moved = g.items.find((i) => i.id === drag.itemId);
        return { ...g, items: g.items.filter((i) => i.id !== drag.itemId) };
      });
      if (!moved) return b;
      return {
        ...b,
        groups: stripped.map((g) => {
          if (g.id !== targetGroupId) return g;
          const items = [...g.items];
          const idx = targetItemId ? items.findIndex((i) => i.id === targetItemId) : items.length;
          items.splice(idx < 0 ? items.length : idx, 0, moved as Item);
          return { ...g, items };
        }),
      };
    });
    setDrag(null);
  };

  const active = useMemo(() => {
    if (!openItem) return null;
    const g = board.groups.find((x) => x.id === openItem.groupId);
    const i = g?.items.find((x) => x.id === openItem.itemId);
    return g && i ? { group: g, item: i } : null;
  }, [openItem, board]);

  return (
    <div className="space-y-8">
      {board.groups.map((group) => (
        <section key={group.id} className="min-w-[1100px]">
          <header className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => patchGroup(group.id, (g) => ({ ...g, collapsed: !g.collapsed }))}
              className="text-muted-foreground hover:text-foreground"
            >
              {group.collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <span className={cn("h-3 w-3 rounded-sm", group.color)} />
            <Input
              value={group.name}
              onChange={(e) => patchGroup(group.id, (g) => ({ ...g, name: e.target.value }))}
              className="h-7 w-auto min-w-40 border-none bg-transparent px-1 text-sm font-semibold shadow-none focus-visible:ring-1"
            />
            <span className="text-xs text-muted-foreground">{group.items.length} items</span>
            <span className="text-xs text-muted-foreground">
              ·{" "}
              {group.items.length
                ? Math.round(
                    group.items.reduce((a, i) => a + itemProgress(i), 0) / group.items.length,
                  )
                : 0}
              % done
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 text-xs text-muted-foreground"
              onClick={() =>
                onChange((b) => ({ ...b, groups: b.groups.filter((g) => g.id !== group.id) }))
              }
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete group
            </Button>
          </header>

          {group.collapsed ? null : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className={cn(COLS, "border-b border-border bg-muted/40 px-2 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground")}
              >
                <div className="pl-8">Task</div>
                <div className="text-center">Owner</div>
                <div className="text-center">Status</div>
                <div className="text-center">Priority</div>
                <div className="text-center">Start</div>
                <div className="text-center">Due</div>
                <div className="text-center">Est</div>
                <div className="text-center">Act</div>
                <div className="text-center">Progress</div>
                <div />
              </div>

              {group.items.map((item) => {
                const isOpen = expanded[item.id];
                return (
                  <div key={item.id}>
                    <div
                      draggable
                      onDragStart={() => setDrag({ groupId: group.id, itemId: item.id })}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => dropOn(group.id, item.id)}
                      className={cn(
                        COLS,
                        "group border-b border-border/60 px-2 py-1 hover:bg-muted/30",
                      )}
                      style={{ borderLeft: "3px solid transparent" }}
                    >
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground/40 group-hover:text-muted-foreground" />
                        <button
                          type="button"
                          onClick={() => setExpanded((p) => ({ ...p, [item.id]: !p[item.id] }))}
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                          aria-label="Toggle subitems"
                        >
                          {isOpen ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <TextCell
                          value={item.name}
                          onChange={(v) => patchItem(group.id, item.id, { name: v })}
                        />
                        <button
                          type="button"
                          onClick={() => setOpenItem({ groupId: group.id, itemId: item.id })}
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                        >
                          Open
                        </button>
                      </div>
                      <div>
                        <PeopleCell
                          value={item.ownerIds}
                          onChange={(v) => patchItem(group.id, item.id, { ownerIds: v })}
                        />
                      </div>
                      <StatusCell
                        value={item.status}
                        onChange={(v) => patchItem(group.id, item.id, { status: v })}
                      />
                      <PriorityCell
                        value={item.priority}
                        onChange={(v) => patchItem(group.id, item.id, { priority: v })}
                      />
                      <DateCell
                        value={item.startDate}
                        onChange={(v) => patchItem(group.id, item.id, { startDate: v })}
                      />
                      <DateCell
                        value={item.dueDate}
                        overdue={item.status !== "Completed" && item.dueDate < new Date().toISOString().slice(0, 10)}
                        onChange={(v) => patchItem(group.id, item.id, { dueDate: v })}
                      />
                      <NumberCell
                        value={item.estimatedHours}
                        onChange={(v) => patchItem(group.id, item.id, { estimatedHours: v })}
                      />
                      <NumberCell
                        value={item.actualHours}
                        onChange={(v) => patchItem(group.id, item.id, { actualHours: v })}
                      />
                      <ProgressBar value={itemProgress(item)} />
                      <button
                        type="button"
                        aria-label="Delete task"
                        onClick={() =>
                          patchGroup(group.id, (g) => ({
                            ...g,
                            items: g.items.filter((i) => i.id !== item.id),
                          }))
                        }
                        className="text-muted-foreground/40 opacity-0 hover:text-destructive group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {isOpen ? (
                      <div className="border-b border-border/60 bg-muted/20 py-1 pl-10">
                        {item.subitems.map((sub) => (
                          <div key={sub.id} className={cn(COLS, "px-2 py-1")}>
                            <div className="flex items-center gap-1 pl-5">
                              <TextCell
                                value={sub.name}
                                onChange={(v) => patchSub(group.id, item.id, sub.id, { name: v })}
                                className="text-xs"
                              />
                            </div>
                            <PeopleCell
                              value={sub.ownerIds}
                              onChange={(v) => patchSub(group.id, item.id, sub.id, { ownerIds: v })}
                            />
                            <StatusCell
                              value={sub.status}
                              onChange={(v) => patchSub(group.id, item.id, sub.id, { status: v })}
                            />
                            <PriorityCell
                              value={sub.priority}
                              onChange={(v) => patchSub(group.id, item.id, sub.id, { priority: v })}
                            />
                            <DateCell
                              value={sub.startDate}
                              onChange={(v) => patchSub(group.id, item.id, sub.id, { startDate: v })}
                            />
                            <DateCell
                              value={sub.dueDate}
                              onChange={(v) => patchSub(group.id, item.id, sub.id, { dueDate: v })}
                            />
                            <NumberCell
                              value={sub.estimatedHours}
                              onChange={(v) =>
                                patchSub(group.id, item.id, sub.id, { estimatedHours: v })
                              }
                            />
                            <NumberCell
                              value={sub.actualHours}
                              onChange={(v) =>
                                patchSub(group.id, item.id, sub.id, { actualHours: v })
                              }
                            />
                            <div />
                            <button
                              type="button"
                              aria-label="Delete subitem"
                              onClick={() =>
                                patchItem(group.id, item.id, {
                                  subitems: item.subitems.filter((s) => s.id !== sub.id),
                                })
                              }
                              className="text-muted-foreground/40 hover:text-destructive"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            patchItem(group.id, item.id, { subitems: [...item.subitems, newSub()] })
                          }
                          className="ml-7 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          + Add subitem
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dropOn(group.id, null)}
                className="px-2 py-1"
              >
                <button
                  type="button"
                  onClick={() => patchGroup(group.id, (g) => ({ ...g, items: [...g.items, newItem()] }))}
                  className="w-full rounded px-8 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                >
                  + Add task
                </button>
              </div>
            </div>
          )}
        </section>
      ))}

      <Button
        variant="outline"
        onClick={() =>
          onChange((b) => ({
            ...b,
            groups: [
              ...b.groups,
              {
                id: `gr-${Math.random().toString(36).slice(2, 9)}`,
                name: "New group",
                color: "bg-primary",
                collapsed: false,
                items: [],
              },
            ],
          }))
        }
      >
        <Plus className="mr-1 h-4 w-4" /> Add new group
      </Button>

      <Sheet open={!!active} onOpenChange={(o) => !o && setOpenItem(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {active ? (
            <>
              <SheetHeader>
                <SheetTitle className="pr-6 text-left">{active.item.name}</SheetTitle>
                <p className="text-left text-xs text-muted-foreground">
                  {active.item.code} · {active.group.name} · {active.item.department}
                </p>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-8">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Status">
                    <span className={cn("inline-flex rounded px-2 py-1 text-xs", statusColor[active.item.status])}>
                      {active.item.status}
                    </span>
                  </Field>
                  <Field label="Priority">{active.item.priority}</Field>
                  <Field label="Timeline">
                    {active.item.startDate} → {active.item.dueDate}
                  </Field>
                  <Field label="Progress">{itemProgress(active.item)}%</Field>
                  <Field label="Estimated">{active.item.estimatedHours}h</Field>
                  <Field label="Actual">{active.item.actualHours}h</Field>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Owners</p>
                  <div className="flex flex-wrap gap-2">
                    {boardPeople()
                      .filter((p) => active.item.ownerIds.includes(p.id))
                      .map((p) => (
                        <span key={p.id} className="flex items-center gap-2 rounded-full border border-border px-2 py-1 text-xs">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-primary/15 text-[9px] text-primary">
                              {initials(`${p.firstName} ${p.lastName}`)}
                            </AvatarFallback>
                          </Avatar>
                          {p.firstName} {p.lastName}
                        </span>
                      ))}
                    {active.item.ownerIds.length === 0 ? (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Description</p>
                  <Textarea
                    value={active.item.notes}
                    placeholder="Add a description…"
                    onChange={(e) =>
                      patchItem(active.group.id, active.item.id, { notes: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    Subitems ({active.item.subitems.length})
                  </p>
                  <div className="space-y-1">
                    {active.item.subitems.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded border border-border px-2 py-1.5 text-sm">
                        <span className="truncate">{s.name}</span>
                        <span className={cn("rounded px-2 py-0.5 text-[10px]", statusColor[s.status])}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                    {active.item.subitems.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No subitems yet.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
