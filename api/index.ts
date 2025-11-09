import type { IncomingMessage, ServerResponse } from 'http'
import { parse as parseUrl } from 'url'
import app from './app'

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

    // Minimal CORS preflight handling safety: if OPTIONS without body, allow
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.statusCode = 200
      res.end()
      return
    }

    ;(app as any)(req, res)
  } catch (error) {
    try {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Server entry error' }))
    } catch {}
  }
}