import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
      <table className={`w-full text-left text-sm ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-zinc-800 bg-zinc-900/50">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-zinc-800">{children}</tbody>;
}

export function TableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <tr className={`transition-colors hover:bg-zinc-800/50 ${className}`}>{children}</tr>;
}

export function TableHead({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 font-medium text-zinc-400 ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) {
  return <td className={`px-4 py-3 text-zinc-300 ${className}`} colSpan={colSpan}>{children}</td>;
}

export function TableEmpty({ colSpan, message = 'Nenhum registro encontrado.' }: { colSpan: number, message?: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-32 text-center text-zinc-500">
        {message}
      </TableCell>
    </TableRow>
  );
}

export function TableSkeleton({ colSpan, rows = 5 }: { colSpan: number, rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell colSpan={colSpan}>
            <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
