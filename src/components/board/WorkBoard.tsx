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
import { ItemPanel } from "@/components/board/ItemPanel";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Board, Group, Item, Subitem } from "@/lib/board-data";
import { itemProgress } from "@/lib/board-data";
import { cn } from "@/lib/utils";

const COLS =
  "grid grid-cols-[minmax(240px,1fr)_56px_120px_140px_130px_120px_120px_72px_72px_140px_40px] items-center";

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
    updates: [],
    activity: [
      {
        id: `ac-${id}`,
        actor: "Arlene Lane",
        action: "created this item",
        at: new Date().toISOString(),
      },
    ],
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

  const patchItem = (
    groupId: string,
    itemId: string,
    patch: Partial<Item>,
    activity?: { action: string; from?: string; to?: string },
  ) =>
    patchGroup(groupId, (g) => ({
      ...g,
      items: g.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              ...patch,
              activity: activity
                ? [
                    ...i.activity,
                    {
                      id: `ac-${Math.random().toString(36).slice(2, 9)}`,
                      actor: "Arlene Lane",
                      at: new Date().toISOString(),
                      ...activity,
                    },
                  ]
                : i.activity,
            }
          : i,
      ),
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
                    group.items.reduce((a, i) => a + itemProgress(i, board.statusLabels), 0) / group.items.length,
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
                <div className="text-center">Chat</div>
                <div className="text-center">Assignee</div>
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
                      <button
                        type="button"
                        onClick={() => setOpenItem({ groupId: group.id, itemId: item.id })}
                        title="Open updates"
                        className="relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-primary"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {item.updates.length > 0 ? (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                            {item.updates.length}
                          </span>
                        ) : null}
                      </button>
                      <div>
                        <PeopleCell
                          value={item.ownerIds}
                          onChange={(v) => patchItem(group.id, item.id, { ownerIds: v })}
                        />
                      </div>
                      <StatusCell
                        value={item.status}
                        labels={board.statusLabels}
                        onChange={(v) =>
                          patchItem(group.id, item.id, { status: v }, {
                            action: "changed status",
                            from: item.status,
                            to: v,
                          })
                        }
                      />
                      <PriorityCell
                        value={item.priority}
                        labels={board.priorityLabels}
                        onChange={(v) =>
                          patchItem(group.id, item.id, { priority: v }, {
                            action: "changed priority",
                            from: item.priority,
                            to: v,
                          })
                        }
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
                      <ProgressBar value={itemProgress(item, board.statusLabels)} />
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
                            <div />
                            <PeopleCell
                              value={sub.ownerIds}
                              onChange={(v) => patchSub(group.id, item.id, sub.id, { ownerIds: v })}
                            />
                            <StatusCell
                              value={sub.status}
                              labels={board.statusLabels}
                              onChange={(v) => patchSub(group.id, item.id, sub.id, { status: v })}
                            />
                            <PriorityCell
                              value={sub.priority}
                              labels={board.priorityLabels}
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

      <ItemPanel
        open={!!active}
        item={active?.item ?? null}
        group={active?.group ?? null}
        statusLabels={board.statusLabels}
        priorityLabels={board.priorityLabels}
        onPatch={(patch, activity) =>
          active ? patchItem(active.group.id, active.item.id, patch, activity) : undefined
        }
        onClose={() => setOpenItem(null)}
      />
    </div>
  );
}

