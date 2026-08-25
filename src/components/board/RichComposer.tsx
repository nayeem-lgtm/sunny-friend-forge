import { useEffect, useRef, useState } from "react";
import {
  AlignLeft,
  AtSign,
  Bold,
  CheckCircle2,
  FileText,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Paperclip,
  Pilcrow,
  Send,
  Smile,
  Strikethrough,
  Table,
  Underline as UnderlineIcon,
  Wand2,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { UpdateFile } from "@/lib/board-data";
import { boardPeople, initials } from "@/lib/board-data";
import { cn } from "@/lib/utils";

const EMOJIS = ["👍", "🎉", "🔥", "✅", "🚀", "😀", "😅", "🙏", "💡", "⚠️", "❤️", "👀", "📌", "⏰", "💬", "📈"];

function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

export function RichComposer({
  onPost,
  placeholder = "Write an update…",
  compact = false,
  initialHtml,
  submitLabel = "Update",
}: {
  onPost: (payload: { html: string; mentions: string[]; files: UpdateFile[] }) => void;
  placeholder?: string;
  compact?: boolean;
  initialHtml?: string;
  submitLabel?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [empty, setEmpty] = useState(!initialHtml);
  const [mentions, setMentions] = useState<string[]>([]);
  const [files, setFiles] = useState<UpdateFile[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const people = boardPeople();

  useEffect(() => {
    if (initialHtml && editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialHtml;
      setEmpty(!editorRef.current.textContent?.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (expanded) editorRef.current?.focus();
  }, [expanded]);

  const insertHtml = (html: string) => {
    editorRef.current?.focus();
    exec("insertHTML", html);
    setEmpty(!editorRef.current?.textContent?.trim());
  };

  const post = () => {
    const html = editorRef.current?.innerHTML ?? "";
    const text = editorRef.current?.textContent?.trim() ?? "";
    if (!text && files.length === 0) return;
    onPost({ html, mentions, files });
    if (editorRef.current) editorRef.current.innerHTML = "";
    setMentions([]);
    setFiles([]);
    setEmpty(true);
  };

  const tool = (
    icon: React.ReactNode,
    title: string,
    action: () => void,
    active?: boolean,
  ) => (
    <button
      key={title}
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        action();
      }}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground",
      )}
    >
      {icon}
    </button>
  );

  return (
    <div
      onClick={() => !expanded && setExpanded(true)}
      className={cn(
        "rounded-xl border border-border bg-card transition",
        expanded ? "ring-1 ring-primary/40" : "cursor-text hover:border-primary/40",
      )}
    >
      {expanded ? (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
          {tool(<Pilcrow className="h-3.5 w-3.5" />, "Paragraph", () => exec("formatBlock", "<p>"))}
          {tool(<Bold className="h-3.5 w-3.5" />, "Bold", () => exec("bold"))}
          {tool(<Italic className="h-3.5 w-3.5" />, "Italic", () => exec("italic"))}
          {tool(<UnderlineIcon className="h-3.5 w-3.5" />, "Underline", () => exec("underline"))}
          {tool(<Strikethrough className="h-3.5 w-3.5" />, "Strikethrough", () => exec("strikeThrough"))}
          {tool(<Highlighter className="h-3.5 w-3.5" />, "Highlight", () => exec("hiliteColor", "#fde68a"))}
          {tool(<Wand2 className="h-3.5 w-3.5" />, "Text color", () => exec("foreColor", "#22c55e"))}
          <Separator orientation="vertical" className="mx-1 h-4" />
          {tool(<List className="h-3.5 w-3.5" />, "Bulleted list", () => exec("insertUnorderedList"))}
          {tool(<ListOrdered className="h-3.5 w-3.5" />, "Numbered list", () => exec("insertOrderedList"))}
          {tool(<Table className="h-3.5 w-3.5" />, "Table", () =>
            insertHtml(
              '<table style="border-collapse:collapse" border="1"><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></table><p></p>',
            ),
          )}
          {tool(<Link2 className="h-3.5 w-3.5" />, "Link", () => {
            const url = window.prompt("Link URL");
            if (url) exec("createLink", url);
          })}
          <Separator orientation="vertical" className="mx-1 h-4" />
          {tool(<AlignLeft className="h-3.5 w-3.5" />, "Align left", () => exec("justifyLeft"))}
          {tool(<Minus className="h-3.5 w-3.5" />, "Divider", () => insertHtml("<hr/><p></p>"))}
          {tool(<CheckCircle2 className="h-3.5 w-3.5" />, "Checklist", () => insertHtml("☑ "))}
        </div>
      ) : null}

      <div className="relative px-3 py-2">
        <div
          ref={editorRef}
          contentEditable={expanded}
          suppressContentEditableWarning
          onInput={() => setEmpty(!editorRef.current?.textContent?.trim())}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              post();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            exec("insertText", text);
            setEmpty(!editorRef.current?.textContent?.trim());
          }}
          data-placeholder={placeholder}
          className={cn(
            "prose-sm max-w-none text-sm outline-none [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
            expanded ? (compact ? "min-h-14" : "min-h-24") : "min-h-6",
          )}
        />
        {empty ? (
          <span className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground">
            {placeholder}
          </span>
        ) : null}
      </div>

      {files.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
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

      {expanded ? (
        <div className="flex items-center gap-1 border-t border-border px-2 py-1.5">
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
                      insertHtml(
                        `<span style="color:var(--primary)" data-mention="${p.id}">@${name}</span>&nbsp;`,
                      );
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

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2" title="Emoji">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="grid grid-cols-8 gap-1">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className="rounded p-1 text-base hover:bg-muted"
                    onClick={() => insertHtml(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button size="sm" className="ml-auto h-8" onClick={post}>
            <Send className="mr-1 h-3.5 w-3.5" /> {submitLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
