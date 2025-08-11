const express = require('express');
const router = express.Router();
const { pool, getClient } = require('../db/connection');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');

// Generate a secure share token
function generateShareToken() {
  return crypto.randomBytes(32).toString('base64url');
}

// Get trip sharing settings
router.get('/trip/:tripId/sharing', auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.user_id;

    // Check if user owns the trip
    const tripCheck = await pool.query(
      'SELECT user_id, visibility, share_token, allow_comments, allow_cloning, share_settings FROM trips WHERE trip_id = $1',
      [tripId]
    );

    if (tripCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Trip not found',
        message: 'Trip not found'
      });
    }

    const trip = tripCheck.rows[0];
    if (trip.user_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view sharing settings for this trip'
      });
    }

    // Get shared users
    const sharedUsers = await pool.query(`
      SELECT 
        ts.share_id,
        ts.permission_level,
        ts.shared_via,
        ts.message,
        ts.settings,
        ts.expires_at,
        ts.is_active,
        ts.created_at,
        u.name,
        u.email,
        u.profile_picture_url
      FROM trip_shares ts
      JOIN users u ON ts.shared_with_user_id = u.user_id
      WHERE ts.trip_id = $1 AND ts.is_active = true
      ORDER BY ts.created_at DESC
    `, [tripId]);

    // Get view count and recent views
    const viewStats = await pool.query(`
      SELECT 
        COUNT(*) as total_views,
        COUNT(DISTINCT viewer_user_id) as unique_viewers,
        COUNT(DISTINCT viewer_ip) as unique_ips
      FROM trip_views 
      WHERE trip_id = $1
    `, [tripId]);

    const recentViews = await pool.query(`
      SELECT 
        tv.viewed_at,
        u.name as viewer_name,
        u.profile_picture_url
      FROM trip_views tv
      LEFT JOIN users u ON tv.viewer_user_id = u.user_id
      WHERE tv.trip_id = $1
      ORDER BY tv.viewed_at DESC
      LIMIT 10
    `, [tripId]);

    res.json({
      success: true,
      data: {
        trip: {
          trip_id: tripId,
          visibility: trip.visibility,
          share_token: trip.share_token,
          allow_comments: trip.allow_comments,
          allow_cloning: trip.allow_cloning,
          share_settings: trip.share_settings
        },
        shared_users: sharedUsers.rows,
        stats: {
          ...viewStats.rows[0],
          recent_views: recentViews.rows
        }
      }
    });

  } catch (error) {
    console.error('Error fetching sharing settings:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch sharing settings'
    });
  }
});

// Update trip visibility and sharing settings
router.put('/trip/:tripId/sharing', auth, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { tripId } = req.params;
    const userId = req.user.user_id;
    const { 
      visibility, 
      allow_comments, 
      allow_cloning, 
      share_settings,
      generate_new_token 
    } = req.body;

    // Check if user owns the trip
    const tripCheck = await client.query(
      'SELECT user_id FROM trips WHERE trip_id = $1',
      [tripId]
    );

    if (tripCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Trip not found',
        message: 'Trip not found'
      });
    }

    if (tripCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to modify this trip'
      });
    }

    // Validate visibility
    const validVisibilities = ['private', 'public', 'unlisted', 'friends_only'];
    if (visibility && !validVisibilities.includes(visibility)) {
      return res.status(400).json({
        error: 'Invalid visibility',
        message: 'Visibility must be one of: private, public, unlisted, friends_only'
      });
    }

    // Generate new share token if requested or if changing to public/unlisted
    let shareToken = null;
    if (generate_new_token || (visibility && ['public', 'unlisted'].includes(visibility))) {
      shareToken = generateShareToken();
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (visibility) {
      updateFields.push(`visibility = $${paramIndex++}`);
      updateValues.push(visibility);
      
      // Also update is_public for backward compatibility
      updateFields.push(`is_public = $${paramIndex++}`);
      updateValues.push(visibility === 'public');
    }

    if (allow_comments !== undefined) {
      updateFields.push(`allow_comments = $${paramIndex++}`);
      updateValues.push(allow_comments);
    }

    if (allow_cloning !== undefined) {
      updateFields.push(`allow_cloning = $${paramIndex++}`);
      updateValues.push(allow_cloning);
    }

    if (share_settings) {
      updateFields.push(`share_settings = $${paramIndex++}`);
      updateValues.push(JSON.stringify(share_settings));
    }

    if (shareToken) {
      updateFields.push(`share_token = $${paramIndex++}`);
      updateValues.push(shareToken);
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(tripId);

    const updateQuery = `
      UPDATE trips 
      SET ${updateFields.join(', ')}
      WHERE trip_id = $${paramIndex}
      RETURNING trip_id, visibility, share_token, allow_comments, allow_cloning, share_settings
    `;

    const result = await client.query(updateQuery, updateValues);
    
    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Sharing settings updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating sharing settings:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update sharing settings'
    });
  } finally {
    client.release();
  }
});

