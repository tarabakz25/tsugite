'use client'

import { LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/profile'

type DashboardUserNavProps = {
  profile: Profile
  email?: string
}

export default function DashboardUserNav({ profile, email }: DashboardUserNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  const initial = profile.display_name?.charAt(0) || email?.charAt(0) || 'U'
  const settingsHref = profile.role === 'shop' ? '/shop/settings' : '/successor/settings'
  const profileHref = profile.role === 'shop' ? '/shop/profile' : '/successor/profile'

  return (
    <div className="relative border-t border-zinc-200 p-4 dark:border-zinc-800" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900 group"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 group-hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-zinc-700">
          <span className="text-sm font-medium">{initial}</span>
        </div>
        <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
          <span className="w-full truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {profile.display_name || 'ユーザー'}
          </span>
          <span className="w-full truncate text-xs text-zinc-500 dark:text-zinc-400">
            {email || 'No email'}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-4 right-4 z-50 mb-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg animate-in fade-in slide-in-from-bottom-2 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="p-1">
            <Link
              href={profileHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <User className="size-4" />
              プロフィール
            </Link>
            <Link
              href={settingsHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <Settings className="size-4" />
              設定
            </Link>
            <hr className="my-1 border-zinc-200 dark:border-zinc-800" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <LogOut className="size-4" />
              ログアウト
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
