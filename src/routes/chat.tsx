import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Paperclip,
  ImagePlus,
  Send,
  AtSign,
  X,
  Download,
  Pin,
  Trash2,
  Search,
  Smile,
  Reply,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  chatPeople,
  currentUser,
  formatSize,
  initials,
  loadMessages,
  parseMentions,
  readFileAsAttachment,
  saveMessages,
  type ChatAttachment,
  type ChatMessage,
} from "@/lib/chat-store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Omni Chat By Ray — OmniWork" },
      {
        name: "description",
        content: "Company-wide chat room for Ray employees with file sharing, photos and @mentions.",
      },
      { property: "og:title", content: "Omni Chat By Ray — OmniWork" },
      {
        property: "og:description",
        content: "Company-wide chat room for Ray employees with file sharing, photos and @mentions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const REACTIONS = ["👍", "🎉", "❤️", "👀", "✅"];

function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages());
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [search, setSearch] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [lightbox, setLightbox] = useState<ChatAttachment | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const persist = (next: ChatMessage[]) => {
    setMessages(next);
    saveMessages(next);
  };

  const filtered = useMemo(
    () =>
      messages.filter(
        (m) =>
          !search ||
          m.text.toLowerCase().includes(search.toLowerCase()) ||
          m.authorName.toLowerCase().includes(search.toLowerCase()),
      ),
    [messages, search],
  );
  const pinned = messages.filter((m) => m.pinned);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filtered.length]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const parsed = await Promise.all(Array.from(files).map(readFileAsAttachment));
      setAttachments((prev) => [...prev, ...parsed]);
    } catch {
      toast.error("Could not attach that file");
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    const match = /@([\w ]{0,20})$/.exec(value);
    setMentionQuery(match ? (match[1] ?? "") : null);
  };

  const applyMention = (name: string) => {
    setText((prev) => prev.replace(/@([\w ]{0,20})$/, `@${name} `));
    setMentionQuery(null);
    textRef.current?.focus();
  };

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.trim().toLowerCase();
    return chatPeople.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [mentionQuery]);

  const send = () => {
    if (!text.trim() && attachments.length === 0) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      text: text.trim(),
      mentions: parseMentions(text),
      attachments,
      createdAt: new Date().toISOString(),
      reactions: {},
      ...(replyTo ? { replyToId: replyTo.id } : {}),
    };
    persist([...messages, msg]);
    setText("");
    setAttachments([]);
    setReplyTo(null);
    if (msg.mentions.length) toast.success(`Notified ${msg.mentions.join(", ")}`);
  };

  const react = (id: string, emoji: string) => {
    persist(
      messages.map((m) => {
        if (m.id !== id) return m;
        const users = m.reactions[emoji] ?? [];
        const mine = users.includes(currentUser.id);
        const next = { ...m.reactions, [emoji]: mine ? users.filter((u) => u !== currentUser.id) : [...users, currentUser.id] };
        if (next[emoji]!.length === 0) delete next[emoji];
        return { ...m, reactions: next };
      }),
    );
  };

  const togglePin = (id: string) =>
    persist(messages.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)));

  const remove = (id: string) => persist(messages.filter((m) => m.id !== id));

  return (
    <AppShell>
      <PageHeader
        title="Omni Chat By Ray"
        description="One company-wide chat room for every employee — share documents, photos and mention teammates."
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="w-56 pl-8"
              placeholder="Search messages"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="flex h-[calc(100vh-260px)] min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-card">
          {pinned.length > 0 && (
            <div className="flex items-start gap-2 border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
              <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="space-y-1">
                {pinned.map((m) => (
                  <p key={m.id} className="line-clamp-1">
                    <span className="font-medium text-foreground">{m.authorName}:</span> {m.text}
                  </p>
                ))}
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {filtered.map((m) => {
                const mine = m.authorId === currentUser.id;
                const parent = m.replyToId ? messages.find((x) => x.id === m.replyToId) : undefined;
                return (
                  <div key={m.id} className={cn("group flex gap-3", mine && "flex-row-reverse")}>
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-xs">{initials(m.authorName)}</AvatarFallback>
                    </Avatar>
                    <div className={cn("max-w-[75%] space-y-1", mine && "items-end text-right")}>
                      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", mine && "justify-end")}>
                        <span className="font-medium text-foreground">{m.authorName}</span>
                        <span>
                          {new Date(m.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {parent && (
                        <div className="rounded-md border-l-2 border-primary/60 bg-muted/40 px-2 py-1 text-left text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{parent.authorName}</span>{" "}
                          <span className="line-clamp-1">{parent.text}</span>
                        </div>
                      )}
                      {m.text && (
                        <div
                          className={cn(
                            "inline-block whitespace-pre-wrap rounded-xl px-3 py-2 text-left text-sm",
                            mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                          )}
                        >
                          <MessageText text={m.text} />
                        </div>
                      )}
                      {m.attachments.length > 0 && (
                        <div className={cn("flex flex-wrap gap-2", mine && "justify-end")}>
                          {m.attachments.map((a) =>
                            a.isImage ? (
                              <button
                                key={a.id}
                                onClick={() => setLightbox(a)}
                                className="overflow-hidden rounded-lg border border-border"
                              >
                                <img src={a.dataUrl} alt={a.name} className="h-32 w-auto object-cover" />
                              </button>
                            ) : (
                              <a
                                key={a.id}
                                href={a.dataUrl}
                                download={a.name}
                                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-xs hover:bg-muted"
                              >
                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                <span className="max-w-[160px] truncate">{a.name}</span>
                                <span className="text-muted-foreground">{formatSize(a.size)}</span>
                                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                              </a>
                            ),
                          )}
                        </div>
                      )}
                      <div className={cn("flex flex-wrap items-center gap-1", mine && "justify-end")}>
                        {Object.entries(m.reactions).map(([emoji, users]) => (
                          <button
                            key={emoji}
                            onClick={() => react(m.id, emoji)}
                            className="rounded-full border border-border bg-background px-2 py-0.5 text-xs"
                          >
                            {emoji} {users.length}
                          </button>
                        ))}
                        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          {REACTIONS.map((e) => (
                            <button
                              key={e}
                              onClick={() => react(m.id, e)}
                              className="rounded p-1 text-xs hover:bg-muted"
                              aria-label={`React ${e}`}
                            >
                              {e}
                            </button>
                          ))}
                          <button className="rounded p-1 hover:bg-muted" onClick={() => setReplyTo(m)} aria-label="Reply">
                            <Reply className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button className="rounded p-1 hover:bg-muted" onClick={() => togglePin(m.id)} aria-label="Pin">
                            <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          {mine && (
                            <button className="rounded p-1 hover:bg-muted" onClick={() => remove(m.id)} aria-label="Delete">
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="relative border-t border-border p-3">
            {replyTo && (
              <div className="mb-2 flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-xs">
                <span className="line-clamp-1">
                  Replying to <span className="font-medium">{replyTo.authorName}</span>: {replyTo.text}
                </span>
                <button onClick={() => setReplyTo(null)} aria-label="Cancel reply">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
                    {a.isImage ? (
                      <img src={a.dataUrl} alt={a.name} className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <Paperclip className="h-3.5 w-3.5" />
                    )}
                    <span className="max-w-[140px] truncate">{a.name}</span>
                    <button
                      onClick={() => setAttachments((p) => p.filter((x) => x.id !== a.id))}
                      aria-label="Remove attachment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {mentionMatches.length > 0 && (
              <div className="absolute bottom-full left-3 mb-2 w-64 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                {mentionMatches.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyMention(p.name)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.department}</span>
                  </button>
                ))}
              </div>
            )}

            <Textarea
              ref={textRef}
              rows={2}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Message everyone at Ray… use @ to mention a teammate"
              className="resize-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                  <Paperclip className="mr-1.5 h-4 w-4" /> Document
                </Button>
                <Button variant="ghost" size="sm" onClick={() => imageRef.current?.click()}>
                  <ImagePlus className="mr-1.5 h-4 w-4" /> Photo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleTextChange(`${text}@`);
                    textRef.current?.focus();
                  }}
                >
                  <AtSign className="mr-1.5 h-4 w-4" /> Mention
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setText((t) => `${t}🙂`)}>
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={send} disabled={!text.trim() && attachments.length === 0}>
                <Send className="mr-2 h-4 w-4" /> Send
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                void onFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                void onFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <aside className="hidden rounded-xl border border-border bg-card p-4 lg:block">
          <h2 className="text-sm font-semibold">Members</h2>
          <p className="mb-3 text-xs text-muted-foreground">{chatPeople.length} employees in this room</p>
          <ScrollArea className="h-[calc(100vh-360px)] pr-2">
            <div className="space-y-2">
              {chatPeople.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px]">{initials(p.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.department}</p>
                  </div>
                  {p.id === currentUser.id && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      You
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-6"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox.dataUrl} alt={lightbox.name} className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </AppShell>
  );
}

function MessageText({ text }: { text: string }) {
  const names = chatPeople.map((p) => p.name).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`@(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        names.includes(part) ? (
          <span key={i} className="rounded bg-primary/20 px-1 font-medium text-primary">
            @{part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
