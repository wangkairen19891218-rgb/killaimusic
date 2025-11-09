import jwt, { SignOptions } from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

// Ensure production env loads correct file
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

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

/**
 * Generate JWT token
 */
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

/**
 * JWT middleware for protected routes
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    res.status(401).json({ success: false, error: 'Access token required' })
    return
  }

  try {
    const decoded = verifyToken(token)
    ;(req as any).user = decoded
    next()
  } catch (error) {
    res.status(403).json({ success: false, error: 'Invalid or expired token' })
  }
}

/**
 * Extract user ID from request
 */
export const getUserFromRequest = (req: Request): JWTPayload | null => {
  return (req as any).user || null
}