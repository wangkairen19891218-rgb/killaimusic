/**
 * Project management API routes
 * Handle project CRUD operations
 */
import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../config/supabase'
import { authenticateToken, getUserFromRequest } from '../utils/jwt'

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticateToken)

/**
 * Get all projects for the authenticated user
 * GET /api/projects
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userPayload = getUserFromRequest(req)
    if (!userPayload) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userPayload.userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Get projects error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch projects'
      })
      return
    }

    res.json({
      success: true,
      data: { projects }
    })
  } catch (error) {
    console.error('Get projects error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * Get a specific project by ID
 * GET /api/projects/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userPayload = getUserFromRequest(req)
    if (!userPayload) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { id } = req.params

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userPayload.userId)
      .single()

    if (error || !project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      })
      return
    }

    res.json({
      success: true,
      data: { project }
    })
  } catch (error) {
    console.error('Get project error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * Create a new project
 * POST /api/projects
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userPayload = getUserFromRequest(req)
    if (!userPayload) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { name, description, bpm, key_signature, time_signature } = req.body

    // Validation
    if (!name || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Project name is required'
      })
      return
    }

    if (bpm && (bpm < 60 || bpm > 300)) {
      res.status(400).json({
        success: false,
        error: 'BPM must be between 60 and 300'
      })
      return
    }

    const projectId = uuidv4()
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        user_id: userPayload.userId,
        name: name.trim(),
        description: description?.trim() || null,
        bpm: bpm || 120,
        key_signature: key_signature || 'C',
        time_signature: time_signature || '4/4',
        status: 'draft'
      })
      .select('*')
      .single()

    if (error) {
      console.error('Create project error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create project'
      })
      return
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project: newProject }
    })
  } catch (error) {
    console.error('Create project error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * Update a project
 * PUT /api/projects/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userPayload = getUserFromRequest(req)
    if (!userPayload) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { id } = req.params
    const { name, description, bpm, key_signature, time_signature, status, duration } = req.body

    // Validation
    if (name !== undefined && (!name || name.trim().length === 0)) {
      res.status(400).json({
        success: false,
        error: 'Project name cannot be empty'
      })
      return
    }

    if (bpm !== undefined && (bpm < 60 || bpm > 300)) {
      res.status(400).json({
        success: false,
        error: 'BPM must be between 60 and 300'
      })
      return
    }

    if (status !== undefined && !['draft', 'in_progress', 'completed', 'archived'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid project status'
      })
      return
    }

    // Build update object
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (bpm !== undefined) updateData.bpm = bpm
    if (key_signature !== undefined) updateData.key_signature = key_signature
    if (time_signature !== undefined) updateData.time_signature = time_signature
    if (status !== undefined) updateData.status = status
    if (duration !== undefined) updateData.duration = duration

    const { data: updatedProject, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userPayload.userId)
      .select('*')
      .single()

    if (error || !updatedProject) {
      res.status(404).json({
        success: false,
        error: 'Project not found or update failed'
      })
      return
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updatedProject }
    })
  } catch (error) {
    console.error('Update project error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * Delete a project
 * DELETE /api/projects/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userPayload = getUserFromRequest(req)
    if (!userPayload) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const { id } = req.params

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userPayload.userId)

    if (error) {
      console.error('Delete project error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete project'
      })
      return
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    })
  } catch (error) {
    console.error('Delete project error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

export default router