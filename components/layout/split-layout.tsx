import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type SplitLayoutProps = {
  main: ReactNode
  side: ReactNode
  className?: string
  reverse?: boolean
}

export default function SplitLayout({ main, side, className, reverse = false }: SplitLayoutProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-8 lg:grid-cols-12', className)}>
      <div className={cn('lg:col-span-8', reverse ? 'lg:order-2' : 'lg:order-1')}>{main}</div>
      <div className={cn('lg:col-span-4', reverse ? 'lg:order-1' : 'lg:order-2')}>{side}</div>
    </div>
  )
}
