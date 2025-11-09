// Catch-all API function to handle all /api/* routes
// Ensures preflight OPTIONS is short-circuited and other methods are proxied to Express

import type { IncomingMessage, ServerResponse } from 'http'
import { parse as parseUrl } from 'url'

const allowedOrigins = new Set([
  'https://kililamusic.fun',
  'https://www.kililamusic.fun',
  'https://killaimusic.fun',
  'https://www.killaimusic.fun',
  'http://localhost:5173',
  'http://localhost:3000'
])

function setCorsHeaders(req: IncomingMessage, res: ServerResponse) {
  const origin = (req.headers['origin'] as string | undefined) || ''
  const allowed = origin && allowedOrigins.has(origin)
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : '*')
  if (allowed) res.setHeader('Access-Control-Allow-Credentials', 'true')

  const reqMethod = (req.headers['access-control-request-method'] as string | undefined) || 'GET,POST,PUT,DELETE,OPTIONS'
  const reqHeaders = (req.headers['access-control-request-headers'] as string | undefined) || 'Content-Type, Authorization'
  res.setHeader('Access-Control-Allow-Methods', reqMethod)
  res.setHeader('Access-Control-Allow-Headers', reqHeaders)
  res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers')
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    setCorsHeaders(req, res)
    res.setHeader('X-Serverless-Function', 'api/[...path]')

    // Proper preflight response – do not load Express
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    // Lazy-load Express app for actual requests
    let expressApp: any
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      expressApp = require('./app').default
    } catch (e) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'App load error', detail: String((e as any)?.message || e) }))
      return
    }

    // Ensure URL is normalized (keep original path under /api/*)
    const parsed = parseUrl(req.url || '')
    if (!parsed.pathname?.startsWith('/api/')) {
      const pathname = parsed.pathname || '/'
      req.url = `/api${pathname}`
    }

    ;(expressApp as any)(req, res)
  } catch (error) {
    try {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Catch-all function error' }))
    } catch {}
  }
}