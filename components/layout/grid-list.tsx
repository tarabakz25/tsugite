import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type GridListProps = {
  children: ReactNode
  columns?: 1 | 2 | 3
  className?: string
}

const columnClasses: Record<NonNullable<GridListProps['columns']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
}

export default function GridList({ children, columns = 2, className }: GridListProps) {
  const columnClass = columnClasses[columns]

  return <div className={cn('grid gap-4', columnClass, className)}>{children}</div>
}
