import { useEffect, useRef, useState } from "react";
import { MessagesSquare, SendHorizonal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatCommentTime, type LeaveComment, type LeaveCommentRole } from "@/lib/leave-thread-store";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function LeaveConversation({
  messages,
  viewerRole,
  viewerName,
  onSend,
  placeholder,
  className,
}: {
  messages: LeaveComment[];
  viewerRole: LeaveCommentRole;
  viewerName: string;
  onSend: (text: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const send = () => {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
  };

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-4 py-3">
        <MessagesSquare className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Conversation</p>
        <span className="ml-auto text-xs text-muted-foreground">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="max-h-72 min-h-32 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No messages yet — start the conversation below.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.role === viewerRole;
          return (
            <div key={m.id} className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  m.role === "admin" ? "bg-info/20 text-info" : "bg-primary/15 text-primary",
                )}
              >
                {initials(m.author)}
              </span>
              <div className={cn("max-w-[80%] space-y-1", mine && "items-end text-right")}>
                <div className={cn("flex items-center gap-2 text-[11px] text-muted-foreground", mine && "justify-end")}>
                  <span className="font-medium text-foreground">{m.author}</span>
                  <span>{formatCommentTime(m.at)}</span>
                </div>
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-2xl border px-3 py-2 text-sm leading-relaxed",
                    mine
                      ? "rounded-br-sm border-primary/30 bg-primary/12 text-foreground"
                      : "rounded-bl-sm border-border bg-secondary/50 text-foreground",
                  )}
                >
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder={placeholder ?? `Write a message as ${viewerName}…`}
            className="min-h-11 resize-none"
          />
          <Button size="icon" className="size-10 shrink-0" disabled={!text.trim()} onClick={send} aria-label="Send message">
            <SendHorizonal className="size-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">Press ⌘/Ctrl + Enter to send</p>
      </div>
    </div>
  );
}
