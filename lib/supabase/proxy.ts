import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import { sanitizeReturnTo } from '@/lib/sanitize-return-to'

const PROTECTED_PREFIXES = ['/dashboard', '/register', '/onboarding'] as const

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * Refreshes the Supabase session from cookies. Redirects anonymous users away from
 * protected app sections (dashboard / register / onboarding).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  if (isProtectedPath(pathname) && !user) {
    const login = new URL('/login', request.url)
    const returnTo = sanitizeReturnTo(`${pathname}${request.nextUrl.search}`)
    if (returnTo !== '/') {
      login.searchParams.set('returnTo', returnTo)
    }
    return NextResponse.redirect(login)
  }

  return supabaseResponse
}
