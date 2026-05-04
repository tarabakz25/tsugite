import { type NextRequest, NextResponse } from 'next/server'

import { sanitizeReturnTo } from '@/lib/sanitize-return-to'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_AUTH_REDIRECT = '/onboarding/role'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const nextPath = url.searchParams.has('next')
    ? sanitizeReturnTo(url.searchParams.get('next'))
    : DEFAULT_AUTH_REDIRECT

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${url.origin}${nextPath}`)
    }
  }

  return NextResponse.redirect(`${url.origin}/login?error=auth_callback`)
}
