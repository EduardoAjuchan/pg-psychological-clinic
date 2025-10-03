'use client';
import * as React from 'react';
type Col<T> = { key: keyof T; header: string; render?: (row: T) => React.ReactNode };
export default function DataTable<T extends { id: string }>({
  columns, data, emptyText = 'Sin datos',
}: { columns: Col<T>[]; data: T[]; emptyText?: string; }) {
  if (!data?.length) return <div className="text-sm text-gray-500">{emptyText}</div>;
  return (
    <div className="overflow-x-auto border rounded-md">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>{columns.map(c => (<th key={String(c.key)} className="text-left px-4 py-2 font-semibold">{c.header}</th>))}</tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id} className="odd:bg-white even:bg-gray-50">
              {columns.map(c => (<td key={String(c.key)} className="px-4 py-2">{c.render ? c.render(row) : String(row[c.key])}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
