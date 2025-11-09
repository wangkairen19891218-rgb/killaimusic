// Stable JS catch-all for /api/* routes with robust CORS and lazy Express
const allowedOrigins = new Set([
  'https://kililamusic.fun',
  'https://www.kililamusic.fun',
  'https://killaimusic.fun',
  'https://www.killaimusic.fun',
  'http://localhost:5173',
  'http://localhost:3000'
])

function setCors(req, res) {
  const origin = (req.headers['origin'] || '')
  const allowed = origin && allowedOrigins.has(origin)
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : '*')
  if (allowed) res.setHeader('Access-Control-Allow-Credentials', 'true')
  const reqMethod = (req.headers['access-control-request-method'] || 'GET,POST,PUT,DELETE,OPTIONS')
  const reqHeaders = (req.headers['access-control-request-headers'] || 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', reqMethod)
  res.setHeader('Access-Control-Allow-Headers', reqHeaders)
  res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers')
}

module.exports = async function handler(req, res) {
  try {
    setCors(req, res)
    res.setHeader('X-Serverless-Function', 'api/[...path]')

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    // Lazy-load Express app to avoid crashing preflight
    let expressApp
    try {
      expressApp = require('./app').default || require('./app')
    } catch (e) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'App load error', detail: String(e && e.message || e) }))
      return
    }

    // Ensure request URL stays under /api/* (Vercel provides full path)
    if (req.url && !req.url.startsWith('/api/')) {
      req.url = req.url.startsWith('/') ? `/api${req.url}` : `/api/${req.url}`
    }

    expressApp(req, res)
  } catch (err) {
    try {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Catch-all function error' }))
    } catch {}
  }
}