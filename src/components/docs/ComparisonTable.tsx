import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ComparisonRow {
  /** Stable key for React. */
  readonly id: string;
  /** Row header, then one cell for each remaining column. */
  readonly header: ReactNode;
  readonly cells: readonly ReactNode[];
}

export interface ComparisonTableProps {
  /** Names the table and its scroll region for assistive tech. It is not shown on screen. */
  readonly caption: string;
  /** Header of the row-header column, then of each remaining column. */
  readonly columns: readonly string[];
  readonly rows: readonly ComparisonRow[];
  readonly className?: string;
}

/**
 * A comparison as a real table, so a screen reader announces each cell with its row and column.
 * It scrolls sideways inside its own frame on a narrow screen instead of squeezing its text.
 */
export function ComparisonTable({ caption, columns, rows, className }: ComparisonTableProps): ReactNode {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className={cn("overflow-x-auto rounded-panel border border-border", className)}
    >
      <table className="w-full min-w-[46rem] border-collapse text-left text-sm leading-relaxed">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-2 text-fg">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-3 align-bottom font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-fg-muted">
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row" className="px-4 py-3 align-top font-semibold text-fg">
                {row.header}
              </th>
              {row.cells.map((cell, index) => (
                <td key={columns[index + 1] ?? index} className="px-4 py-3 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
