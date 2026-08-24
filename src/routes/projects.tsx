import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Folder, FolderPlus, Layout, Plus, Search, Star } from "lucide-react";

import { WorkBoard } from "@/components/board/WorkBoard";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Board, Folder as FolderType } from "@/lib/board-data";
import { createSeedBoards, seedFolders, workspaces } from "@/lib/board-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Work Board — Ray ERP" },
      {
        name: "description",
        content: "Workspaces, folders, boards, groups, tasks and subitems in one work board.",
      },
      { property: "og:title", content: "Work Board — Ray ERP" },
      {
        property: "og:description",
        content: "Plan and track every project across Ray's departments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const [boards, setBoards] = useState<Board[]>(() => createSeedBoards());
  const [folders, setFolders] = useState<FolderType[]>(() => seedFolders);
  const [workspaceId, setWorkspaceId] = useState(workspaces[4].id);
  const [activeBoardId, setActiveBoardId] = useState("bd-roadmap");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ "fd-q1": true });
  const [query, setQuery] = useState("");

  const wsBoards = useMemo(
    () => boards.filter((b) => b.workspaceId === workspaceId),
    [boards, workspaceId],
  );
  const wsFolders = folders.filter((f) => f.workspaceId === workspaceId);
  const looseBoards = wsBoards.filter((b) => !b.folderId);
  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? boards[0];

  const filteredBoard = useMemo(() => {
    if (!query.trim()) return activeBoard;
    const q = query.toLowerCase();
    return {
      ...activeBoard,
      groups: activeBoard.groups.map((g) => ({
        ...g,
        items: g.items.filter(
          (i) => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q),
        ),
      })),
    };
  }, [activeBoard, query]);

  const updateBoard = (updater: (b: Board) => Board) =>
    setBoards((prev) => prev.map((b) => (b.id === activeBoard.id ? updater(b) : b)));

  const addBoard = (folderId: string | null) => {
    const id = `bd-${Math.random().toString(36).slice(2, 8)}`;
    setBoards((prev) => [
      ...prev,
      {
        id,
        name: "New board",
        description: "",
        icon: "◇",
        privacy: "Main",
        folderId,
        workspaceId,
        favorite: false,
        groups: [
          { id: `gr-${id}-1`, name: "To-Do", color: "bg-primary", collapsed: false, items: [] },
          { id: `gr-${id}-2`, name: "Completed", color: "bg-success", collapsed: false, items: [] },
        ],
      },
    ]);
    setActiveBoardId(id);
  };

  const stats = useMemo(() => {
    const items = activeBoard.groups.flatMap((g) => g.items);
    return {
      total: items.length,
      done: items.filter((i) => i.status === "Completed").length,
      blocked: items.filter((i) => i.status === "Blocked").length,
      overdue: items.filter(
        (i) => i.status !== "Completed" && i.dueDate < new Date().toISOString().slice(0, 10),
      ).length,
    };
  }, [activeBoard]);

  return (
    <AppShell>
      <PageHeader
        title="Work Board"
        description="Workspaces, folders, boards, groups, tasks and subitems."
      />

      <div className="flex flex-col gap-4 lg:flex-row">
        <aside className="w-full shrink-0 space-y-3 rounded-xl border border-border bg-card p-3 lg:w-64">
          <Select
            value={workspaceId}
            onValueChange={(v) => {
              setWorkspaceId(v);
              const first = boards.find((b) => b.workspaceId === v);
              if (first) setActiveBoardId(first.id);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.icon} {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-1">
            {wsFolders.map((f) => {
              const inFolder = wsBoards.filter((b) => b.folderId === f.id);
              const open = openFolders[f.id];
              return (
                <div key={f.id}>
                  <button
                    type="button"
                    onClick={() => setOpenFolders((p) => ({ ...p, [f.id]: !p[f.id] }))}
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    {open ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{f.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{inFolder.length}</span>
                  </button>
                  {open
                    ? inFolder.map((b) => (
                        <BoardLink
                          key={b.id}
                          board={b}
                          active={b.id === activeBoard.id}
                          nested
                          onClick={() => setActiveBoardId(b.id)}
                        />
                      ))
                    : null}
                </div>
              );
            })}

            {looseBoards.map((b) => (
              <BoardLink
                key={b.id}
                board={b}
                active={b.id === activeBoard.id}
                onClick={() => setActiveBoardId(b.id)}
              />
            ))}
          </div>

          <div className="flex gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => addBoard(null)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Board
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setFolders((p) => [
                  ...p,
                  { id: `fd-${Math.random().toString(36).slice(2, 8)}`, name: "New folder", workspaceId },
                ])
              }
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {activeBoard.icon} {activeBoard.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {activeBoard.description || "No description"} · {activeBoard.privacy} board
                </p>
              </div>
              <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
                <span>{stats.total} tasks</span>
                <span className="text-success">{stats.done} done</span>
                <span className="text-destructive">{stats.blocked} blocked</span>
                <span className="text-warning">{stats.overdue} overdue</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks"
                  className="pl-8"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setBoards((prev) =>
                    prev.map((b) => (b.id === activeBoard.id ? { ...b, favorite: !b.favorite } : b)),
                  )
                }
              >
                <Star
                  className={cn("h-4 w-4", activeBoard.favorite && "fill-warning text-warning")}
                />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto pb-4">
            <WorkBoard board={filteredBoard} onChange={updateBoard} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function BoardLink({
  board,
  active,
  nested,
  onClick,
}: {
  board: Board;
  active: boolean;
  nested?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm hover:bg-muted",
        nested && "pl-7",
        active && "bg-primary/10 text-primary",
      )}
    >
      <Layout className="h-4 w-4 opacity-70" />
      <span className="truncate">{board.name}</span>
      {board.favorite ? <Star className="ml-auto h-3 w-3 fill-warning text-warning" /> : null}
    </button>
  );
}
