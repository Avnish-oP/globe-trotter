const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');
const { authenticateToken } = require('../utils/middleware');
const { asyncHandler } = require('../utils/errorHandler');

/**
 * @route GET /api/dashboard
 * @desc Get dashboard overview data
 * @access Private
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.user_id;

  // Get user stats
  const tripsCount = await query(
    'SELECT COUNT(*) as count FROM trips WHERE user_id = $1',
    [userId]
  );

  const upcomingTripsCount = await query(
    'SELECT COUNT(*) as count FROM trips WHERE user_id = $1 AND start_date >= CURRENT_DATE',
    [userId]
  );

  const totalBudget = await query(
    'SELECT COALESCE(SUM(total_budget), 0) as total FROM trips WHERE user_id = $1',
    [userId]
  );

  const countriesVisited = await query(
    `SELECT COUNT(DISTINCT c.country_id) as count 
     FROM trips t 
     JOIN trip_stops ts ON t.trip_id = ts.trip_id 
     JOIN cities ci ON ts.city_id = ci.city_id 
     JOIN countries c ON ci.country_id = c.country_id 
     WHERE t.user_id = $1 AND t.status = 'completed'`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      stats: {
        totalTrips: parseInt(tripsCount.rows[0].count),
        upcomingTrips: parseInt(upcomingTripsCount.rows[0].count),
        totalBudget: parseFloat(totalBudget.rows[0].total),
        countriesVisited: parseInt(countriesVisited.rows[0].count)
      }
    }
  });
}));

/**
 * @route GET /api/dashboard/upcoming-trips
 * @desc Get upcoming trips for the current user
 * @access Private
 */
router.get('/upcoming-trips', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  const limit = parseInt(req.query.limit) || 5;

  const upcomingTrips = await query(
    `SELECT t.trip_id, t.title, t.description, t.start_date, t.end_date, 
            t.total_budget, t.currency, t.cover_image_url, t.status,
            array_agg(DISTINCT c.name) as cities
     FROM trips t
     LEFT JOIN trip_stops ts ON t.trip_id = ts.trip_id
     LEFT JOIN cities c ON ts.city_id = c.city_id
     WHERE t.user_id = $1 AND t.start_date >= CURRENT_DATE
     GROUP BY t.trip_id, t.title, t.description, t.start_date, t.end_date, 
              t.total_budget, t.currency, t.cover_image_url, t.status
     ORDER BY t.start_date ASC
     LIMIT $2`,
    [userId, limit]
  );

  res.json({
    success: true,
    data: upcomingTrips.rows
  });
}));

/**
 * @route GET /api/dashboard/popular-cities
 * @desc Get popular cities based on popularity score
 * @access Private
 */
router.get('/popular-cities', authenticateToken, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  const popularCities = await query(
    `SELECT c.city_id, c.name, c.description, c.image_url, 
            c.popularity_score, co.name as country_name, co.country_code
     FROM cities c
     JOIN countries co ON c.country_id = co.country_id
     ORDER BY c.popularity_score DESC, c.name ASC
     LIMIT $1`,
    [limit]
  );

  res.json({
    success: true,
    data: popularCities.rows
  });
}));

/**
 * @route GET /api/dashboard/recommended-destinations
 * @desc Get recommended destinations based on user preferences
 * @access Private
 */
