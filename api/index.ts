import type { IncomingMessage, ServerResponse } from 'http'
import { parse as parseUrl } from 'url'

// Allowed origins for CORS. Keep in sync with app.ts
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

  // Echo back the origin when allowed, otherwise fallback to '*'
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : '*')

  // Allow credentials only for whitelisted origins
  if (allowed) {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  // Dynamically allow requested method/headers for preflight
  const reqMethod = (req.headers['access-control-request-method'] as string | undefined) || 'GET,POST,PUT,DELETE,OPTIONS'
  const reqHeaders = (req.headers['access-control-request-headers'] as string | undefined) || 'Content-Type, Authorization'
  res.setHeader('Access-Control-Allow-Methods', reqMethod)
  res.setHeader('Access-Control-Allow-Headers', reqHeaders)

  // Help caches/proxies handle per-origin variations
  res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers')
}

// Serverless handler that proxies requests to the Express app
export default function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    // Rewrite /api/index?path=xxx -> /api/xxx so Express routes match
    const parsed = parseUrl(req.url || '', true)
    const q = parsed.query as Record<string, string | string[] | undefined>
    const pathParam = (q && q.path) ? String(q.path) : undefined

    // Only rewrite when hitting the index function with a path param
    if ((parsed.pathname === '/api/index' || parsed.pathname === '/api/index/') && pathParam) {
      const normalized = pathParam.startsWith('/') ? pathParam : `/${pathParam}`
      req.url = `/api${normalized}`
    }

    // Minimal CORS handling: set headers for all requests
    setCorsHeaders(req, res)
    // Marker header to identify index function in responses
    res.setHeader('X-Serverless-Function', 'api/index')

    // Proper preflight response – short-circuit before importing app
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    // Lazy-load Express app to avoid init-time crashes affecting preflight
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

    ;(expressApp as any)(req, res)
  } catch (error) {
    try {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Server entry error' }))
    } catch {}
  }
}