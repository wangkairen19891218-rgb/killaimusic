import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cykasaejdttlcrolrysl.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5a2FzYWVqZHR0bGNyb2xyeXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjcwOTIsImV4cCI6MjA3NDM0MzA5Mn0.wjCrqLYYtO1IA1p6pK2O82WFuBxUkhlQWyVppO1Izx8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  subscription: 'free' | 'pro' | 'premium'
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  bpm: number
  key: string
  time_signature: string
  ai_evasion_level: number
  created_at: string
  updated_at: string
}

export interface Track {
  id: string
  project_id: string
  name: string
  type: 'audio' | 'midi' | 'instrument'
  volume: number
  pan: number
  muted: boolean
  solo: boolean
  effects: any[]
  audio_url?: string
  midi_data?: any
  created_at: string
  updated_at: string
}

export interface AIAnalysis {
  id: string
  project_id: string
  track_id?: string
  analysis_type: 'detection' | 'evasion' | 'optimization'
  confidence_score: number
  suggestions: any[]
  applied_strategies: string[]
  created_at: string
}

export interface Asset {
  id: string
  user_id: string
  name: string
  type: 'sample' | 'loop' | 'preset' | 'template'
  category: string
  tags: string[]
  file_url: string
  file_size: number
  duration?: number
  bpm?: number
  key?: string
  ai_safe: boolean
  created_at: string
}