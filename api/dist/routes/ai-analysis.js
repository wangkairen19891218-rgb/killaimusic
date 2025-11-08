"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const supabase_1 = require("../config/supabase");
const jwt_1 = require("../utils/jwt");
const router = (0, express_1.Router)();
router.use(jwt_1.authenticateToken);
router.get('/', async (req, res) => {
    try {
        const userPayload = (0, jwt_1.getUserFromRequest)(req);
        if (!userPayload) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        const { project_id, track_id } = req.query;
        if (!project_id) {
            res.status(400).json({
                success: false,
                error: 'Project ID is required'
            });
            return;
        }
        const { data: project, error: projectError } = await supabase_1.supabase
            .from('projects')
            .select('id')
            .eq('id', project_id)
            .eq('user_id', userPayload.userId)
            .single();
        if (projectError || !project) {
            res.status(404).json({
                success: false,
                error: 'Project not found'
            });
            return;
        }
        let query = supabase_1.supabase
            .from('ai_analyses')
            .select('*')
            .eq('project_id', project_id)
            .order('created_at', { ascending: false });
        if (track_id) {
            query = query.eq('track_id', track_id);
        }
        const { data: analyses, error } = await query;
        if (error) {
            console.error('Get AI analyses error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch AI analyses'
            });
            return;
        }
        res.json({
            success: true,
            data: { analyses }
        });
    }
    catch (error) {
        console.error('Get AI analyses error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const userPayload = (0, jwt_1.getUserFromRequest)(req);
        if (!userPayload) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        const { id } = req.params;
        const { data: analysis, error } = await supabase_1.supabase
            .from('ai_analyses')
            .select(`
        *,
        projects!inner(
          id,
          user_id
        )
      `)
            .eq('id', id)
            .eq('projects.user_id', userPayload.userId)
            .single();
        if (error || !analysis) {
            res.status(404).json({
                success: false,
                error: 'AI analysis not found'
            });
            return;
        }
        const { projects, ...analysisData } = analysis;
        res.json({
            success: true,
            data: { analysis: analysisData }
        });
    }
    catch (error) {
        console.error('Get AI analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const userPayload = (0, jwt_1.getUserFromRequest)(req);
        if (!userPayload) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        const { project_id, track_id, analysis_type, input_data, result_data, confidence_score, processing_time_ms } = req.body;
        if (!project_id || !analysis_type || !input_data) {
            res.status(400).json({
                success: false,
                error: 'Project ID, analysis type, and input data are required'
            });
            return;
        }
        if (!['chord_progression', 'melody_analysis', 'rhythm_analysis', 'harmony_suggestion', 'mixing_advice', 'mastering_tips'].includes(analysis_type)) {
            res.status(400).json({
                success: false,
                error: 'Invalid analysis type'
            });
            return;
        }
        if (confidence_score !== undefined && (confidence_score < 0 || confidence_score > 1)) {
            res.status(400).json({
                success: false,
                error: 'Confidence score must be between 0 and 1'
            });
            return;
        }
        if (processing_time_ms !== undefined && processing_time_ms < 0) {
            res.status(400).json({
                success: false,
                error: 'Processing time must be non-negative'
            });
            return;
        }
        const { data: project, error: projectError } = await supabase_1.supabase
            .from('projects')
            .select('id')
            .eq('id', project_id)
            .eq('user_id', userPayload.userId)
            .single();
        if (projectError || !project) {
            res.status(404).json({
                success: false,
                error: 'Project not found'
            });
            return;
        }
        if (track_id) {
            const { data: track, error: trackError } = await supabase_1.supabase
                .from('tracks')
                .select('id')
                .eq('id', track_id)
                .eq('project_id', project_id)
                .single();
            if (trackError || !track) {
                res.status(404).json({
                    success: false,
                    error: 'Track not found in the specified project'
                });
                return;
            }
        }
        const analysisId = (0, uuid_1.v4)();
        const { data: newAnalysis, error } = await supabase_1.supabase
            .from('ai_analyses')
            .insert({
            id: analysisId,
            project_id,
            track_id: track_id || null,
            analysis_type,
            input_data,
            result: result_data || {},
            confidence_score: confidence_score || null,
            processing_time_ms: processing_time_ms || null
        })
            .select('*')
            .single();
        if (error) {
            console.error('Create AI analysis error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create AI analysis'
            });
            return;
        }
        res.status(201).json({
            success: true,
            message: 'AI analysis created successfully',
            data: { analysis: newAnalysis }
        });
    }
    catch (error) {
        console.error('Create AI analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const userPayload = (0, jwt_1.getUserFromRequest)(req);
        if (!userPayload) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        const { id } = req.params;
        const { analysis_type, input_data, result_data, confidence_score, processing_time_ms } = req.body;
        if (analysis_type !== undefined && !['chord_progression', 'melody_analysis', 'rhythm_analysis', 'harmony_suggestion', 'mixing_advice', 'mastering_tips'].includes(analysis_type)) {
            res.status(400).json({
                success: false,
                error: 'Invalid analysis type'
            });
            return;
        }
        if (confidence_score !== undefined && (confidence_score < 0 || confidence_score > 1)) {
            res.status(400).json({
                success: false,
                error: 'Confidence score must be between 0 and 1'
            });
            return;
        }
        if (processing_time_ms !== undefined && processing_time_ms < 0) {
            res.status(400).json({
                success: false,
                error: 'Processing time must be non-negative'
            });
            return;
        }
        const updateData = {};
        if (analysis_type !== undefined)
            updateData.analysis_type = analysis_type;
        if (input_data !== undefined)
            updateData.input_data = input_data;
        if (result_data !== undefined)
            updateData.result = result_data;
        if (confidence_score !== undefined)
            updateData.confidence_score = confidence_score;
        if (processing_time_ms !== undefined)
            updateData.processing_time_ms = processing_time_ms;
        const { data: updatedAnalysis, error } = await supabase_1.supabase
            .from('ai_analyses')
            .update(updateData)
            .eq('id', id)
            .eq('project_id', await getProjectIdForAnalysis(id, userPayload.userId))
            .select('*')
            .single();
        if (error || !updatedAnalysis) {
            res.status(404).json({
                success: false,
                error: 'AI analysis not found or update failed'
            });
            return;
        }
        res.json({
            success: true,
            message: 'AI analysis updated successfully',
            data: { analysis: updatedAnalysis }
        });
    }
    catch (error) {
        console.error('Update AI analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const userPayload = (0, jwt_1.getUserFromRequest)(req);
        if (!userPayload) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        const { id } = req.params;
        const { data: analysis, error: getError } = await supabase_1.supabase
            .from('ai_analyses')
            .select(`
        id,
        projects!inner(
          user_id
        )
      `)
            .eq('id', id)
            .eq('projects.user_id', userPayload.userId)
            .single();
        if (getError || !analysis) {
            res.status(404).json({
                success: false,
                error: 'AI analysis not found'
            });
            return;
        }
        const { error } = await supabase_1.supabase
            .from('ai_analyses')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Delete AI analysis error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete AI analysis'
            });
            return;
        }
        res.json({
            success: true,
            message: 'AI analysis deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete AI analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/stats/:projectId', async (req, res) => {
    try {
        const userPayload = (0, jwt_1.getUserFromRequest)(req);
        if (!userPayload) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }
        const { projectId } = req.params;
        const { data: project, error: projectError } = await supabase_1.supabase
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .eq('user_id', userPayload.userId)
            .single();
        if (projectError || !project) {
            res.status(404).json({
                success: false,
                error: 'Project not found'
            });
            return;
        }
        const { data: stats, error } = await supabase_1.supabase
            .from('ai_analyses')
            .select('analysis_type, confidence_score, processing_time_ms')
            .eq('project_id', projectId);
        if (error) {
            console.error('Get analysis stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch analysis statistics'
            });
            return;
        }
        const typeCount = {};
        let totalAnalyses = 0;
        let totalProcessingTime = 0;
        let confidenceSum = 0;
        let confidenceCount = 0;
        stats.forEach(analysis => {
            totalAnalyses++;
            typeCount[analysis.analysis_type] = (typeCount[analysis.analysis_type] || 0) + 1;
            if (analysis.processing_time_ms) {
                totalProcessingTime += analysis.processing_time_ms;
            }
            if (analysis.confidence_score !== null) {
                confidenceSum += analysis.confidence_score;
                confidenceCount++;
            }
        });
        const avgConfidence = confidenceCount > 0 ? confidenceSum / confidenceCount : null;
        const avgProcessingTime = totalAnalyses > 0 ? totalProcessingTime / totalAnalyses : 0;
        res.json({
            success: true,
            data: {
                totalAnalyses,
                typeDistribution: typeCount,
                averageConfidence: avgConfidence,
                averageProcessingTime: avgProcessingTime
            }
        });
    }
    catch (error) {
        console.error('Get analysis stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
async function getProjectIdForAnalysis(analysisId, userId) {
    try {
        const { data: analysis, error } = await supabase_1.supabase
            .from('ai_analyses')
            .select(`
        project_id,
        projects!inner(
          user_id
        )
      `)
            .eq('id', analysisId)
            .eq('projects.user_id', userId)
            .single();
        if (error || !analysis) {
            return null;
        }
        return analysis.project_id;
    }
    catch (error) {
        console.error('Get project ID for analysis error:', error);
        return null;
    }
}
exports.default = router;
