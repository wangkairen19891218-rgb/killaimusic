/**
 * User authentication API routes
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../config/supabase'
import { generateToken, authenticateToken, getUserFromRequest } from '../utils/jwt'

const router = Router()

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: 'Name, email and password are required'
      })
      return
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      })
      return
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      })
      return
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const userId = uuidv4()
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        name,
        email,
        password: hashedPassword,
        subscription: 'free'
      })
      .select('id, name, email, subscription, created_at')
      .single()

    if (error) {
      console.error('Registration error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create user account'
      })
      return
    }

    // Generate JWT token
    const token = generateToken({ userId: newUser.id, email: newUser.email })

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: newUser,
        token
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    console.log('Login attempt for email:', email)

    // Validation
    if (!email || !password) {
      console.log('Missing email or password')
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      })
      return
    }

    // Special handling for demo account
    if (email === 'demo@example.com' && password === 'password') {
      console.log('Demo account login')
      const demoUser = {
        id: 'demo_user_id',
        email: 'demo@example.com',
        name: '演示用户',
        subscription: 'free',
        created_at: new Date().toISOString()
      }

      const token = generateToken({ userId: demoUser.id, email: demoUser.email })

      res.json({
        success: true,
        message: 'Login successful (demo)',
        data: {
          user: demoUser,
          token
        }
      })
      return
    }

    // Ensure Supabase is available before using it
    if (!supabase || typeof (supabase as any).from !== 'function') {
      console.error('Supabase client unavailable. Check environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY')
      res.status(500).json({
        success: false,
        error: 'Database unavailable. Please try again later.'
      })
      return
    }

    // Try to find user in database
    console.log('Querying database for user:', email)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password, subscription, created_at')
      .eq('email', email)
      .single()

    console.log('Database query result:', { user: user ? 'found' : 'not found', error: (error as any)?.message })

    if (error || !user) {
      console.log('User not found in database:', (error as any)?.message)
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
      return
    }

    // Verify password
    console.log('Verifying password for user:', user.email)
    const isValidPassword = await bcrypt.compare(password, (user as any).password)
    console.log('Password verification result:', isValidPassword)

    if (!isValidPassword) {
      console.log('Password verification failed for user:', user.email)
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
      return
    }

    // Generate JWT token
    const token = generateToken({ userId: (user as any).id, email: (user as any).email })

    // Remove password from response
    const { password: _pw, ...userWithoutPassword } = (user as any)

    console.log('Login successful for user:', (user as any).email)
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    try {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    } catch {}
  }
})

/**
 * Get Current User
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userPayload = getUserFromRequest(req)
    if (!userPayload) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    // Demo account short-circuit: avoid DB access
    if (userPayload.email === 'demo@example.com' && userPayload.userId === 'demo_user_id') {
      res.json({
        success: true,
        data: {
          user: {
            id: 'demo_user_id',
            name: '演示用户',
            email: 'demo@example.com',
            subscription: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      })
      return
    }

    if (!supabase || typeof (supabase as any).from !== 'function') {
      console.error('Supabase client unavailable in /me')
      res.status(500).json({
        success: false,
        error: 'Database unavailable'
      })
      return
    }

    // Get user details from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, subscription, created_at, updated_at')
      .eq('id', userPayload.userId)
      .single()

    if (error || !user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }

    res.json({
      success: true,
      data: { user }
    })
  } catch (error) {
    console.error('Get current user error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  // Since we're using stateless JWT, logout is handled on the client side
  // by removing the token from storage
  res.json({
    success: true,
    message: 'Logout successful'
  })
})

export default router
