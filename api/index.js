// Vercel serverless entry: load compiled CJS handler safely from dist
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default function vercelHandler(req, res) {
  // CORS helper for early responses (preflight or crashes before Express)
  const setCors = () => {
    const origin = req.headers.origin || '*'
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    // Credentials are not used by frontend; omit Allow-Credentials
  }

  // Handle preflight directly if needed
  if (req.method === 'OPTIONS') {
    try {
      setCors()
      res.statusCode = 204
      res.end()
      return
    } catch {}
  }

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
    // Try multiple candidate paths to accommodate Vercel packaging differences
    const candidates = [
      path.join(__dirname, 'dist/index.js'),
      path.join(__dirname, 'api/dist/index.js'),
      path.join(__dirname, 'dist/app.js') // fallback to app direct
    ]

    let compiled
    for (const p of candidates) {
      try {
        compiled = require(p)
        if (compiled) break
      } catch {}
    }

    if (!compiled) throw new Error('No compiled handler found in candidates')

    handler = compiled?.default || compiled
  } catch (e) {
    console.error('Failed to load compiled handler:', e)
    try {
      setCors()
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
      setCors()
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Internal server error' }))
    } catch {}
  }
}