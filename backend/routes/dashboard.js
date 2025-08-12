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
 * @desc Search public trips with advanced filtering options
 * @access Private
 */
router.get('/search-trips', authenticateToken, asyncHandler(async (req, res) => {
  const { 
    q, 
    destination, 
    start_date, 
    end_date, 
    activity, 
    budget_min, 
    budget_max, 
    country,
    sort = 'created_at',
    order = 'desc',
    limit = 10,
    offset = 0
  } = req.query;
  
  const userId = req.user.user_id;

  // Build the base query
  let sqlQuery = `
    SELECT DISTINCT 
      t.trip_id, 
      t.title, 
      t.description, 
      t.start_date, 
      t.end_date,
      t.total_budget, 
      t.currency, 
      t.cover_image_url,
      t.is_public as visibility,
      COALESCE('public') as share_token,
      u.name as creator_name, 
      u.profile_picture_url as creator_profile_picture,
      array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as cities,
      array_agg(DISTINCT co.name) FILTER (WHERE co.name IS NOT NULL) as countries,
      array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) as activities,
      0 as likes_count,
      0 as views_count,
      t.created_at
    FROM trips t
    JOIN users u ON t.user_id = u.user_id
    LEFT JOIN trip_stops tp ON t.trip_id = tp.trip_id
    LEFT JOIN cities c ON tp.city_id = c.city_id
    LEFT JOIN countries co ON c.country_id = co.country_id
    LEFT JOIN trip_activities ta ON tp.stop_id = ta.stop_id
    LEFT JOIN activities a ON ta.activity_id = a.activity_id
    WHERE t.is_public = true 
    AND t.user_id != $1
    AND t.status != 'draft'
  `;

  const params = [userId];
  let paramIndex = 2;

  // Add search conditions
  if (q) {
    sqlQuery += ` AND (
      t.title ILIKE $${paramIndex} 
      OR t.description ILIKE $${paramIndex} 
      OR c.name ILIKE $${paramIndex} 
      OR co.name ILIKE $${paramIndex}
      OR a.name ILIKE $${paramIndex}
      OR a.description ILIKE $${paramIndex}
    )`;
    params.push(`%${q}%`);
    paramIndex++;
  }

  if (destination) {
    sqlQuery += ` AND (c.name ILIKE $${paramIndex} OR co.name ILIKE $${paramIndex})`;
    params.push(`%${destination}%`);
    paramIndex++;
  }

  if (start_date) {
    sqlQuery += ` AND t.start_date >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }

  if (end_date) {
    sqlQuery += ` AND t.end_date <= $${paramIndex}`;
    params.push(end_date);
    paramIndex++;
  }

  if (activity) {
    sqlQuery += ` AND a.name ILIKE $${paramIndex}`;
    params.push(`%${activity}%`);
    paramIndex++;
  }

  if (budget_min) {
    sqlQuery += ` AND t.total_budget >= $${paramIndex}`;
    params.push(parseFloat(budget_min));
    paramIndex++;
  }

  if (budget_max) {
    sqlQuery += ` AND t.total_budget <= $${paramIndex}`;
    params.push(parseFloat(budget_max));
    paramIndex++;
  }

  if (country) {
    sqlQuery += ` AND co.name ILIKE $${paramIndex}`;
    params.push(`%${country}%`);
    paramIndex++;
  }

  sqlQuery += `
    GROUP BY t.trip_id, t.title, t.description, t.start_date, t.end_date,
             t.total_budget, t.currency, t.cover_image_url,
             u.name, u.profile_picture_url, t.created_at
  `;

  // Add sorting
  const validSorts = {
    'created_at': 't.created_at',
    'likes': 'likes_count',
    'start_date': 't.start_date',
    'budget': 't.total_budget'
  };

  const sortField = validSorts[sort] || 't.created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
  sqlQuery += ` ORDER BY ${sortField} ${sortOrder}`;

  // Add pagination
  sqlQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit), parseInt(offset));

  // Get total count for pagination
  let countQuery = `
    SELECT COUNT(DISTINCT t.trip_id) as total
    FROM trips t
    JOIN users u ON t.user_id = u.user_id
    LEFT JOIN trip_stops tp ON t.trip_id = tp.trip_id
    LEFT JOIN cities c ON tp.city_id = c.city_id
    LEFT JOIN countries co ON c.country_id = co.country_id
    LEFT JOIN trip_activities ta ON tp.stop_id = ta.stop_id
    LEFT JOIN activities a ON ta.activity_id = a.activity_id
    WHERE t.is_public = true 
    AND t.user_id != $1
    AND t.status != 'draft'
  `;

  // Add same filters to count query
  let countParams = [userId];
  let countParamIndex = 2;

  if (q) {
    countQuery += ` AND (
      t.title ILIKE $${countParamIndex} 
      OR t.description ILIKE $${countParamIndex} 
      OR c.name ILIKE $${countParamIndex} 
      OR co.name ILIKE $${countParamIndex}
      OR a.name ILIKE $${countParamIndex}
      OR a.description ILIKE $${countParamIndex}
    )`;
    countParams.push(`%${q}%`);
    countParamIndex++;
  }

  if (destination) {
    countQuery += ` AND (c.name ILIKE $${countParamIndex} OR co.name ILIKE $${countParamIndex})`;
    countParams.push(`%${destination}%`);
    countParamIndex++;
  }

  if (start_date) {
    countQuery += ` AND t.start_date >= $${countParamIndex}`;
    countParams.push(start_date);
    countParamIndex++;
  }

  if (end_date) {
    countQuery += ` AND t.end_date <= $${countParamIndex}`;
    countParams.push(end_date);
    countParamIndex++;
  }

  if (activity) {
    countQuery += ` AND a.name ILIKE $${countParamIndex}`;
    countParams.push(`%${activity}%`);
    countParamIndex++;
  }

  if (budget_min) {
    countQuery += ` AND t.total_budget >= $${countParamIndex}`;
    countParams.push(parseFloat(budget_min));
    countParamIndex++;
  }

  if (budget_max) {
    countQuery += ` AND t.total_budget <= $${countParamIndex}`;
    countParams.push(parseFloat(budget_max));
    countParamIndex++;
  }

  if (country) {
    countQuery += ` AND co.name ILIKE $${countParamIndex}`;
    countParams.push(`%${country}%`);
    countParamIndex++;
  }

  // Execute both queries
  const [tripsResult, countResult] = await Promise.all([
    query(sqlQuery, params),
    query(countQuery, countParams)
  ]);

  res.json({
    success: true,
    data: {
      trips: tripsResult.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
}));
/**
 * @route GET /api/dashboard/search-filters
 * @desc Get available filter options for search
 * @access Private
 */
router.get('/search-filters', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // Get all countries that have public trips
    const countries = await query(`
      SELECT DISTINCT co.country_id, co.name, co.country_code, COUNT(t.trip_id) as trip_count
      FROM countries co
      JOIN cities c ON co.country_id = c.country_id
      JOIN trip_stops ts ON c.city_id = ts.city_id
      JOIN trips t ON ts.trip_id = t.trip_id
      WHERE t.is_public = true AND t.status != 'draft'
      GROUP BY co.country_id, co.name, co.country_code
      ORDER BY trip_count DESC, co.name ASC
    `);

    // Get all activity types from activities
    const activities = await query(`
      SELECT DISTINCT a.name as activity, COUNT(t.trip_id) as count
      FROM activities a
      JOIN trip_activities ta ON a.activity_id = ta.activity_id
      JOIN trip_stops ts ON ta.stop_id = ts.stop_id
      JOIN trips t ON ts.trip_id = t.trip_id
      WHERE t.is_public = true AND t.status != 'draft'
      AND a.name IS NOT NULL AND a.name != ''
      GROUP BY a.name
      ORDER BY count DESC, a.name ASC
      LIMIT 50
    `);

    // Get budget ranges
    const budgetRanges = [
      { min: 0, max: 500, count: 0 },
      { min: 500, max: 1000, count: 0 },
      { min: 1000, max: 2500, count: 0 },
      { min: 2500, max: 5000, count: 0 },
      { min: 5000, max: 10000, count: 0 },
      { min: 10000, max: null, count: 0 }
    ];

    // Get actual budget distribution
    for (let range of budgetRanges) {
      const countQuery = range.max 
        ? `SELECT COUNT(*) as count FROM trips WHERE is_public = true AND status != 'draft' AND total_budget >= $1 AND total_budget < $2`
        : `SELECT COUNT(*) as count FROM trips WHERE is_public = true AND status != 'draft' AND total_budget >= $1`;
      
      const countParams = range.max ? [range.min, range.max] : [range.min];
      const result = await query(countQuery, countParams);
      range.count = parseInt(result.rows[0].count);
    }

    // Get date ranges
    const dateRanges = [
      { range: 'next_month', count: 0 },
      { range: 'next_3_months', count: 0 },
      { range: 'next_6_months', count: 0 },
      { range: 'next_year', count: 0 }
    ];

    // Sort options
    const sortOptions = [
      { value: 'created_at', label: 'Newest First' },
      { value: 'likes', label: 'Most Liked' },
      { value: 'start_date', label: 'Latest Trips' },
      { value: 'budget', label: 'Budget' }
    ];

    res.json({
      success: true,
      data: {
        countries: countries.rows,
        activities: activities.rows,
        budget_ranges: budgetRanges,
        date_ranges: dateRanges,
        sort_options: sortOptions
      }
    });
  } catch (error) {
    console.error('Error fetching search filters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching search filters'
    });
  }
}));

/**
 * @route GET /api/dashboard/popular-trips
 * @desc Get popular public trips for recommendations
 * @access Private
 */
router.get('/popular-trips', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  const limit = parseInt(req.query.limit) || 10;

  const popularTrips = await query(
    `SELECT t.trip_id, t.title, t.description, t.start_date, t.end_date,
            t.total_budget, t.currency, t.cover_image_url, t.trip_type,
            u.name as created_by, u.user_id as creator_id,
            array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as cities,
            array_agg(DISTINCT co.name) FILTER (WHERE co.name IS NOT NULL) as countries,
            COUNT(DISTINCT ts_shares.share_id) as follower_count
     FROM trips t
     JOIN users u ON t.user_id = u.user_id
     LEFT JOIN trip_stops ts ON t.trip_id = ts.trip_id
     LEFT JOIN cities c ON ts.city_id = c.city_id
     LEFT JOIN countries co ON c.country_id = co.country_id
     LEFT JOIN trip_shares ts_shares ON t.trip_id = ts_shares.trip_id
     WHERE t.is_public = true 
     AND t.user_id != $1
     AND t.status != 'draft'
     GROUP BY t.trip_id, t.title, t.description, t.start_date, t.end_date,
              t.total_budget, t.currency, t.cover_image_url, t.trip_type,
              u.name, u.user_id
     ORDER BY follower_count DESC, t.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  res.json({
    success: true,
    data: popularTrips.rows
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
