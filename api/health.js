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
  const reqMethod = (req.headers['access-control-request-method'] || 'GET')
  const reqHeaders = (req.headers['access-control-request-headers'] || 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', reqMethod)
  res.setHeader('Access-Control-Allow-Headers', reqHeaders)
  res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers')
}

module.exports = function handler(req, res) {
  setCors(req, res)
  res.setHeader('X-Serverless-Function', 'api/health')
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Music Production API'
  }))
}