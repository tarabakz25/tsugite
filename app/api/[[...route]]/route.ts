import { Hono } from 'hono'
import { handle } from 'hono/vercel'

import archive from './archive'

export const runtime = 'nodejs'

const app = new Hono().basePath('/api')

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

app.route('/archive', archive)

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
