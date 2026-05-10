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
    <div className="relative border-t border-washi-3 p-4" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-washi"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-washi-2 text-ink-2 group-hover:bg-washi-3">
          <span className="text-sm font-medium">{initial}</span>
        </div>
        <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
          <span className="w-full truncate text-sm font-semibold text-ink">
            {profile.display_name || 'ユーザー'}
          </span>
          <span className="w-full truncate text-xs text-ink-3">{email || 'メール未取得'}</span>
        </div>
      </button>

      {isOpen && (
        <div className="animate-in fade-in slide-in-from-bottom-2 absolute bottom-full left-4 right-4 z-50 mb-2 overflow-hidden rounded-xl border border-washi-3 bg-white shadow-lg">
          <div className="p-1">
            <Link
              href={profileHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-washi"
            >
              <User className="size-4" />
              プロフィール
            </Link>
            <Link
              href={settingsHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-washi"
            >
              <Settings className="size-4" />
              設定
            </Link>
            <hr className="my-1 border-washi-2" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-bg"
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
