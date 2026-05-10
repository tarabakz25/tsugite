import { type NextRequest, NextResponse } from 'next/server'

import { homePathForRole } from '@/lib/roles'
import { sanitizeReturnTo } from '@/lib/sanitize-return-to'
import { createOAuthCallbackSupabase } from '@/lib/supabase/oauth-callback'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const requestedNextPath = sanitizeReturnTo(url.searchParams.get('next'))

  // request.url の origin は dev server のバインドアドレス (0.0.0.0) になる場合があるため
  // host ヘッダーから正しい origin を組み立てる
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? url.host
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '')
  const origin = `${proto}://${host}`

  const loginErrorUrl = `${origin}/login?error=auth_callback`

  if (!code) {
    return NextResponse.redirect(loginErrorUrl)
  }

  const defaultAfterAuth = `${origin}/onboarding/role`
  const initialRedirectUrl =
    requestedNextPath !== '/' ? `${origin}${requestedNextPath}` : defaultAfterAuth

  const { supabase, getRedirectResponse, setRedirectLocation } = createOAuthCallbackSupabase(
    request,
    initialRedirectUrl,
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(loginErrorUrl)
  }

  if (requestedNextPath !== '/') {
    return getRedirectResponse()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    : { data: null }
  const nextPath = homePathForRole(profile?.role) ?? '/onboarding/role'

  setRedirectLocation(`${origin}${nextPath}`)
  return getRedirectResponse()
}
