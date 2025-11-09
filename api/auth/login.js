const allowedOrigins = new Set([
  'https://killaimusic.fun',
  'https://www.killaimusic.fun',
  'http://localhost:5173',
  'http://localhost:3000'
])

function setCors(res, origin) {
  const allowed = origin && allowedOrigins.has(origin)
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (allowed) {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
}

async function parseJson(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

module.exports = async function handler(req, res) {
  try {
    setCors(res, req.headers['origin'])

    if (req.method === 'OPTIONS') {
      res.statusCode = 200
      res.end()
      return
    }

    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }))
      return
    }

    const body = await parseJson(req)
    const { email, password } = body || {}

    if (!email || !password) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Email and password are required' }))
      return
    }

    if (email === 'demo@example.com' && password === 'password') {
      const demoUser = {
        id: 'demo_user_id',
        email: 'demo@example.com',
        name: '演示用户',
        subscription: 'free',
        created_at: new Date().toISOString()
      }
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: true, message: 'Login successful (demo)', data: { user: demoUser, token: 'demo_local_token' } }))
      return
    }

    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ success: false, error: 'Invalid email or password' }))
  } catch (err) {
    try {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Server error', detail: String(err && err.message || err) }))
    } catch {}
  }
}