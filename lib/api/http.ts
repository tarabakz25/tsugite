import type { z } from 'zod'

export function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status })
}

/**
 * Parse JSON body and validate with Zod. Returns a Response on failure.
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  let unknownBody: unknown
  try {
    unknownBody = await request.json()
  } catch {
    return { ok: false, response: jsonError('Invalid JSON', 400) }
  }

  const result = schema.safeParse(unknownBody)
  if (!result.success) {
    return {
      ok: false,
      response: Response.json(
        { error: 'Validation failed', issues: result.error.flatten() },
        { status: 400 },
      ),
    }
  }

  return { ok: true, data: result.data }
}
