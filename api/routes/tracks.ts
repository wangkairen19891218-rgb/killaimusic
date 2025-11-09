/**
 * Track management API routes
 * Handle track CRUD operations
 */
import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../config/supabase'
import { authenticateToken, getUserFromRequest } from '../utils/jwt'

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticateToken)

/**
 * Get all tracks for a specific project
 * GET /api/tracks?project_id=:projectId
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

    const { project_id } = req.query

    if (!project_id) {
      res.status(400).json({
        success: false,
        error: 'Project ID is required'
      })
      return
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', userPayload.userId)
      .single()

    if (projectError || !project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      })
      return
    }

    const { data: tracks, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('project_id', project_id)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Get tracks error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tracks'
      })
      return
    }

    res.json({
      success: true,
      data: { tracks }
    })
  } catch (error) {
    console.error('Get tracks error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * Get a specific track by ID
 * GET /api/tracks/:id
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

    // Get track with project ownership verification
    const { data: track, error } = await supabase
      .from('tracks')
      .select(`
        *,
        projects!inner(
          id,
          user_id
        )
      `)
      .eq('id', id)
      .eq('projects.user_id', userPayload.userId)
      .single()

    if (error || !track) {
      res.status(404).json({
        success: false,
        error: 'Track not found'
      })
      return
    }

    // Remove the nested projects data from response
    const { projects, ...trackData } = track

    res.json({
      success: true,
      data: { track: trackData }
    })
  } catch (error) {
    console.error('Get track error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * Create a new track
 * POST /api/tracks
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

    const {
      project_id,
      name,
      type,
      instrument,
      volume,
      pan,
      color,
      order_index,
      audio_file_url,
      midi_data,
      effects,
      automation
    } = req.body

    // Validation
    if (!project_id || !name || !type) {
      res.status(400).json({
        success: false,
        error: 'Project ID, name, and type are required'
      })
      return
    }

    if (!['audio', 'midi', 'instrument', 'vocal', 'drums', 'bass', 'synth', 'other'].includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Invalid track type'
      })
      return
    }

    if (volume !== undefined && (volume < 0 || volume > 2)) {
      res.status(400).json({
        success: false,
        error: 'Volume must be between 0 and 2'
      })
      return
    }

    if (pan !== undefined && (pan < -1 || pan > 1)) {
      res.status(400).json({
        success: false,
        error: 'Pan must be between -1 and 1'
      })
      return
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', userPayload.userId)
      .single()

    if (projectError || !project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      })
      return
    }

    // Get next order index if not provided
    let finalOrderIndex = order_index
    if (finalOrderIndex === undefined) {
      const { data: lastTrack } = await supabase
        .from('tracks')
        .select('order_index')
        .eq('project_id', project_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .single()

      finalOrderIndex = lastTrack ? lastTrack.order_index + 1 : 0
    }

    const trackId = uuidv4()
    const { data: newTrack, error } = await supabase
      .from('tracks')
      .insert({
        id: trackId,
        project_id,
        name: name.trim(),
        type,
        instrument: instrument?.trim() || null,
        volume: volume ?? 1.0,
        pan: pan ?? 0.0,
        color: color || '#3B82F6',
        order_index: finalOrderIndex,
        audio_file_url: audio_file_url || null,
        midi_data: midi_data || null,
        effects: effects || [],
        automation: automation || {}
      })
      .select('*')
      .single()

    if (error) {
      console.error('Create track error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create track'
      })
      return
    }

    res.status(201).json({
      success: true,
      message: 'Track created successfully',
      data: { track: newTrack }
    })
  } catch (error) {
    console.error('Create track error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * Update a track
 * PUT /api/tracks/:id
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
    const {
      name,
      type,
      instrument,
      volume,
      pan,
      muted,
      solo,
      color,
      order_index,
      audio_file_url,
      midi_data,
      effects,
      automation
    } = req.body

    // Validation
    if (name !== undefined && (!name || name.trim().length === 0)) {
      res.status(400).json({
        success: false,
        error: 'Track name cannot be empty'
      })
      return
    }

    if (type !== undefined && !['audio', 'midi', 'instrument', 'vocal', 'drums', 'bass', 'synth', 'other'].includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Invalid track type'
      })
      return
    }

    if (volume !== undefined && (volume < 0 || volume > 2)) {
      res.status(400).json({
        success: false,
        error: 'Volume must be between 0 and 2'
      })
      return
    }

    if (pan !== undefined && (pan < -1 || pan > 1)) {
      res.status(400).json({
        success: false,
        error: 'Pan must be between -1 and 1'
      })
      return
    }

    // Build update object
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (type !== undefined) updateData.type = type
    if (instrument !== undefined) updateData.instrument = instrument?.trim() || null
    if (volume !== undefined) updateData.volume = volume
    if (pan !== undefined) updateData.pan = pan
    if (muted !== undefined) updateData.muted = muted
    if (solo !== undefined) updateData.solo = solo
    if (color !== undefined) updateData.color = color
    if (order_index !== undefined) updateData.order_index = order_index
    if (audio_file_url !== undefined) updateData.audio_file_url = audio_file_url
    if (midi_data !== undefined) updateData.midi_data = midi_data
    if (effects !== undefined) updateData.effects = effects
    if (automation !== undefined) updateData.automation = automation

    // Update track with project ownership verification
    const { data: updatedTrack, error } = await supabase
      .from('tracks')
      .update(updateData)
      .eq('id', id)
      .eq('project_id', await getProjectIdForTrack(id, userPayload.userId))
      .select('*')
      .single()

    if (error || !updatedTrack) {
      res.status(404).json({
        success: false,
        error: 'Track not found or update failed'
      })
      return
    }

    res.json({
      success: true,
      message: 'Track updated successfully',
      data: { track: updatedTrack }
    })
  } catch (error) {
    console.error('Update track error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * Delete a track
 * DELETE /api/tracks/:id
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

    // Verify ownership and delete
    const { data: track, error: getError } = await supabase
      .from('tracks')
      .select(`
        id,
        projects!inner(
          user_id
        )
      `)
      .eq('id', id)
      .eq('projects.user_id', userPayload.userId)
      .single()

    if (getError || !track) {
      res.status(404).json({
        success: false,
        error: 'Track not found'
      })
      return
    }

    const { error } = await supabase
      .from('tracks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete track error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete track'
      })
      return
    }

    res.json({
      success: true,
      message: 'Track deleted successfully'
    })
  } catch (error) {
    console.error('Delete track error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * Helper function to get project ID for a track with ownership verification
 */
async function getProjectIdForTrack(trackId: string, userId: string): Promise<string | null> {
  try {
    const { data: track, error } = await supabase
      .from('tracks')
      .select(`
        project_id,
        projects!inner(
          user_id
        )
      `)
      .eq('id', trackId)
      .eq('projects.user_id', userId)
      .single()

    if (error || !track) {
      return null
    }

    return track.project_id
  } catch (error) {
    console.error('Get project ID for track error:', error)
    return null
  }
}

export default router