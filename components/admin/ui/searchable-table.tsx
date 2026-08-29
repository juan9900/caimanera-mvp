"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/admin/ui/data-table";

/** `DataTable` with a client-side text filter above it, matched against `getSearchText(row)`. */
export function SearchableTable<T>({
  columns,
  rows,
  getRowKey,
  getSearchText,
  placeholder,
  empty,
  emptyFiltered,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  getSearchText: (row: T) => string;
  placeholder: string;
  empty: React.ReactNode;
  emptyFiltered?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? rows.filter((row) => getSearchText(row).toLowerCase().includes(normalized))
    : rows;

  return (
    <div>
      {rows.length > 0 && (
        <div className="relative mb-3 max-w-xs">
          <Search aria-hidden size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-md border border-zinc-300 py-1.5 pl-8 pr-3 text-sm text-zinc-900 focus:border-green-600 focus:outline-none"
          />
        </div>
      )}
      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={getRowKey}
        empty={normalized ? (emptyFiltered ?? "Sin resultados.") : empty}
      />
    </div>
  );
}
