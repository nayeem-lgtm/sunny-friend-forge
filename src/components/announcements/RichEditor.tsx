import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

export function RichEditor({
  value,
  onChange,
  placeholder = "Write your announcement…",
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(!value);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
      setEmpty(!ref.current.textContent?.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    const html = ref.current?.innerHTML ?? "";
    setEmpty(!ref.current?.textContent?.trim());
    onChange(html);
  };

  const run = (fn: () => void) => {
    ref.current?.focus();
    fn();
    sync();
  };

  const tool = (icon: React.ReactNode, title: string, action: () => void) => (
    <button
      key={title}
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => {
        e.preventDefault();
        run(action);
      }}
      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {icon}
    </button>
  );

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
        {tool(<Bold className="h-3.5 w-3.5" />, "Bold", () => exec("bold"))}
        {tool(<Italic className="h-3.5 w-3.5" />, "Italic", () => exec("italic"))}
        {tool(<UnderlineIcon className="h-3.5 w-3.5" />, "Underline", () => exec("underline"))}
        {tool(<Strikethrough className="h-3.5 w-3.5" />, "Strikethrough", () => exec("strikeThrough"))}
        {tool(<Highlighter className="h-3.5 w-3.5" />, "Highlight", () => exec("hiliteColor", "#fde68a"))}
        <Separator orientation="vertical" className="mx-1 h-4" />
        {tool(<Heading1 className="h-3.5 w-3.5" />, "Heading 1", () => exec("formatBlock", "<h2>"))}
        {tool(<Heading2 className="h-3.5 w-3.5" />, "Heading 2", () => exec("formatBlock", "<h3>"))}
        {tool(<Quote className="h-3.5 w-3.5" />, "Quote", () => exec("formatBlock", "<blockquote>"))}
        <Separator orientation="vertical" className="mx-1 h-4" />
        {tool(<List className="h-3.5 w-3.5" />, "Bulleted list", () => exec("insertUnorderedList"))}
        {tool(<ListOrdered className="h-3.5 w-3.5" />, "Numbered list", () => exec("insertOrderedList"))}
        {tool(<Minus className="h-3.5 w-3.5" />, "Divider", () => exec("insertHTML", "<hr/><p></p>"))}
        <Separator orientation="vertical" className="mx-1 h-4" />
        {tool(<Link2 className="h-3.5 w-3.5" />, "Insert link", () => {
          const url = window.prompt("Link URL", "https://");
          if (!url) return;
          const sel = window.getSelection();
          if (sel && sel.toString().trim()) exec("createLink", url);
          else exec("insertHTML", `<a href="${url}">${url}</a>&nbsp;`);
        })}
        {tool(<Unlink className="h-3.5 w-3.5" />, "Remove link", () => exec("unlink"))}
        <Separator orientation="vertical" className="mx-1 h-4" />
        {tool(<AlignLeft className="h-3.5 w-3.5" />, "Align left", () => exec("justifyLeft"))}
        {tool(<AlignCenter className="h-3.5 w-3.5" />, "Align center", () => exec("justifyCenter"))}
        {tool(<AlignRight className="h-3.5 w-3.5" />, "Align right", () => exec("justifyRight"))}
        <Separator orientation="vertical" className="mx-1 h-4" />
        {tool(<Undo2 className="h-3.5 w-3.5" />, "Undo", () => exec("undo"))}
        {tool(<Redo2 className="h-3.5 w-3.5" />, "Redo", () => exec("redo"))}
      </div>

      <div className="relative px-3 py-2">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          onBlur={sync}
          onPaste={(e) => {
            e.preventDefault();
            exec("insertText", e.clipboardData.getData("text/plain"));
            sync();
          }}
          className="prose-sm min-h-40 max-w-none text-sm outline-none [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_hr]:my-3 [&_hr]:border-border [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
        />
        {empty ? (
          <span className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground">
            {placeholder}
          </span>
        ) : null}
      </div>
    </div>
  );
}
