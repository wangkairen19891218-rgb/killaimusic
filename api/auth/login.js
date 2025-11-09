// Pure JS serverless function to guarantee stable preflight responses on Vercel
// No TypeScript / type imports to avoid compile-time or runtime issues

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
  const reqMethod = (req.headers['access-control-request-method'] || 'POST')
  const reqHeaders = (req.headers['access-control-request-headers'] || 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', reqMethod)
  res.setHeader('Access-Control-Allow-Headers', reqHeaders)
  res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers')
}

module.exports = async function handler(req, res) {
  try {
    setCors(req, res)
    res.setHeader('X-Serverless-Function', 'api/auth/login')

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    let app
    try {
      app = require('../app').default
    } catch (e) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'App load error', detail: String(e && e.message || e) }))
      return
    }

    req.url = '/api/auth/login'
    app(req, res)
  } catch (error) {
    try {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Server function error', function: 'api/auth/login' }))
    } catch {}
  }
}

