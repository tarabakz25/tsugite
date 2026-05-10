import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type PageHeaderProps = {
  title: string
  description?: string
  rightContent?: ReactNode
  className?: string
}

export default function PageHeader({
  title,
  description,
  rightContent,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && <p className="text-sm text-ink-3 sm:text-base">{description}</p>}
      </div>
      {rightContent && <div className="flex items-center gap-3">{rightContent}</div>}
    </div>
  )
}
