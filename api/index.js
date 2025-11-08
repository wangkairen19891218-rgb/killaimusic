// Vercel serverless entry: load compiled CJS handler safely from dist
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

export default function vercelHandler(req, res) {
  // Preserve original path from rewrite for Express routing
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const pathFromRewrite = url.searchParams.get('path')
    if (pathFromRewrite) {
      // Reconstruct req.url to include /api prefix and path for express
      const originalPath = `/api/${pathFromRewrite}`
      req.url = originalPath + (url.search ? url.search.replace(/^[^?]*/, '') : '')
    }
  } catch {}

  let handler
  try {
    const compiled = require('./dist/index.js')
    handler = compiled?.default || compiled
  } catch (e) {
    console.error('Failed to load compiled handler:', e)
    try {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Internal server error (load)' }))
    } catch {}
    return
  }

  try {
    return handler(req, res)
  } catch (e) {
    console.error('Unhandled error in API function:', e)
    try {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Internal server error' }))
    } catch {}
  }
}