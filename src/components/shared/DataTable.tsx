import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, MoreHorizontal, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Column<T> = {
  key: string;
  header: string;
  /** value used for sorting / searching */
  accessor?: (row: T) => string | number;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  className?: string;
};

export type RowAction<T> = {
  label: string;
  onSelect?: (row: T) => void;
  destructive?: boolean;
};

export type TableFilter = {
  key: string;
  label: string;
  options: string[];
};

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  filters = [],
  filterAccessor,
  actions,
  emptyMessage = "No records found.",
  toolbar,
}: {
  data: T[];
  columns: Column<T>[];
  filters?: TableFilter[];
  filterAccessor?: (row: T, key: string) => string;
  actions?: RowAction<T>[];
  emptyMessage?: string;
  toolbar?: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [colSearch, setColSearch] = useState<Record<string, string>>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const value = (row: T, col: Column<T>) => {
    const v = col.accessor ? col.accessor(row) : (row[col.key] as string | number | undefined);
    return v === undefined || v === null ? "" : String(v);
  };

  const filtered = useMemo(() => {
    let rows = data;

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        columns.some((c) => value(row, c).toLowerCase().includes(q)),
      );
    }

    for (const [key, q] of Object.entries(colSearch)) {
      if (!q.trim()) continue;
      const col = columns.find((c) => c.key === key);
      if (!col) continue;
      rows = rows.filter((row) => value(row, col).toLowerCase().includes(q.toLowerCase()));
    }

    for (const [key, val] of Object.entries(activeFilters)) {
      if (!val || val === "all") continue;
      rows = rows.filter((row) =>
        filterAccessor
          ? filterAccessor(row, key) === val
          : String(row[key] ?? "") === val,
      );
    }

    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        rows = [...rows].sort((a, b) => {
          const av = col.accessor ? col.accessor(a) : (a[col.key] as string | number);
          const bv = col.accessor ? col.accessor(b) : (b[col.key] as string | number);
          if (typeof av === "number" && typeof bv === "number") {
            return sort.dir === "asc" ? av - bv : bv - av;
          }
          return sort.dir === "asc"
            ? String(av).localeCompare(String(bv))
            : String(bv).localeCompare(String(av));
        });
      }
    }

    return rows;
  }, [data, columns, search, colSearch, activeFilters, sort, filterAccessor]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key: string) =>
    setSort((prev) =>
      prev?.key === key
        ? prev.dir === "asc"
          ? { key, dir: "desc" }
          : null
        : { key, dir: "asc" },
    );

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search all columns..."
            className="h-9 pl-9"
          />
        </div>
        {filters.map((f) => (
          <Select
            key={f.key}
            value={activeFilters[f.key] ?? "all"}
            onValueChange={(v) => {
              setActiveFilters((prev) => ({ ...prev, [f.key]: v }));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {f.label}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        {toolbar && <div className="ml-auto flex items-center gap-2">{toolbar}</div>}
      </div>

      <div className="scrollbar-slim overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn("px-4 py-3 align-top font-medium text-muted-foreground", col.className)}
                >
                  <button
                    type="button"
                    disabled={col.sortable === false}
                    onClick={() => col.sortable !== false && toggleSort(col.key)}
                    className={cn(
                      "flex items-center gap-1 text-xs uppercase tracking-wide",
                      col.sortable !== false && "hover:text-foreground",
                    )}
                  >
                    {col.header}
                    {col.sortable !== false &&
                      (sort?.key === col.key ? (
                        sort.dir === "asc" ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-40" />
                      ))}
                  </button>
                  {col.searchable && (
                    <Input
                      value={colSearch[col.key] ?? ""}
                      onChange={(e) => {
                        setColSearch((p) => ({ ...p, [col.key]: e.target.value }));
                        setPage(1);
                      }}
                      placeholder={`Search`}
                      className="mt-2 h-7 text-xs font-normal"
                    />
                  )}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
            {paged.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.className)}>
                    {col.cell ? col.cell(row) : value(row, col)}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((a) => (
                          <DropdownMenuItem
                            key={a.label}
                            onSelect={() => a.onSelect?.(row)}
                            className={cn(a.destructive && "text-destructive")}
                          >
                            {a.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>
            {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-border p-1.5 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-md border border-border p-1.5 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