// Share trip with specific users
router.post('/trip/:tripId/share', auth, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { tripId } = req.params;
    const userId = req.user.user_id;
    const { emails, permission_level = 'view', message, settings } = req.body;

    // Check if user owns the trip
    const tripCheck = await client.query(
      'SELECT user_id, title FROM trips WHERE trip_id = $1',
      [tripId]
    );

    if (tripCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Trip not found',
        message: 'Trip not found'
      });
    }

    if (tripCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to share this trip'
      });
    }

    const validPermissions = ['view', 'edit', 'admin'];
    if (!validPermissions.includes(permission_level)) {
      return res.status(400).json({
        error: 'Invalid permission level',
        message: 'Permission level must be one of: view, edit, admin'
      });
    }

    const shareResults = [];
    const failedShares = [];

    for (const email of emails) {
      try {
        // Find user by email
        const userResult = await client.query(
          'SELECT user_id, name FROM users WHERE email = $1',
          [email]
        );

        if (userResult.rows.length === 0) {
          failedShares.push({ email, reason: 'User not found' });
          continue;
        }

        const targetUserId = userResult.rows[0].user_id;

        // Check if already shared
        const existingShare = await client.query(
          'SELECT share_id FROM trip_shares WHERE trip_id = $1 AND shared_with_user_id = $2 AND is_active = true',
          [tripId, targetUserId]
        );

        if (existingShare.rows.length > 0) {
          failedShares.push({ email, reason: 'Already shared with this user' });
          continue;
        }

        // Create share
        const shareResult = await client.query(`
          INSERT INTO trip_shares (
            trip_id, 
            shared_by_user_id, 
            shared_with_user_id, 
            permission_level, 
            shared_via, 
            message, 
            settings
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING share_id, created_at
        `, [
          tripId, 
          userId, 
          targetUserId, 
          permission_level, 
          'direct', 
          message || `${req.user.name} shared a trip with you: ${tripCheck.rows[0].title}`,
          JSON.stringify(settings || { can_comment: false, can_suggest: false })
        ]);

        shareResults.push({
          email,
          user_name: userResult.rows[0].name,
          share_id: shareResult.rows[0].share_id,
          created_at: shareResult.rows[0].created_at
        });

        // Create notification for the shared user
        await client.query(`
          INSERT INTO notifications (
            user_id, 
            type, 
            title, 
            message, 
            related_id
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          targetUserId,
          'trip_share',
          'Trip Shared With You',
          `${req.user.name} shared their trip "${tripCheck.rows[0].title}" with you`,
          tripId
        ]);

      } catch (shareError) {
        console.error('Error sharing with user:', email, shareError);
        failedShares.push({ email, reason: 'Internal error' });
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Trip sharing completed',
      data: {
        successful_shares: shareResults,
        failed_shares: failedShares
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sharing trip:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to share trip'
    });
  } finally {
    client.release();
  }
});

// Get public trip by share token
router.get('/public/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;
    const viewerUserId = req.user ? req.user.user_id : null;
    const viewerIp = req.ip || req.connection.remoteAddress;

    // Find trip by share token
    const tripResult = await pool.query(`
      SELECT 
        t.*,
        u.name as creator_name,
        u.profile_picture_url as creator_avatar
      FROM trips t
      JOIN users u ON t.user_id = u.user_id
      WHERE t.share_token = $1 AND t.visibility IN ('public', 'unlisted')
    `, [shareToken]);

    if (tripResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Trip not found',
        message: 'This trip is not available or the link has expired'
      });
    }

    const trip = tripResult.rows[0];

    // Record view
    await pool.query(`
      INSERT INTO trip_views (trip_id, viewer_user_id, viewer_ip, session_id)
      VALUES ($1, $2, $3, $4)
    `, [trip.trip_id, viewerUserId, viewerIp, req.sessionID || 'anonymous']);

    // Get trip stops and activities
    const stopsResult = await pool.query(`
      SELECT 
        ts.*,
        c.name as city_name,
        co.name as country_name
      FROM trip_stops ts
      JOIN cities c ON ts.city_id = c.city_id
      JOIN countries co ON c.country_id = co.country_id
      WHERE ts.trip_id = $1
      ORDER BY ts.stop_order
    `, [trip.trip_id]);

    // Get comments if allowed
    let comments = [];
    if (trip.allow_comments) {
      const commentsResult = await pool.query(`
        SELECT 
          tc.*,
          u.name as commenter_name,
          u.profile_picture_url as commenter_avatar
        FROM trip_comments tc
        JOIN users u ON tc.user_id = u.user_id
        WHERE tc.trip_id = $1 AND tc.status = 'active'
        ORDER BY tc.created_at DESC
      `, [trip.trip_id]);
      comments = commentsResult.rows;
    }

    // Get like count and user like status
    const likeStats = await pool.query(`
      SELECT 
        COUNT(*) as like_count,
        BOOL_OR(user_id = $2) as user_liked
      FROM trip_likes 
      WHERE trip_id = $1
    `, [trip.trip_id, viewerUserId]);

    res.json({
      success: true,
      data: {
        trip: {
          ...trip,
          stops: stopsResult.rows
        },
        comments,
        stats: {
          ...likeStats.rows[0],
          like_count: parseInt(likeStats.rows[0].like_count)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching public trip:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch trip'
    });
  }
});

// Like/unlike a public trip
router.post('/public/:shareToken/like', auth, async (req, res) => {
  try {
    const { shareToken } = req.params;
    const userId = req.user.user_id;

    // Find trip by share token
    const tripResult = await pool.query(
      'SELECT trip_id FROM trips WHERE share_token = $1 AND visibility IN (\'public\', \'unlisted\')',
      [shareToken]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Trip not found',
        message: 'This trip is not available'
      });
    }

    const tripId = tripResult.rows[0].trip_id;

    // Check if already liked
    const existingLike = await pool.query(
      'SELECT like_id FROM trip_likes WHERE trip_id = $1 AND user_id = $2',
      [tripId, userId]
    );

    if (existingLike.rows.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM trip_likes WHERE trip_id = $1 AND user_id = $2',
        [tripId, userId]
      );
      
      res.json({
        success: true,
        message: 'Trip unliked',
        data: { liked: false }
      });
    } else {
      // Like
      await pool.query(
        'INSERT INTO trip_likes (trip_id, user_id) VALUES ($1, $2)',
        [tripId, userId]
      );
      
      res.json({
        success: true,
        message: 'Trip liked',
        data: { liked: true }
      });
    }

  } catch (error) {
    console.error('Error toggling trip like:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update like status'
    });
  }
});

// Add comment to a public trip
router.post('/public/:shareToken/comment', auth, async (req, res) => {
  try {
    const { shareToken } = req.params;
    const userId = req.user.user_id;
    const { comment_text, is_suggestion, suggested_changes, parent_comment_id } = req.body;

    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid comment',
        message: 'Comment text is required'
      });
    }

    // Find trip and check if comments are allowed
    const tripResult = await pool.query(
      'SELECT trip_id, allow_comments FROM trips WHERE share_token = $1 AND visibility IN (\'public\', \'unlisted\')',
      [shareToken]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Trip not found',
        message: 'This trip is not available'
      });
    }

    const { trip_id: tripId, allow_comments } = tripResult.rows[0];

    if (!allow_comments) {
      return res.status(403).json({
        error: 'Comments disabled',
        message: 'Comments are not allowed on this trip'
      });
    }

    // Insert comment
    const commentResult = await pool.query(`
      INSERT INTO trip_comments (
        trip_id, 
        user_id, 
        comment_text, 
        parent_comment_id, 
        is_suggestion, 
        suggested_changes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING comment_id, created_at
    `, [
      tripId, 
      userId, 
      comment_text.trim(), 
      parent_comment_id || null, 
      is_suggestion || false, 
      suggested_changes ? JSON.stringify(suggested_changes) : null
    ]);

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment_id: commentResult.rows[0].comment_id,
        created_at: commentResult.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to add comment'
    });
  }
});

module.exports = router;
