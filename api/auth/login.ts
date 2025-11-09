// Minimal serverless function to guarantee stable preflight responses

const allowedOrigins = new Set([
  'https://kililamusic.fun',
  'https://www.kililamusic.fun',
  'https://killaimusic.fun',
  'https://www.killaimusic.fun',
  'http://localhost:5173',
  'http://localhost:3000'
])

function setCors(req: any, res: any) {
  const origin = (req.headers['origin'] as string | undefined) || ''
  const allowed = origin && allowedOrigins.has(origin)
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : '*')
  if (allowed) res.setHeader('Access-Control-Allow-Credentials', 'true')
  const reqMethod = (req.headers['access-control-request-method'] as string | undefined) || 'POST'
  const reqHeaders = (req.headers['access-control-request-headers'] as string | undefined) || 'Content-Type, Authorization'
  res.setHeader('Access-Control-Allow-Methods', reqMethod)
  res.setHeader('Access-Control-Allow-Headers', reqHeaders)
  res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers')
}

export default async function handler(req: any, res: any) {
  try {
    setCors(req, res)
    // Marker header to identify this function in responses
    res.setHeader('X-Serverless-Function', 'api/auth/login')

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    // For POST/others, hand-off to Express app
    let app: any
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      app = require('../app').default
    } catch (e) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'App load error', detail: String((e as any)?.message || e) }))
      return
    }

    // Ensure URL is correct for Express router
    req.url = '/api/auth/login'
    ;(app as any)(req, res)
  } catch (error) {
    try {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Server function error', function: 'api/auth/login' }))
    } catch {}
  }
}