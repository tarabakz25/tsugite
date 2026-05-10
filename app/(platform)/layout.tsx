import type { ReactNode } from 'react'

/**
 * プラットフォーム領域（ログイン〜ダッシュボード）。
 * マーケティング (`(marketing)` の SiteHeader/Footer) とは視覚・導線を分離する。
 */
export default function PlatformLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-svh min-h-[100dvh] flex-1 flex-col bg-surface-muted text-ink">
      {children}
    </div>
  )
}
