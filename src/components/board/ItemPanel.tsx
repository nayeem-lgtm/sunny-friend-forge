import { useRef, useState } from "react";
import { AtSign, FileText, Paperclip, Send, ThumbsUp, X } from "lucide-react";

import { PeopleCell, PriorityCell, StatusCell } from "@/components/board/cells";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Group, Item, ItemUpdate, Label, UpdateFile } from "@/lib/board-data";
import { boardPeople, initials, itemProgress } from "@/lib/board-data";
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
  onPatch,
  onClose,
}: {
  open: boolean;
  item: Item | null;
  group: Group | null;
  statusLabels: Label[];
  priorityLabels: Label[];
  onPatch: (patch: Partial<Item>, activity?: { action: string; from?: string; to?: string }) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [files, setFiles] = useState<UpdateFile[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const people = boardPeople();

  if (!item || !group) return null;

  const allFiles = item.updates.flatMap((u) => u.files.map((f) => ({ ...f, from: u.author })));

  const post = () => {
    if (!draft.trim() && files.length === 0) return;
    const update: ItemUpdate = {
      id: `up-${Math.random().toString(36).slice(2, 9)}`,
      author: CURRENT_USER,
      text: draft.trim(),
      mentions,
      files,
      likes: 0,
      createdAt: now(),
      replies: [],
    };
    onPatch({ updates: [update, ...item.updates] }, { action: "posted an update" });
    setDraft("");
    setMentions([]);
    setFiles([]);
  };

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
              onChange={(v) =>
                onPatch({ status: v }, { action: "changed status", from: item.status, to: v })
              }
            />
          </Field>
          <Field label="Priority">
            <PriorityCell
              value={item.priority}
              labels={priorityLabels}
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
          <Field label="Timeline">
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={item.startDate}
                onChange={(e) =>
                  onPatch({ startDate: e.target.value }, { action: "changed start date" })
                }
                className="h-8 text-xs"
              />
              <Input
                type="date"
                value={item.dueDate}
                onChange={(e) => onPatch({ dueDate: e.target.value }, { action: "changed due date" })}
                className="h-8 text-xs"
              />
            </div>
          </Field>
          <Field label="Progress">{itemProgress(item, statusLabels)}%</Field>
          <Field label="Hours">
            {item.actualHours}h actual / {item.estimatedHours}h estimated
          </Field>
        </div>

        <Tabs defaultValue="updates" className="flex-1 px-5 py-4">
          <TabsList>
            <TabsTrigger value="updates">Updates / {item.updates.length}</TabsTrigger>
            <TabsTrigger value="files">Files / {allFiles.length}</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="updates" className="space-y-4 pt-4">
            <div className="rounded-lg border border-border p-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write an update and mention others with @"
                rows={3}
                className="border-none shadow-none focus-visible:ring-0"
              />
              {files.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                  {files.map((f) => (
                    <span
                      key={f.id}
                      className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px]"
                    >
                      <FileText className="h-3 w-3" />
                      {f.name}
                      <button
                        type="button"
                        aria-label="Remove file"
                        onClick={() => setFiles((p) => p.filter((x) => x.id !== f.id))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center gap-1 border-t border-border px-1 pt-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2" title="Mention">
                      <AtSign className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="max-h-64 w-60 overflow-y-auto p-1" align="start">
                    {people.map((p) => {
                      const name = `${p.firstName} ${p.lastName}`;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setDraft((d) => `${d}${d && !d.endsWith(" ") ? " " : ""}@${name} `);
                            setMentions((m) => (m.includes(p.id) ? m : [...m, p.id]));
                          }}
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
                              {initials(name)}
                            </AvatarFallback>
                          </Avatar>
                          {name}
                        </button>
                      );
                    })}
                  </PopoverContent>
                </Popover>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  title="Attach files"
                  onClick={() => fileRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => {
                    const list = Array.from(e.target.files ?? []).map((f) => ({
                      id: `fl-${Math.random().toString(36).slice(2, 9)}`,
                      name: f.name,
                      size: f.size,
                      type: f.type,
                    }));
                    setFiles((p) => [...p, ...list]);
                    e.target.value = "";
                  }}
                />
                <Button size="sm" className="ml-auto h-8" onClick={post}>
                  <Send className="mr-1 h-3.5 w-3.5" /> Update
                </Button>
              </div>
            </div>

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
                <p className="whitespace-pre-wrap px-3 py-2 text-sm">
                  {u.text.split(/(@[\w]+\s?[\w]*)/g).map((chunk, i) =>
                    chunk.startsWith("@") ? (
                      <span key={i} className="font-medium text-primary">
                        {chunk}
                      </span>
                    ) : (
                      <span key={i}>{chunk}</span>
                    ),
                  )}
                </p>
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
                    <p>{r.text}</p>
                  </div>
                ))}
                {replyTo === u.id ? (
                  <div className="flex items-center gap-2 border-t border-border p-2">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply and mention others with @"
                      className="h-8"
                    />
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        if (!replyText.trim()) return;
                        patchUpdate(u.id, {
                          replies: [
                            ...u.replies,
                            {
                              id: `rp-${Math.random().toString(36).slice(2, 9)}`,
                              author: CURRENT_USER,
                              text: replyText.trim(),
                              createdAt: now(),
                            },
                          ],
                        });
                        setReplyText("");
                        setReplyTo(null);
                      }}
                    >
                      Reply
                    </Button>
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
