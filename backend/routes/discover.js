const express = require('express');
const pool = require('../db/connection');
const { auth } = require('../middleware/auth');
const { validationResult } = require('express-validator');

const router = express.Router();

/**
 * @route GET /api/discover/public-trips
 * @desc Get public trips with search and filtering
 * @access Public
 */
router.get('/public-trips', async (req, res) => {
  try {
    const {
      search = '',
      location = '',
      budget_min = 0,
      budget_max = 999999,
      duration_min = 0,
      duration_max = 365,
      activities = '',
      page = 1,
      limit = 20,
      sort_by = 'popularity' // popularity, recent, budget_low, budget_high
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build search conditions
    let whereConditions = ["t.visibility = 'public'"];
    let queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereConditions.push(`(
        t.title ILIKE $${paramCount} OR 
        t.description ILIKE $${paramCount} OR
        u.name ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
    }

    if (location) {
      paramCount++;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM trip_stops ts 
        JOIN cities c ON ts.city_id = c.city_id 
        JOIN countries co ON c.country_id = co.country_id 
        WHERE ts.trip_id = t.trip_id AND (
          c.name ILIKE $${paramCount} OR 
          co.name ILIKE $${paramCount}
        )
      )`);
      queryParams.push(`%${location}%`);
    }

    if (budget_min > 0) {
      paramCount++;
      whereConditions.push(`t.total_budget >= $${paramCount}`);
      queryParams.push(budget_min);
    }

    if (budget_max < 999999) {
      paramCount++;
      whereConditions.push(`t.total_budget <= $${paramCount}`);
      queryParams.push(budget_max);
    }

    // Duration filter
    paramCount++;
    whereConditions.push(`(t.end_date - t.start_date) >= $${paramCount}`);
    queryParams.push(duration_min);

    paramCount++;
    whereConditions.push(`(t.end_date - t.start_date) <= $${paramCount}`);
    queryParams.push(duration_max);

    // Activities filter
    if (activities) {
      const activityList = activities.split(',').map(a => a.trim());
      const activityConditions = activityList.map(() => {
        paramCount++;
        return `t.description ILIKE $${paramCount}`;
      });
      whereConditions.push(`(${activityConditions.join(' OR ')})`);
      activityList.forEach(activity => {
        queryParams.push(`%${activity}%`);
      });
    }

    // Sort conditions
    let orderBy = 'tv.view_count DESC, tl.like_count DESC, t.created_at DESC';
    switch (sort_by) {
      case 'recent':
        orderBy = 't.created_at DESC';
        break;
      case 'budget_low':
        orderBy = 't.total_budget ASC NULLS LAST, tv.view_count DESC';
        break;
      case 'budget_high':
        orderBy = 't.total_budget DESC NULLS LAST, tv.view_count DESC';
        break;
      case 'duration_short':
        orderBy = '(t.end_date - t.start_date) ASC, tv.view_count DESC';
        break;
      case 'duration_long':
        orderBy = '(t.end_date - t.start_date) DESC, tv.view_count DESC';
        break;
      default: // popularity
        orderBy = 'tv.view_count DESC, tl.like_count DESC, t.created_at DESC';
    }

    // Add pagination parameters
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;
    queryParams.push(parseInt(limit), parseInt(offset));

    const query = `
      SELECT 
        t.trip_id,
        t.title,
        t.description,
        t.start_date,
        t.end_date,
        t.total_budget,
        t.currency,
        t.cover_image_url,
        t.status,
        t.share_token,
        t.created_at,
        u.name as creator_name,
        u.profile_picture_url as creator_avatar,
        COALESCE(tv.view_count, 0) as view_count,
        COALESCE(tl.like_count, 0) as like_count,
        COALESCE(tc.comment_count, 0) as comment_count,
        (t.end_date - t.start_date) as duration_days,
        array_agg(DISTINCT jsonb_build_object(
          'city_name', c.name,
          'country_name', co.name,
          'arrival_date', ts.arrival_date,
          'departure_date', ts.departure_date
        )) FILTER (WHERE c.name IS NOT NULL) as destinations
      FROM trips t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN trip_stops ts ON t.trip_id = ts.trip_id
      LEFT JOIN cities c ON ts.city_id = c.city_id
      LEFT JOIN countries co ON c.country_id = co.country_id
      LEFT JOIN (
        SELECT trip_id, COUNT(*) as view_count 
        FROM trip_views 
        GROUP BY trip_id
      ) tv ON t.trip_id = tv.trip_id
      LEFT JOIN (
        SELECT trip_id, COUNT(*) as like_count 
        FROM trip_likes 
        GROUP BY trip_id
      ) tl ON t.trip_id = tl.trip_id
      LEFT JOIN (
        SELECT trip_id, COUNT(*) as comment_count 
        FROM trip_comments 
        GROUP BY trip_id
      ) tc ON t.trip_id = tc.trip_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY t.trip_id, t.title, t.description, t.start_date, t.end_date,
               t.total_budget, t.currency, t.cover_image_url, t.status,
               t.share_token, t.created_at, u.name, u.profile_picture_url,
               tv.view_count, tl.like_count, tc.comment_count
      ORDER BY ${orderBy}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT t.trip_id) as total
      FROM trips t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN trip_stops ts ON t.trip_id = ts.trip_id
      LEFT JOIN cities c ON ts.city_id = c.city_id
      LEFT JOIN countries co ON c.country_id = co.country_id
      WHERE ${whereConditions.join(' AND ')}
    `;

    const [tripsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset
    ]);

    const trips = tripsResult.rows.map(trip => ({
      ...trip,
      destinations: trip.destinations || []
    }));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        trips,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: total,
          items_per_page: parseInt(limit),
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1
        },
        filters: {
          search,
          location,
          budget_range: [budget_min, budget_max],
          duration_range: [duration_min, duration_max],
          activities: activities ? activities.split(',') : [],
          sort_by
        }
      }
    });

  } catch (error) {
    console.error('Error fetching public trips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public trips',
      error: error.message
    });
  }
});

