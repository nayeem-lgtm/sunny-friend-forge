import { useState } from "react";
import { FileText, ThumbsUp, X } from "lucide-react";

import { PeopleCell, PriorityCell, StatusCell } from "@/components/board/cells";
import { AddFieldButton, CustomFieldControl, DateField } from "@/components/board/ItemFields";
import { RichComposer } from "@/components/board/RichComposer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Group, Item, ItemUpdate, Label } from "@/lib/board-data";
import { initials } from "@/lib/board-data";
import { cn } from "@/lib/utils";

const CURRENT_USER = "Arlene Lane";

function now() {
  return new Date().toISOString();
}

function fmt(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ItemPanel({
  open,
  item,
  group,
  statusLabels,
  priorityLabels,
  onAddStatusLabel,
  onAddPriorityLabel,
  onPatch,
  onClose,
}: {
  open: boolean;
  item: Item | null;
  group: Group | null;
  statusLabels: Label[];
  priorityLabels: Label[];
  onAddStatusLabel?: (l: Label) => void;
  onAddPriorityLabel?: (l: Label) => void;
  onPatch: (patch: Partial<Item>, activity?: { action: string; from?: string; to?: string }) => void;
  onClose: () => void;
}) {
  const [replyTo, setReplyTo] = useState<string | null>(null);

  if (!item || !group) return null;

  const allFiles = item.updates.flatMap((u) => u.files.map((f) => ({ ...f, from: u.author })));

  const patchUpdate = (id: string, p: Partial<ItemUpdate>) =>
    onPatch({ updates: item.updates.map((u) => (u.id === id ? { ...u, ...p } : u)) });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="pr-8 text-left">{item.name}</SheetTitle>
          <p className="text-left text-xs text-muted-foreground">
            {item.code} · {group.name} · {item.department}
          </p>
        </SheetHeader>

        <div className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-2">
          <Field label="Status">
            <StatusCell
              value={item.status}
              labels={statusLabels}
              {...(onAddStatusLabel ? { onAddLabel: onAddStatusLabel } : {})}
              onChange={(v) =>
                onPatch({ status: v }, { action: "changed status", from: item.status, to: v })
              }
            />
          </Field>
          <Field label="Priority">
            <PriorityCell
              value={item.priority}
              labels={priorityLabels}
              {...(onAddPriorityLabel ? { onAddLabel: onAddPriorityLabel } : {})}
              onChange={(v) =>
                onPatch({ priority: v }, { action: "changed priority", from: item.priority, to: v })
              }
            />
          </Field>
          <Field label="Assignees">
            <div className="flex items-center gap-2">
              <PeopleCell
                value={item.ownerIds}
                onChange={(v) => onPatch({ ownerIds: v }, { action: "updated assignees" })}
              />
              <span className="text-xs text-muted-foreground">
                {item.ownerIds.length ? `${item.ownerIds.length} assigned` : "Assign people"}
              </span>
            </div>
          </Field>
          <Field label="Start date">
            <DateField
              value={item.startDate}
              onChange={(v) => onPatch({ startDate: v }, { action: "changed start date" })}
              placeholder="Start date"
            />
          </Field>
          <Field label="Due date">
            <DateField
              value={item.dueDate}
              onChange={(v) => onPatch({ dueDate: v }, { action: "changed due date" })}
              placeholder="Due date"
            />
          </Field>
          {(item.custom ?? []).map((f) => (
            <CustomFieldControl
              key={f.id}
              field={f}
              onChange={(value) =>
                onPatch(
                  {
                    custom: (item.custom ?? []).map((x) =>
                      x.id === f.id ? { ...x, value } : x,
                    ),
                  },
                  { action: `updated ${f.label}` },
                )
              }
              onRename={(label) =>
                onPatch({
                  custom: (item.custom ?? []).map((x) => (x.id === f.id ? { ...x, label } : x)),
                })
              }
              onRemove={() =>
                onPatch(
                  { custom: (item.custom ?? []).filter((x) => x.id !== f.id) },
                  { action: `removed field ${f.label}` },
                )
              }
            />
          ))}
          <AddFieldButton
            onAdd={(field) =>
              onPatch({ custom: [...(item.custom ?? []), field] }, {
                action: `added field ${field.label}`,
              })
            }
          />
        </div>

        <Tabs defaultValue="updates" className="flex-1 px-5 py-4">
          <TabsList>
            <TabsTrigger value="updates">Updates / {item.updates.length}</TabsTrigger>
            <TabsTrigger value="files">Files / {allFiles.length}</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="updates" className="space-y-4 pt-4">
            <RichComposer
              placeholder="Write an update and mention others with @"
              onPost={({ html, mentions, files }) => {
                const update: ItemUpdate = {
                  id: `up-${Math.random().toString(36).slice(2, 9)}`,
                  author: CURRENT_USER,
                  text: html,
                  mentions,
                  files,
                  likes: 0,
                  createdAt: now(),
                  replies: [],
                };
                onPatch({ updates: [update, ...item.updates] }, { action: "posted an update" });
              }}
            />

            {item.updates.map((u) => (
              <div key={u.id} className="rounded-lg border border-border">
                <div className="flex items-center gap-2 px-3 pt-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
                      {initials(u.author)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{u.author}</span>
                  <span className="text-xs text-muted-foreground">{fmt(u.createdAt)}</span>
                  <button
                    type="button"
                    aria-label="Delete update"
                    onClick={() => onPatch({ updates: item.updates.filter((x) => x.id !== u.id) })}
                    className="ml-auto text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div
                  className="px-3 py-2 text-sm [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: u.text }}
                />
                {u.files.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                    {u.files.map((f) => (
                      <span
                        key={f.id}
                        className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px]"
                      >
                        <FileText className="h-3 w-3" /> {f.name}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="flex items-center gap-3 border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => patchUpdate(u.id, { likes: u.likes + 1 })}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" /> Like {u.likes > 0 ? u.likes : ""}
                  </button>
                  <button
                    type="button"
                    className="hover:text-foreground"
                    onClick={() => setReplyTo(replyTo === u.id ? null : u.id)}
                  >
                    Reply
                  </button>
                </div>
                {u.replies.map((r) => (
                  <div key={r.id} className="border-t border-border px-3 py-2 pl-8 text-sm">
                    <span className="font-medium">{r.author}</span>{" "}
                    <span className="text-xs text-muted-foreground">{fmt(r.createdAt)}</span>
                    <div dangerouslySetInnerHTML={{ __html: r.text }} />
                  </div>
                ))}
                {replyTo === u.id ? (
                  <div className="border-t border-border p-2">
                    <RichComposer
                      compact
                      placeholder="Write a reply and mention others with @"
                      onPost={({ html }) => {
                        patchUpdate(u.id, {
                          replies: [
                            ...u.replies,
                            {
                              id: `rp-${Math.random().toString(36).slice(2, 9)}`,
                              author: CURRENT_USER,
                              text: html,
                              createdAt: now(),
                            },
                          ],
                        });
                        setReplyTo(null);
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ))}
            {item.updates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No updates yet.</p>
            ) : null}
          </TabsContent>

          <TabsContent value="files" className="space-y-2 pt-4">
            {allFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{f.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {Math.max(1, Math.round(f.size / 1024))} KB · {f.from}
                </span>
              </div>
            ))}
            {allFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No files attached yet.</p>
            ) : null}
          </TabsContent>

          <TabsContent value="activity" className="space-y-2 pt-4 pb-8">
            {[...item.activity].reverse().map((a) => (
              <div key={a.id} className="flex gap-2 rounded border border-border px-3 py-2 text-sm">
                <span className="font-medium">{a.actor}</span>
                <span className="text-muted-foreground">
                  {a.action}
                  {a.from ? ` from "${a.from}"` : ""}
                  {a.to ? ` to "${a.to}"` : ""}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{fmt(a.at)}</span>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-border p-2")}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
