import { useEffect, useRef, useState } from "react";
import { FileText, ImageIcon, MessagesSquare, Paperclip, SendHorizonal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  formatCommentTime,
  type LeaveAttachment,
  type LeaveComment,
  type LeaveCommentRole,
} from "@/lib/leave-thread-store";

const MAX_FILE_BYTES = 3 * 1024 * 1024;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFile(file: File) {
  return new Promise<LeaveAttachment | null>((resolve) => {
    if (file.size > MAX_FILE_BYTES) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: `la-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: String(reader.result ?? ""),
      });
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function AttachmentBubble({ file }: { file: LeaveAttachment }) {
  const isImage = file.type.startsWith("image/");
  if (isImage) {
    return (
      <a href={file.url} target="_blank" rel="noreferrer" className="block">
        <img
          src={file.url}
          alt={file.name}
          className="max-h-44 w-full rounded-lg border border-border object-cover"
        />
      </a>
    );
  }
  return (
    <a
      href={file.url}
      download={file.name}
      className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-xs hover:bg-muted"
    >
      <FileText className="size-3.5 shrink-0 text-primary" />
      <span className="truncate">{file.name}</span>
      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{formatSize(file.size)}</span>
    </a>
  );
}

export function LeaveComments({
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
  onSend: (text: string, attachments: LeaveAttachment[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState<LeaveAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const addFiles = async (list: FileList | File[] | null) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    const parsed = await Promise.all(files.map(readFile));
    const ok = parsed.filter((f): f is LeaveAttachment => !!f);
    if (ok.length < files.length) setError(`Some files were skipped (max ${formatSize(MAX_FILE_BYTES)} each).`);
    else setError(null);
    if (ok.length) setPending((p) => [...p, ...ok]);
  };

  const send = () => {
    const value = text.trim();
    if (!value && pending.length === 0) return;
    onSend(value, pending);
    setText("");
    setPending([]);
    setError(null);
  };

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-4 py-3">
        <MessagesSquare className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Comments</p>
        <span className="ml-auto text-xs text-muted-foreground">
          {messages.length} comment{messages.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="max-h-72 min-h-32 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No comments yet — add a comment below.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.role === viewerRole;
          const files = m.attachments ?? [];
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
                {m.text ? (
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
                ) : null}
                {files.length > 0 ? (
                  <div className="space-y-1.5 text-left">
                    {files.map((f) => (
                      <AttachmentBubble key={f.id} file={f} />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3">
        {pending.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {pending.map((f) => (
              <span
                key={f.id}
                className="flex max-w-[220px] items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2 py-1 text-[11px]"
              >
                {f.type.startsWith("image/") ? (
                  <ImageIcon className="size-3 shrink-0 text-primary" />
                ) : (
                  <FileText className="size-3 shrink-0 text-primary" />
                )}
                <span className="truncate">{f.name}</span>
                <span className="text-muted-foreground">{formatSize(f.size)}</span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setPending((p) => p.filter((x) => x.id !== f.id))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={(e) => {
              const files = Array.from(e.clipboardData.files ?? []);
              if (files.length) {
                e.preventDefault();
                void addFiles(files);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder={placeholder ?? `Add a comment as ${viewerName}…`}
            className="min-h-11 resize-none"
          />
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="icon"
            className="size-10 shrink-0"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach file or screenshot"
            title="Attach file or screenshot"
          >
            <Paperclip className="size-4" />
          </Button>
          <Button
            size="icon"
            className="size-10 shrink-0"
            disabled={!text.trim() && pending.length === 0}
            onClick={send}
            aria-label="Add comment"
          >
            <SendHorizonal className="size-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {error ?? "Press ⌘/Ctrl + Enter to send · attach or paste screenshots and files"}
        </p>
      </div>
    </div>
  );
}
