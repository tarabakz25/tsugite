import Link from 'next/link'
import { redirect } from 'next/navigation'

import PageContainer from '@/components/layout/page-container'
import PageHeader from '@/components/layout/page-header'
import { getCurrentProfile } from '@/lib/get-profile'
import { parseUserRole } from '@/lib/roles'

function PreviewField({ label, value }: { label: string; value?: string | null }) {
  const trimmed = value?.trim()
  return (
    <div className="border-b border-washi-3 py-5 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-widest text-ink-3">{label}</dt>
      <dd className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-ink">
        {trimmed && trimmed.length > 0 ? (
          trimmed
        ) : (
          <span className="text-sm italic text-ink-3">未入力</span>
        )}
      </dd>
    </div>
  )
}

export default async function DashboardProfilePage() {
  const profile = await getCurrentProfile()
  const role = parseUserRole(profile)
  if (!role) redirect('/onboarding/role')

  if (role === 'shop') {
    const sp = profile?.shop_profile ?? {}
    const editHref = '/dashboard/settings/shop'
    return (
      <PageContainer maxWidth="2xl">
        <PageHeader
          title="店のプロフィール（プレビュー）"
          description="求人・コンソール上で伝わる情報の確認。編集は「設定」の店舗情報タブのみで行えます。"
          rightContent={
            <Link
              href={editHref}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-washi-3 bg-white px-4 text-sm font-semibold text-ink leading-none transition-colors hover:border-ink-4 hover:bg-washi active:bg-washi-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu"
            >
              店舗情報を編集
            </Link>
          }
        />
        <div className="rounded-xl border border-washi-3 bg-white px-8 py-4 shadow-sm sm:px-10">
          <dl>
            <PreviewField label="表示名" value={sp.displayName} />
            <PreviewField label="主な所在地" value={sp.region} />
            <PreviewField label="紹介文" value={sp.description} />
          </dl>
        </div>
      </PageContainer>
    )
  }

  if (role === 'successor') {
    const sp = profile?.successor_profile ?? {}
    const editHref = '/dashboard/settings/profile'
    return (
      <PageContainer maxWidth="2xl">
        <PageHeader
          title="プロフィール（プレビュー）"
          description="店舗に伝わる自己紹介の確認。編集は「設定」のプロフィールタブのみで行えます。"
          rightContent={
            <Link
              href={editHref}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-washi-3 bg-white px-4 text-sm font-semibold text-ink leading-none transition-colors hover:border-ink-4 hover:bg-washi active:bg-washi-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu"
            >
              プロフィールを編集
            </Link>
          }
        />
        <div className="rounded-xl border border-washi-3 bg-white px-8 py-4 shadow-sm sm:px-10">
          <dl>
            <PreviewField label="表示名" value={sp.displayName} />
            <PreviewField label="興味のあるジャンル" value={sp.interests} />
            <PreviewField label="自己紹介" value={sp.bio} />
          </dl>
        </div>
      </PageContainer>
    )
  }
}
