import type { IncomingMessage, ServerResponse } from 'http'

const allowedOrigins = new Set([
  'https://killaimusic.fun',
  'https://www.killaimusic.fun',
  'http://localhost:5173',
  'http://localhost:3000'
])

function setCors(res: ServerResponse, origin?: string) {
  const allowed = origin && allowedOrigins.has(origin)
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin! : '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (allowed) {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
}

async function parseJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

// Dedicated serverless function for /api/auth/login
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    setCors(res, req.headers['origin'] as string | undefined)

    // Preflight
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

    // Demo account shortcut
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

    // Dynamically import heavy dependencies to avoid preflight failures at load time
    const supabaseModule = await import('../config/supabase')
    const supabase = (supabaseModule as any).supabase
    if (!supabase || typeof (supabase as any).from !== 'function') {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Database unavailable' }))
      return
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password, subscription, created_at')
      .eq('email', email)
      .single()

    if (error || !user) {
      res.statusCode = 401
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Invalid email or password' }))
      return
    }

    const bcryptModule = await import('bcryptjs')
    const bcrypt = (bcryptModule as any).default || bcryptModule
    const isValidPassword = await bcrypt.compare(password, (user as any).password)
    if (!isValidPassword) {
      res.statusCode = 401
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Invalid email or password' }))
      return
    }

    // Minimal token payload for now
    const token = `user_${(user as any).id}_${Date.now()}`

    const { password: _pw, ...userWithoutPassword } = (user as any)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ success: true, message: 'Login successful', data: { user: userWithoutPassword, token } }))
  } catch (err: any) {
    try {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: false, error: 'Server error', detail: String(err?.message || err) }))
    } catch {}
  }
}