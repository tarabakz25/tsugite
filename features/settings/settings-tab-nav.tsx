'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type SettingsTabNavProps = {
  tabs: { href: string; label: string }[]
  role: 'shop' | 'successor'
}

export default function SettingsTabNav({ tabs, role }: SettingsTabNavProps) {
  const pathname = usePathname()

  const activeClass =
    role === 'shop'
      ? 'border-b-2 border-shu font-medium text-shu'
      : 'border-b-2 border-ink-3 font-medium text-ink-3'

  return (
    <nav className="flex gap-1">
      {tabs.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-3 text-sm transition-colors ${
              active ? activeClass : 'text-ink-3 hover:text-ink'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
