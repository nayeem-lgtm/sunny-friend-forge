import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  FileText,
  Megaphone,
  Paperclip,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { RichEditor } from "@/components/announcements/RichEditor";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  type Announcement,
  type AnnouncementCategory,
  type AnnouncementFile,
  announcementCategories,
  audiences,
  categoryStyles,
  formatBytes,
  formatDateTime,
  initialAnnouncements,
  relativeTime,
  stripHtml,
} from "@/lib/announcement-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — OmniWork" },
      {
        name: "description",
        content: "Create, format, publish and manage company-wide announcements with attachments.",
      },
      { property: "og:title", content: "Announcements — OmniWork" },
      {
        property: "og:description",
        content: "Create, format, publish and manage company-wide announcements with attachments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Draft = {
  title: string;
  html: string;
  category: AnnouncementCategory;
  audience: string;
  pinned: boolean;
  files: AnnouncementFile[];
};

const emptyDraft: Draft = {
  title: "",
  html: "",
  category: "General",
  audience: "Everyone",
  pinned: false,
  files: [],
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Page() {
  const [items, setItems] = useState<Announcement[]>(initialAnnouncements);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [audience, setAudience] = useState<string>("all");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [viewing, setViewing] = useState<Announcement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((a) => (category === "all" ? true : a.category === category))
      .filter((a) => (audience === "all" ? true : a.audience === audience))
      .filter((a) =>
        q ? `${a.title} ${stripHtml(a.html)} ${a.author}`.toLowerCase().includes(q) : true,
      )
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [items, search, category, audience]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setDraft({
      title: a.title,
      html: a.html,
      category: a.category,
      audience: a.audience,
      pinned: a.pinned,
      files: a.files,
    });
    setOpen(true);
  };

  const addFiles = (list: FileList | null) => {
    const files = Array.from(list ?? []).map((f) => ({
      id: `fl-${Math.random().toString(36).slice(2, 9)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
    }));
    if (files.length) setDraft((d) => ({ ...d, files: [...d.files, ...files] }));
  };

  const save = () => {
    if (!draft.title.trim()) {
      toast.error("Add a title for the announcement.");
      return;
    }
    if (!stripHtml(draft.html) && draft.files.length === 0) {
      toast.error("Write something or attach a file.");
      return;
    }
    if (editing) {
      setItems((prev) =>
        prev.map((a) =>
          a.id === editing.id
            ? { ...a, ...draft, title: draft.title.trim(), updatedAt: new Date().toISOString() }
            : a,
        ),
      );
      toast.success("Announcement updated");
    } else {
      setItems((prev) => [
        {
          id: `an-${Math.random().toString(36).slice(2, 9)}`,
          ...draft,
          title: draft.title.trim(),
          author: "Nayeem Ahmad",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast.success("Announcement published");
    }
    setOpen(false);
    setEditing(null);
    setDraft(emptyDraft);
  };

  const togglePin = (a: Announcement) => {
    setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, pinned: !x.pinned } : x)));
    toast.success(a.pinned ? "Unpinned" : "Pinned to top");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Announcement deleted");
  };

  const stats = [
    { label: "Total", value: items.length },
    { label: "Pinned", value: items.filter((a) => a.pinned).length },
    { label: "Urgent", value: items.filter((a) => a.category === "Urgent").length },
    { label: "Attachments", value: items.reduce((s, a) => s + a.files.length, 0) },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Announcements"
        description="Share company updates with rich formatting, links and attachments."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> New announcement
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements…"
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {announcementCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={audience} onValueChange={setAudience}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Audience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All audiences</SelectItem>
            {audiences.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
            <Megaphone className="h-6 w-6" />
            No announcements match your filters.
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" /> Create one
            </Button>
          </div>
        ) : (
          filtered.map((a) => (
            <article
              key={a.id}
              onClick={() => setViewing(a)}
              className={cn(
                "group cursor-pointer rounded-xl border border-border bg-card p-4 transition hover:border-primary/50",
                a.pinned && "border-primary/40 bg-primary/[0.04]",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/15 text-xs text-primary">
                      {initials(a.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-semibold">{a.title}</h2>
                      {a.pinned ? (
                        <Badge variant="outline" className="gap-1 border-primary/50 text-primary">
                          <Pin className="h-3 w-3" /> Pinned
                        </Badge>
                      ) : null}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          categoryStyles[a.category],
                        )}
                      >
                        {a.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.author} · {relativeTime(a.createdAt)} · {a.audience}
                      {a.updatedAt ? " · edited" : ""}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {stripHtml(a.html)}
                    </p>
                    {a.files.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {a.files.map((f) => (
                          <span
                            key={f.id}
                            className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                          >
                            <FileText className="h-3 w-3" />
                            {f.name} · {formatBytes(f.size)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div
                  className="flex items-center gap-1 opacity-70 transition group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon" title="Pin" onClick={() => togglePin(a)}>
                    {a.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(a)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(a)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Composer */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit announcement" : "New announcement"}</DialogTitle>
            <DialogDescription>
              Format your message, add links and attach files before publishing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="an-title">Title</Label>
              <Input
                id="an-title"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="e.g. Eid holiday schedule announced"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={draft.category}
                  onValueChange={(v) => setDraft((d) => ({ ...d, category: v as AnnouncementCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {announcementCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Audience</Label>
                <Select
                  value={draft.audience}
                  onValueChange={(v) => setDraft((d) => ({ ...d, audience: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {audiences.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Message</Label>
              <RichEditor
                value={draft.html}
                onChange={(html) => setDraft((d) => ({ ...d, html }))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Attachments</Label>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Paperclip className="mr-1.5 h-3.5 w-3.5" /> Upload files
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
                className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground"
              >
                Drag & drop files here, or use Upload files
              </div>
              {draft.files.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {draft.files.map((f) => (
                    <span
                      key={f.id}
                      className="flex items-center gap-1.5 rounded border border-border px-2 py-1 text-[11px]"
                    >
                      <FileText className="h-3 w-3" />
                      {f.name} · {formatBytes(f.size)}
                      <button
                        type="button"
                        aria-label={`Remove ${f.name}`}
                        onClick={() =>
                          setDraft((d) => ({ ...d, files: d.files.filter((x) => x.id !== f.id) }))
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">Pin to top</p>
                <p className="text-xs text-muted-foreground">Keep this announcement above others.</p>
              </div>
              <Switch
                checked={draft.pinned}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, pinned: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>{editing ? "Save changes" : "Publish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Viewer */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {viewing ? (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.title}</DialogTitle>
                <DialogDescription>
                  {viewing.author} · {formatDateTime(viewing.createdAt)} · {viewing.audience}
                </DialogDescription>
              </DialogHeader>
              <div
                className="prose-sm max-w-none text-sm [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_hr]:my-3 [&_hr]:border-border [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: viewing.html }}
              />
              {viewing.files.length > 0 ? (
                <div className="space-y-1.5">
                  {viewing.files.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" /> {f.name}
                        <span className="text-muted-foreground">{formatBytes(f.size)}</span>
                      </span>
                      {f.url ? (
                        <a
                          href={f.url}
                          download={f.name}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              <DialogFooter>
                <Button variant="outline" onClick={() => openEdit(viewing)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeleteTarget(viewing);
                    setViewing(null);
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget?.title}” will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
