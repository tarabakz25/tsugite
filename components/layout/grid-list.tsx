import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type GridListProps = {
  children: ReactNode
  className?: string
  columns?: 1 | 2 | 3 | 4
}

export default function GridList({ children, className, columns = 3 }: GridListProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return <div className={cn('grid gap-6', columnClasses[columns], className)}>{children}</div>
}
