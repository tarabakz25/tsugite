import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

type SessionCookieParts = Map<
  string,
  {
    value: string
    options?:
      | {
          domain?: string
          expires?: Date | number
          httpOnly?: boolean
          maxAge?: number
          partitioned?: boolean
          path?: string
          priority?: 'low' | 'medium' | 'high'
          sameSite?: boolean | 'lax' | 'strict' | 'none'
          secure?: boolean
        }
      | undefined
  }
>

/**
 * OAuth code exchange happens in a Route Handler. Session cookies must be on the SAME
 * `NextResponse.redirect` that is returned — and each `exchangeCodeForSession` can call
 * `setAll` more than once (chunked JWT), so merging every cookie before rebuilding the redirect
 * is required or the outbound `Set-Cookie` misses chunks.
 *
 * Also mirrors `@/lib/supabase/proxy` by mirroring incoming cookies onto `request` on each batch.
 */
export function createOAuthCallbackSupabase(request: NextRequest, initialRedirectUrl: string) {
  const sessionCookies: SessionCookieParts = new Map()
  const cacheHeaders: Record<string, string> = {}

  const state = {
    redirect: NextResponse.redirect(initialRedirectUrl, 307),
  }

  function rebuildRedirect(locationOverride?: string) {
    const location =
      locationOverride ?? state.redirect.headers.get('Location') ?? initialRedirectUrl

    state.redirect = NextResponse.redirect(location, 307)

    sessionCookies.forEach(({ value, options }, name) => {
      state.redirect.cookies.set(name, value, options)
    })

    Object.entries(cacheHeaders).forEach(([key, value]) => state.redirect.headers.set(key, value))
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            sessionCookies.set(name, { value, options })
          })

          Object.entries(headers).forEach(([key, value]) => {
            cacheHeaders[key] = value
          })

          rebuildRedirect()
        },
      },
    },
  )

  function setRedirectLocation(url: string) {
    rebuildRedirect(url)
  }

  function getRedirectResponse() {
    return state.redirect
  }

  return { supabase, getRedirectResponse, setRedirectLocation }
}
