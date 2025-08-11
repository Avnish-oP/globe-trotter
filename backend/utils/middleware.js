const { verifyToken } = require('../utils/auth');
const { query } = require('../db/connection');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify the token
    const decoded = verifyToken(token);
    
    // Fetch user from database to ensure they still exist and are active
    const userResult = await query(
      'SELECT user_id, email, name, is_active, is_verified FROM users WHERE user_id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach user info to request object
    req.user = {
      userId: user.user_id,
      email: user.email,
      name: user.name,
      isVerified: user.is_verified
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Middleware to check if user is verified (optional requirement)
 */
const requireVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required to access this resource'
    });
  }
  next();
};

/**
 * Middleware to check if user owns the resource
 */
const checkResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.tripId || req.params.activityId;
      const userId = req.user.userId;

      let queryText;
      switch (resourceType) {
        case 'trip':
          queryText = 'SELECT user_id FROM trips WHERE trip_id = $1';
          break;
        case 'trip_stop':
          queryText = `
            SELECT t.user_id FROM trips t 
            JOIN trip_stops ts ON t.trip_id = ts.trip_id 
            WHERE ts.stop_id = $1
          `;
          break;
        case 'trip_activity':
          queryText = `
            SELECT t.user_id FROM trips t 
            JOIN trip_stops ts ON t.trip_id = ts.trip_id 
            JOIN trip_activities ta ON ts.stop_id = ta.stop_id 
            WHERE ta.trip_activity_id = $1
          `;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid resource type'
          });
      }

      const result = await query(queryText, [resourceId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      if (result.rows[0].user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource'
        });
      }

      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      const userResult = await query(
        'SELECT user_id, email, name, is_active, is_verified FROM users WHERE user_id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
        const user = userResult.rows[0];
        req.user = {
          userId: user.user_id,
          email: user.email,
          name: user.name,
          isVerified: user.is_verified
        };
      }
    }

    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

/**
 * Middleware to check admin privileges
 */
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await query(
      'SELECT is_admin FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking admin privileges'
    });
  }
};

module.exports = {
  authenticateToken,
  requireVerification,
  checkResourceOwnership,
  optionalAuth,
  requireAdmin
};
