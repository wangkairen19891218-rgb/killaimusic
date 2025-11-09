import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables with production awareness
(() => {
  const envPath = process.env.NODE_ENV === 'production'
    ? path.resolve(process.cwd(), '.env.production')
    : path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  } else {
    dotenv.config()
  }
})()

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

if (!supabaseUrl) {
  console.error('Supabase URL missing in environment variables')
}

// Prefer service role; gracefully fallback to anon to avoid hard crashes
let supabaseClient: ReturnType<typeof createClient> | null = null

try {
  if (supabaseUrl && supabaseServiceKey) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  } else if (supabaseUrl && supabaseAnonKey) {
    console.warn('Using Supabase anon key fallback; operations may be restricted by RLS')
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  } else {
    console.error('Supabase keys missing; backend data operations will be unavailable')
  }
} catch (e) {
  console.error('Failed to initialize Supabase client:', e)
}

// Export leniently typed clients to avoid TS union/never issues in route files
export const supabase: any = supabaseClient

export const supabaseAnon = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export default supabaseClient as any