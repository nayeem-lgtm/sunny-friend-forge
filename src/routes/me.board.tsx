import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FolderKanban, Users } from "lucide-react";

import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useEmployeeSession } from "@/lib/employee-session";
import { employees } from "@/lib/employee-data";
import {
  createSeedBoards,
  itemProgress,
  initials,
  workspaces,
  type Board,
  type Item,
} from "@/lib/board-data";
import { formatDate } from "@/lib/leave-data";

export const Route = createFileRoute("/me/board")({
  head: () => ({
    meta: [
      { title: "My Workboard — OmniWork Employee Portal" },
      {
        name: "description",
        content: "The workboard for your department with every task, owner, timeline and status.",
      },
      { property: "og:title", content: "My Workboard — OmniWork Employee Portal" },
      {
        property: "og:description",
        content: "See your department's boards and the tasks assigned to you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function OwnerStack({ ids }: { ids: string[] }) {
  return (
    <div className="flex -space-x-2">
      {ids.map((id) => {
        const e = employees.find((x) => x.id === id);
        const name = e ? `${e.firstName} ${e.lastName}` : "Unassigned";
        return (
          <Avatar key={id} className="size-6 border border-background" title={name}>
            <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
          </Avatar>
        );
      })}
    </div>
  );
}

function ItemRow({ item, board, mine }: { item: Item; board: Board; mine: boolean }) {
  const progress = itemProgress(item, board.statusLabels);
  return (
    <div
      className={cn(
        "grid grid-cols-1 items-center gap-3 border-b border-border/60 px-4 py-3 text-sm last:border-0 md:grid-cols-[1fr_120px_110px_150px_130px_110px]",
        mine && "bg-primary/5",
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          {item.code} · {item.subitems.length} subitem{item.subitems.length === 1 ? "" : "s"}
        </p>
      </div>
      <StatusPill status={item.status} />
      <StatusPill status={item.priority} />
      <span className="text-xs text-muted-foreground">
        {formatDate(item.startDate.slice(0, 10))} → {formatDate(item.dueDate.slice(0, 10))}
      </span>
      <div>
        <Progress value={progress} className="h-2" />
        <span className="text-[11px] text-muted-foreground">{progress}% done</span>
      </div>
      <OwnerStack ids={item.ownerIds} />
    </div>
  );
}

function Page() {
  const { employee } = useEmployeeSession();
  const [boardId, setBoardId] = useState<string | null>(null);

  const boards = useMemo(() => {
    const ws = workspaces.find((w) => w.name === employee.department);
    const all = createSeedBoards();
    const scoped = all.filter(
      (b) =>
        (ws && b.workspaceId === ws.id) ||
        b.groups.some((g) => g.items.some((i) => i.department === employee.department)),
    );
    return scoped.length ? scoped : all.filter((b) => b.privacy === "Main");
  }, [employee.department]);

  const active = boards.find((b) => b.id === boardId) ?? boards[0];

  const myItems = useMemo(
    () =>
      boards.flatMap((b) =>
        b.groups.flatMap((g) =>
          g.items
            .filter((i) => i.ownerIds.includes(employee.id))
            .map((i) => ({ item: i, board: b, group: g.name })),
        ),
      ),
    [boards, employee.id],
  );

  const totalItems = boards.reduce(
    (s, b) => s + b.groups.reduce((n, g) => n + g.items.length, 0),
    0,
  );

  return (
    <EmployeeShell>
      <PageHeader
        title="Workboard"
        description={`You can only see boards for the ${employee.department}.`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={FolderKanban} label="Department boards" value={boards.length} caption={employee.department} />
        <StatCard icon={Users} label="Tasks on my boards" value={totalItems} caption="Across all groups" />
        <StatCard
          icon={Users}
          label="Assigned to me"
          value={myItems.length}
          caption="Items where you are an assignee"
          highlight
        />
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Department board</TabsTrigger>
          <TabsTrigger value="mine">My tasks ({myItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {boards.map((b) => (
              <button
                key={b.id}
                onClick={() => setBoardId(b.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  active?.id === b.id
                    ? "border-primary bg-primary/15 font-medium text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {b.icon} {b.name}
              </button>
            ))}
          </div>

          {active && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{active.description}</p>
              {active.groups.map((g) => (
                <section key={g.id} className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                    <span className={cn("size-2.5 rounded-full", g.color)} />
                    <h2 className="text-sm font-semibold">{g.name}</h2>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {g.items.length} items
                    </Badge>
                  </div>
                  {g.items.map((i) => (
                    <ItemRow
                      key={i.id}
                      item={i}
                      board={active}
                      mine={i.ownerIds.includes(employee.id)}
                    />
                  ))}
                  {g.items.length === 0 && (
                    <p className="px-4 py-6 text-sm text-muted-foreground">No items in this group.</p>
                  )}
                </section>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {myItems.map(({ item, board, group }) => (
              <div key={item.id}>
                <p className="px-4 pt-3 text-xs text-muted-foreground">
                  {board.name} · {group}
                </p>
                <ItemRow item={item} board={board} mine />
              </div>
            ))}
            {myItems.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Nothing is assigned to you on these boards right now.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </EmployeeShell>
  );
}
