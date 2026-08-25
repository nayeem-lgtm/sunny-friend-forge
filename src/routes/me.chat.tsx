import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AtSign, Download, ImagePlus, Paperclip, Reply, Search, Send, X } from "lucide-react";
import { toast } from "sonner";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useEmployeeSession } from "@/lib/employee-session";
import {
  chatPeople,
  formatSize,
  initials,
  loadMessages,
  parseMentions,
  readFileAsAttachment,
  saveMessages,
  type ChatAttachment,
  type ChatMessage,
} from "@/lib/chat-store";

export const Route = createFileRoute("/me/chat")({
  head: () => ({
    meta: [
      { title: "Omni Chat By Ray — OmniWork Employee Portal" },
      {
        name: "description",
        content: "The company-wide chat room where every OmniWork employee can talk, share files and mention teammates.",
      },
      { property: "og:title", content: "Omni Chat By Ray — OmniWork Employee Portal" },
      {
        property: "og:description",
        content: "Chat with the whole company, attach documents and photos, and mention colleagues.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const REACTIONS = ["👍", "🎉", "❤️", "✅"];

function MessageText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(@[\w]+(?: [\w]+)?)/g).map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="rounded bg-primary/20 px-1 font-medium text-primary">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function Page() {
  const { employee, name } = useEmployeeSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [search, setSearch] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadMessages());
  }, []);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filtered.length]);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.trim().toLowerCase();
    return chatPeople.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [mentionQuery]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const parsed = await Promise.all(Array.from(files).map(readFileAsAttachment));
      setAttachments((prev) => [...prev, ...parsed]);
    } catch {
      toast.error("Could not attach that file");
    }
  };

  const send = () => {
    if (!text.trim() && attachments.length === 0) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      authorId: employee.id,
      authorName: name,
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
  };

  const react = (id: string, emoji: string) =>
    persist(
      messages.map((m) => {
        if (m.id !== id) return m;
        const users = m.reactions[emoji] ?? [];
        const mine = users.includes(employee.id);
        const next = {
          ...m.reactions,
          [emoji]: mine ? users.filter((u) => u !== employee.id) : [...users, employee.id],
        };
        if (next[emoji]!.length === 0) delete next[emoji];
        return { ...m, reactions: next };
      }),
    );

  return (
    <EmployeeShell>
      <PageHeader
        title="Omni Chat By Ray"
        description="One room for the whole company — share documents, photos and mention teammates."
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="w-52 pl-8"
              placeholder="Search messages"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      <div className="flex h-[calc(100vh-250px)] min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-card">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {filtered.map((m) => {
              const mine = m.authorId === employee.id;
              const parent = m.replyToId ? messages.find((x) => x.id === m.replyToId) : undefined;
              return (
                <div key={m.id} className={cn("group flex gap-3", mine && "flex-row-reverse")}>
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback className="text-xs">{initials(m.authorName)}</AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[75%] space-y-1", mine && "text-right")}>
                    <div
                      className={cn(
                        "flex items-center gap-2 text-xs text-muted-foreground",
                        mine && "justify-end",
                      )}
                    >
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
                            <img
                              key={a.id}
                              src={a.dataUrl}
                              alt={a.name}
                              className="h-32 w-auto rounded-lg border border-border object-cover"
                            />
                          ) : (
                            <a
                              key={a.id}
                              href={a.dataUrl}
                              download={a.name}
                              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-xs hover:bg-muted"
                            >
                              <Paperclip className="size-4 text-muted-foreground" />
                              <span className="max-w-[160px] truncate">{a.name}</span>
                              <span className="text-muted-foreground">{formatSize(a.size)}</span>
                              <Download className="size-3.5 text-muted-foreground" />
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
                      <span className="opacity-0 transition-opacity group-hover:opacity-100">
                        {REACTIONS.map((e) => (
                          <button
                            key={e}
                            onClick={() => react(m.id, e)}
                            className="px-1 text-xs"
                            aria-label={`React ${e}`}
                          >
                            {e}
                          </button>
                        ))}
                        <button
                          onClick={() => setReplyTo(m)}
                          className="px-1 text-muted-foreground"
                          aria-label="Reply"
                        >
                          <Reply className="inline size-3.5" />
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border p-3">
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-xs">
              <Reply className="size-3.5" />
              Replying to <span className="font-medium">{replyTo.authorName}</span>
              <button onClick={() => setReplyTo(null)} className="ml-auto" aria-label="Cancel reply">
                <X className="size-3.5" />
              </button>
            </div>
          )}
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((a) => (
                <span
                  key={a.id}
                  className="flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs"
                >
                  {a.name}
                  <button
                    onClick={() => setAttachments((p) => p.filter((x) => x.id !== a.id))}
                    aria-label="Remove attachment"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {mentionMatches.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {mentionMatches.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setText((prev) => prev.replace(/@([\w ]{0,20})$/, `@${p.name} `));
                    setMentionQuery(null);
                  }}
                  className="rounded-full border border-border px-2 py-1 text-xs hover:bg-muted"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={text}
              rows={2}
              placeholder={`Message the company as ${name}…`}
              onChange={(e) => {
                setText(e.target.value);
                const match = /@([\w ]{0,20})$/.exec(e.target.value);
                setMentionQuery(match ? (match[1] ?? "") : null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
              className="min-h-[44px] flex-1 resize-none"
            />
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              onChange={(e) => onFiles(e.target.files)}
            />
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => onFiles(e.target.files)}
            />
            <Button variant="outline" size="icon" onClick={() => fileRef.current?.click()} aria-label="Attach file">
              <Paperclip className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => imageRef.current?.click()} aria-label="Attach photo">
              <ImagePlus className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setText((t) => `${t}@`)}
              aria-label="Mention someone"
            >
              <AtSign className="size-4" />
            </Button>
            <Button onClick={send} aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Cmd/Ctrl + Enter to send · @ to mention a teammate
          </p>
        </div>
      </div>
    </EmployeeShell>
  );
}
