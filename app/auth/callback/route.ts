import { type NextRequest, NextResponse } from 'next/server'

import { sanitizeReturnTo } from '@/lib/sanitize-return-to'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const requestedNextPath = sanitizeReturnTo(url.searchParams.get('next'))

  // request.url の origin は dev server のバインドアドレス (0.0.0.0) になる場合があるため
  // host ヘッダーから正しい origin を組み立てる
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? url.host
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '')
  const origin = `${proto}://${host}`

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (requestedNextPath !== '/') {
        return NextResponse.redirect(`${origin}${requestedNextPath}`)
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data: profile } = user
        ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        : { data: null }
      const role = profile?.role
      const nextPath =
        role === 'shop' || role === 'successor' ? '/dashboard' : '/onboarding/role'

      return NextResponse.redirect(`${origin}${nextPath}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`)
}