/**
 * @route GET /api/discover/recommendations
 * @desc Get personalized trip recommendations based on user preferences
 * @access Private
 */
router.get('/recommendations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    // Get user preferences
    const userQuery = `
      SELECT fav_activities, fav_places, country_origin, travel_style
      FROM users 
      WHERE user_id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);
    const userPrefs = userResult.rows[0];

    // Get user's past trips to understand preferences
    const userTripsQuery = `
      SELECT DISTINCT c.name as city_name, co.name as country_name
      FROM trips t
      JOIN trip_stops ts ON t.trip_id = ts.trip_id
      JOIN cities c ON ts.city_id = c.city_id
      JOIN countries co ON c.country_id = co.country_id
      WHERE t.user_id = $1
    `;
    const userTripsResult = await pool.query(userTripsQuery, [userId]);
    const visitedPlaces = userTripsResult.rows;

    // Build recommendation query based on user preferences
    let whereConditions = [
      "t.visibility = 'public'",
      "t.user_id != $1" // Exclude user's own trips
    ];
    let queryParams = [userId];
    let paramCount = 1;

    // Prefer trips with similar activities if user has preferences
    let selectScoring = '';
    if (userPrefs?.fav_activities) {
      const activities = userPrefs.fav_activities;
      selectScoring += `, (
        CASE 
          WHEN t.description ILIKE '%${activities.replace(/'/g, "''")}%' THEN 10
          ELSE 0
        END
      ) as activity_score`;
    }

    // Prefer trips to places similar to user's favorites
    if (userPrefs?.fav_places) {
      const places = userPrefs.fav_places;
      selectScoring += `, (
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM trip_stops ts2 
            JOIN cities c2 ON ts2.city_id = c2.city_id 
            JOIN countries co2 ON c2.country_id = co2.country_id 
            WHERE ts2.trip_id = t.trip_id AND (
              c2.name ILIKE '%${places.replace(/'/g, "''")}%' OR 
              co2.name ILIKE '%${places.replace(/'/g, "''")}%'
            )
          ) THEN 15
          ELSE 0
        END
      ) as place_score`;
    }

    // Exclude already visited places to encourage exploration
    if (visitedPlaces.length > 0) {
      whereConditions.push(`NOT EXISTS (
        SELECT 1 FROM trip_stops ts 
        JOIN cities c ON ts.city_id = c.city_id 
        WHERE ts.trip_id = t.trip_id AND c.name = ANY($${paramCount + 1})
      )`);
      paramCount++;
      queryParams.push(visitedPlaces.map(p => p.city_name));
    }

    paramCount++;
    queryParams.push(parseInt(limit));

    const recommendationQuery = `
      SELECT 
        t.trip_id,
        t.title,
        t.description,
        t.start_date,
        t.end_date,
        t.total_budget,
        t.currency,
        t.cover_image_url,
        t.status,
        t.share_token,
        t.created_at,
        u.name as creator_name,
        u.profile_picture_url as creator_avatar,
        COALESCE(tv.view_count, 0) as view_count,
        COALESCE(tl.like_count, 0) as like_count,
        COALESCE(tc.comment_count, 0) as comment_count,
        (t.end_date - t.start_date) as duration_days,
        array_agg(DISTINCT jsonb_build_object(
          'city_name', c.name,
          'country_name', co.name,
          'arrival_date', ts.arrival_date,
          'departure_date', ts.departure_date
        )) FILTER (WHERE c.name IS NOT NULL) as destinations
        ${selectScoring}
      FROM trips t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN trip_stops ts ON t.trip_id = ts.trip_id
      LEFT JOIN cities c ON ts.city_id = c.city_id
      LEFT JOIN countries co ON c.country_id = co.country_id
      LEFT JOIN (
        SELECT trip_id, COUNT(*) as view_count 
        FROM trip_views 
        GROUP BY trip_id
      ) tv ON t.trip_id = tv.trip_id
      LEFT JOIN (
        SELECT trip_id, COUNT(*) as like_count 
        FROM trip_likes 
        GROUP BY trip_id
      ) tl ON t.trip_id = tl.trip_id
      LEFT JOIN (
        SELECT trip_id, COUNT(*) as comment_count 
        FROM trip_comments 
        GROUP BY trip_id
      ) tc ON t.trip_id = tc.trip_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY t.trip_id, t.title, t.description, t.start_date, t.end_date,
               t.total_budget, t.currency, t.cover_image_url, t.status,
               t.share_token, t.created_at, u.name, u.profile_picture_url,
               tv.view_count, tl.like_count, tc.comment_count
      ORDER BY 
        COALESCE(tv.view_count, 0) + COALESCE(tl.like_count, 0) * 2 DESC,
        t.created_at DESC
      LIMIT $${paramCount}
    `;

    const recommendationsResult = await pool.query(recommendationQuery, queryParams);
    
    const recommendations = recommendationsResult.rows.map(trip => ({
      ...trip,
      destinations: trip.destinations || [],
      recommendation_reason: generateRecommendationReason(trip, userPrefs)
    }));

    res.json({
      success: true,
      data: {
        recommendations,
        user_preferences: {
          activities: userPrefs?.fav_activities || null,
          places: userPrefs?.fav_places || null,
          travel_style: userPrefs?.travel_style || null
        }
      }
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
});

/**
 * @route GET /api/discover/trending
 * @desc Get trending public trips
 * @access Public
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10, timeframe = '7d' } = req.query;

    // Calculate date range for trending
    let dateFilter = '';
    switch (timeframe) {
      case '24h':
        dateFilter = "AND tv.created_at >= NOW() - INTERVAL '24 hours'";
        break;
      case '7d':
        dateFilter = "AND tv.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        dateFilter = "AND tv.created_at >= NOW() - INTERVAL '30 days'";
        break;
      default:
        dateFilter = "AND tv.created_at >= NOW() - INTERVAL '7 days'";
    }

    const trendingQuery = `
      SELECT 
        t.trip_id,
        t.title,
        t.description,
        t.start_date,
        t.end_date,
        t.total_budget,
        t.currency,
        t.cover_image_url,
        t.status,
        t.share_token,
        t.created_at,
        u.name as creator_name,
        u.profile_picture_url as creator_avatar,
        COUNT(tv.view_id) as recent_views,
        COALESCE(tl.like_count, 0) as total_likes,
        COALESCE(tc.comment_count, 0) as total_comments,
        (t.end_date - t.start_date) as duration_days,
        array_agg(DISTINCT jsonb_build_object(
          'city_name', c.name,
          'country_name', co.name,
          'arrival_date', ts.arrival_date,
          'departure_date', ts.departure_date
        )) FILTER (WHERE c.name IS NOT NULL) as destinations
      FROM trips t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN trip_views tv ON t.trip_id = tv.trip_id ${dateFilter}
      LEFT JOIN trip_stops ts ON t.trip_id = ts.trip_id
      LEFT JOIN cities c ON ts.city_id = c.city_id
      LEFT JOIN countries co ON c.country_id = co.country_id
      LEFT JOIN (
        SELECT trip_id, COUNT(*) as like_count 
        FROM trip_likes 
        GROUP BY trip_id
      ) tl ON t.trip_id = tl.trip_id
      LEFT JOIN (
        SELECT trip_id, COUNT(*) as comment_count 
        FROM trip_comments 
        GROUP BY trip_id
      ) tc ON t.trip_id = tc.trip_id
      WHERE t.visibility = 'public'
      GROUP BY t.trip_id, t.title, t.description, t.start_date, t.end_date,
               t.total_budget, t.currency, t.cover_image_url, t.status,
               t.share_token, t.created_at, u.name, u.profile_picture_url,
               tl.like_count, tc.comment_count
      HAVING COUNT(tv.view_id) > 0
      ORDER BY 
        COUNT(tv.view_id) DESC,
        COALESCE(tl.like_count, 0) DESC,
        t.created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(trendingQuery, [parseInt(limit)]);
    
    const trendingTrips = result.rows.map(trip => ({
      ...trip,
      destinations: trip.destinations || []
    }));

    res.json({
      success: true,
      data: {
        trending_trips: trendingTrips,
        timeframe,
        total_found: trendingTrips.length
      }
    });

  } catch (error) {
    console.error('Error fetching trending trips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending trips',
      error: error.message
    });
  }
});

/**
 * Helper function to generate recommendation reasons
 */
function generateRecommendationReason(trip, userPrefs) {
  const reasons = [];
  
  if (userPrefs?.fav_activities && trip.description?.includes(userPrefs.fav_activities)) {
    reasons.push(`Matches your interest in ${userPrefs.fav_activities}`);
  }
  
  if (userPrefs?.fav_places && trip.destinations?.some(dest => 
    dest.city_name?.includes(userPrefs.fav_places) || 
    dest.country_name?.includes(userPrefs.fav_places)
  )) {
    reasons.push(`Visits places you're interested in`);
  }
  
  if (trip.like_count > 10) {
    reasons.push(`Highly liked by ${trip.like_count} travelers`);
  }
  
  if (trip.view_count > 100) {
    reasons.push('Popular destination');
  }
  
  return reasons.length > 0 ? reasons.join(' • ') : 'Recommended for you';
}

module.exports = router;