router.get('/recommended-destinations', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.user_id;

  // Get user preferences
  const userPrefs = await query(
    'SELECT fav_activities, fav_places FROM users WHERE user_id = $1',
    [userId]
  );

  const user = userPrefs.rows[0];
  let recommendedCities;

  if (user.fav_activities && user.fav_activities.length > 0) {
    // Find cities with activities matching user preferences
    recommendedCities = await query(
      `SELECT DISTINCT c.city_id, c.name, c.description, c.image_url, 
              co.name as country_name, co.country_code,
              COUNT(a.activity_id) as matching_activities
       FROM cities c
       JOIN countries co ON c.country_id = co.country_id
       LEFT JOIN activities a ON c.city_id = a.city_id
       LEFT JOIN activity_categories ac ON a.category_id = ac.category_id
       WHERE a.is_active = true 
       AND (ac.name = ANY($1) OR a.name ILIKE ANY($2))
       GROUP BY c.city_id, c.name, c.description, c.image_url, co.name, co.country_code
       ORDER BY matching_activities DESC, c.popularity_score DESC
       LIMIT 10`,
      [
        user.fav_activities,
        user.fav_activities.map(activity => `%${activity}%`)
      ]
    );
  } else {
    // Fallback to popular cities if no preferences
    recommendedCities = await query(
      `SELECT c.city_id, c.name, c.description, c.image_url, 
              co.name as country_name, co.country_code
       FROM cities c
       JOIN countries co ON c.country_id = co.country_id
       ORDER BY c.popularity_score DESC
       LIMIT 10`
    );
  }

  res.json({
    success: true,
    data: recommendedCities.rows
  });
}));

/**
 * @route GET /api/dashboard/search-trips
 * @desc Search public trips by destination name or date
 * @access Private
 */
router.get('/search-trips', authenticateToken, asyncHandler(async (req, res) => {
  const { q: query } = req.query;
  const userId = req.user.user_id;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const publicTrips = await query(
    `SELECT t.trip_id, t.title, t.description, t.start_date, t.end_date,
            t.total_budget, t.currency, t.cover_image_url, t.trip_type,
            u.name as created_by, u.user_id as creator_id,
            array_agg(DISTINCT c.name) as cities,
            array_agg(DISTINCT co.name) as countries
     FROM trips t
     JOIN users u ON t.user_id = u.user_id
     LEFT JOIN trip_stops ts ON t.trip_id = ts.trip_id
     LEFT JOIN cities c ON ts.city_id = c.city_id
     LEFT JOIN countries co ON c.country_id = co.country_id
     WHERE t.is_public = true 
     AND t.user_id != $1
     AND (
       t.title ILIKE $2 
       OR t.description ILIKE $2 
       OR c.name ILIKE $2 
       OR co.name ILIKE $2
     )
     GROUP BY t.trip_id, t.title, t.description, t.start_date, t.end_date,
              t.total_budget, t.currency, t.cover_image_url, t.trip_type,
              u.name, u.user_id
     ORDER BY t.start_date DESC
     LIMIT 20`,
    [userId, `%${query}%`]
  );

  res.json({
    success: true,
    data: publicTrips.rows
  });
}));

/**
 * @route POST /api/dashboard/follow-trip/:tripId
 * @desc Follow a public trip (add to trip_shares)
 * @access Private
 */
router.post('/follow-trip/:tripId', authenticateToken, asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user.user_id;

  // Check if trip exists and is public
  const trip = await query(
    'SELECT trip_id, user_id, is_public FROM trips WHERE trip_id = $1',
    [tripId]
  );

  if (trip.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Trip not found'
    });
  }

  const tripData = trip.rows[0];

  if (!tripData.is_public) {
    return res.status(403).json({
      success: false,
      message: 'This trip is not public'
    });
  }

  if (tripData.user_id === userId) {
    return res.status(400).json({
      success: false,
      message: 'You cannot follow your own trip'
    });
  }

  // Check if already following
  const existingShare = await query(
    'SELECT share_id FROM trip_shares WHERE trip_id = $1 AND shared_with_user_id = $2',
    [tripId, userId]
  );

  if (existingShare.rows.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'You are already following this trip'
    });
  }

  // Create trip share entry
  const shareResult = await query(
    `INSERT INTO trip_shares (trip_id, shared_by_user_id, shared_with_user_id, permission_level)
     VALUES ($1, $2, $3, 'view')
     RETURNING share_id`,
    [tripId, tripData.user_id, userId]
  );

  res.json({
    success: true,
    message: 'Successfully followed trip',
    data: { shareId: shareResult.rows[0].share_id }
  });
}));

module.exports = router;
