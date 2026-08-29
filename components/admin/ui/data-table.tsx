export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  render: (row: T) => React.ReactNode;
}

const ALIGN_CLASSES: Record<NonNullable<DataTableColumn<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

/** Generic admin table: real `<table>` markup, horizontally scrollable, with an empty state. */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  empty,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  empty: React.ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-500">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-500 ${ALIGN_CLASSES[col.align ?? "left"]} ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="border-t border-zinc-100 hover:bg-zinc-50">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-zinc-800 ${ALIGN_CLASSES[col.align ?? "left"]} ${col.className ?? ""}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
