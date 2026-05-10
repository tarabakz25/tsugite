import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import { sanitizeReturnTo } from '@/lib/sanitize-return-to'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/register',
  '/onboarding',
  '/shop',
  '/successor',
] as const

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isLoginReturnPath(value: string): boolean {
  return value === '/login' || value.startsWith('/login?') || value.startsWith('/login/')
}

function redirectWithSessionCookies(url: URL, source: NextResponse): NextResponse {
  const response = NextResponse.redirect(url)
  const cacheHeaders = ['cache-control', 'expires', 'pragma']

  source.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie)
  })
  cacheHeaders.forEach((key) => {
    const value = source.headers.get(key)
    if (value) response.headers.set(key, value)
  })

  return response
}

/**
 * Refreshes the Supabase session from cookies. Redirects anonymous users away from
 * protected app sections (dashboard, shop/successor consoles, register, onboarding).
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

  if (user && (pathname === '/' || pathname === '/login')) {
    if (pathname === '/login') {
      const returnTo = sanitizeReturnTo(
        request.nextUrl.searchParams.get('returnTo') ?? request.nextUrl.searchParams.get('next'),
      )
      if (returnTo !== '/' && !isLoginReturnPath(returnTo)) {
        return redirectWithSessionCookies(new URL(returnTo, request.url), supabaseResponse)
      }
    }
    return redirectWithSessionCookies(new URL('/dashboard', request.url), supabaseResponse)
  }

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
