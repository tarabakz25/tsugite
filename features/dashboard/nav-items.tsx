import { Archive, Bot, Compass, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

export type NavItem = {
  href: string
  label: string
  sub?: string
  icon: ReactNode
}

export const SHOP_NAV_ITEMS: NavItem[] = [
  { href: '/shop', label: 'ホーム', icon: <Sparkles size={18} /> },
  {
    href: '/dashboard/archive',
    label: 'Archive',
    sub: '蓄える',
    icon: <Archive size={18} />,
  },
  {
    href: '/dashboard/agent',
    label: 'Agent',
    sub: '相談する',
    icon: <Bot size={18} />,
  },
  {
    href: '/dashboard/guide',
    label: 'Guide',
    sub: '現場で導く',
    icon: <Compass size={18} />,
  },
]

export const SUCCESSOR_NAV_ITEMS: NavItem[] = [
  { href: '/successor', label: 'ホーム', icon: <Sparkles size={18} /> },
  {
    href: '/dashboard/archive',
    label: 'Archive',
    sub: '蓄える',
    icon: <Archive size={18} />,
  },
  {
    href: '/dashboard/agent',
    label: 'Agent',
    sub: '相談する',
    icon: <Bot size={18} />,
  },
  {
    href: '/dashboard/guide',
    label: 'Guide',
    sub: '現場で導く',
    icon: <Compass size={18} />,
  },
]
