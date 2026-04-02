import { type FC, type ReactNode } from 'react'

interface Column {
  key: string
  header: string
  align?: 'left' | 'right'
  mono?: boolean
}

interface TableProps {
  columns: Column[]
  children: ReactNode
}

export const Table: FC<TableProps> = ({ columns, children }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-subtle">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs uppercase tracking-wider text-text-secondary font-medium ${col.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
