import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { WorkBoard } from "@/components/board/WorkBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEmployeeSession } from "@/lib/employee-session";
import { createSeedBoards, workspaces, type Board } from "@/lib/board-data";

export const Route = createFileRoute("/me/board")({
  head: () => ({
    meta: [
      { title: "My Workboard — OmniWork Employee Portal" },
      {
        name: "description",
        content: "The workboard for your department with every task, assignee, timing and status.",
      },
      { property: "og:title", content: "My Workboard — OmniWork Employee Portal" },
      {
        property: "og:description",
        content: "See your department's board and the tasks assigned to you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { employee } = useEmployeeSession();
  const [allBoards, setAllBoards] = useState<Board[]>(() => createSeedBoards());
  const [query, setQuery] = useState("");
  const [mineOnly, setMineOnly] = useState(false);

  const deptBoards = useMemo(() => {
    const ws = workspaces.find((w) => w.name === employee.department);
    const scoped = allBoards.filter(
      (b) =>
        (ws && b.workspaceId === ws.id) ||
        b.groups.some((g) => g.items.some((i) => i.department === employee.department)),
    );
    return scoped.length ? scoped : allBoards.filter((b) => b.privacy === "Main");
  }, [allBoards, employee.department]);

  const board = deptBoards[0]!;

  const filteredBoard = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && !mineOnly) return board;
    return {
      ...board,
      groups: board.groups.map((g) => ({
        ...g,
        items: g.items.filter(
          (i) =>
            (!q || i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)) &&
            (!mineOnly || i.ownerIds.includes(employee.id)),
        ),
      })),
    };
  }, [board, query, mineOnly, employee.id]);

  const updateBoard = (updater: (b: Board) => Board) =>
    setAllBoards((prev) => prev.map((b) => (b.id === board.id ? updater(b) : b)));

  const stats = useMemo(() => {
    const items = board.groups.flatMap((g) => g.items);
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: items.length,
      mine: items.filter((i) => i.ownerIds.includes(employee.id)).length,
      done: items.filter((i) => i.status === "Completed").length,
      blocked: items.filter((i) => i.status === "Blocked").length,
      overdue: items.filter((i) => i.status !== "Completed" && i.dueDate.slice(0, 10) < today)
        .length,
    };
  }, [board, employee.id]);

  return (
    <EmployeeShell>
      <PageHeader
        title="Workboard"
        description={`You can only see the workboard for the ${employee.department}.`}
      />

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {board.icon} {board.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {board.description || "No description"} · {employee.department}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
              <span>{stats.total} tasks</span>
              <span className="text-primary">{stats.mine} mine</span>
              <span className="text-success">{stats.done} done</span>
              <span className="text-destructive">{stats.blocked} blocked</span>
              <span className="text-warning">{stats.overdue} overdue</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
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
              variant={mineOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setMineOnly((p) => !p)}
              className={cn(!mineOnly && "text-muted-foreground")}
            >
              My tasks ({stats.mine})
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <WorkBoard board={filteredBoard} onChange={updateBoard} />
        </div>
      </div>
    </EmployeeShell>
  );
}
