const express = require('express');
const router = express.Router();
const { pool, getClient } = require('../db/connection');
const { auth } = require('../middleware/auth');

// Create a new trip
router.post('/', auth, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { 
      title, 
      description, 
      start_date, 
      end_date, 
      total_budget, 
      currency,
      destinations,
      visibility = 'private',
      allow_comments = false,
      allow_cloning = false,
      share_settings = { email_notifications: true, show_budget: true, show_personal_info: false }
    } = req.body;
    
    const userId = req.user.user_id;
    
    // Validate required fields
    if (!title || !start_date || !end_date || !destinations || destinations.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, start date, end date, and at least one destination are required'
      });
    }
    
    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate >= endDate) {
      return res.status(400).json({
        error: 'Invalid dates',
        message: 'End date must be after start date'
      });
    }
    
    // Create the trip
    const tripQuery = `
      INSERT INTO trips (
        user_id, 
        title, 
        description, 
        start_date, 
        end_date, 
        total_budget, 
        currency, 
        status,
        visibility,
        is_public,
        allow_comments,
        allow_cloning,
        share_settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING trip_id, title, description, start_date, end_date, total_budget, currency, status, visibility, allow_comments, allow_cloning, created_at
    `;
    
    const tripValues = [
      userId,
      title,
      description || `Trip to ${destinations.map(d => d.name).join(', ')}`,
      start_date,
      end_date,
      total_budget || null,
      currency || 'USD',
      'planning',
      visibility,
      visibility === 'public',
      allow_comments,
      allow_cloning,
      JSON.stringify(share_settings)
    ];
    
    const tripResult = await client.query(tripQuery, tripValues);
    const trip = tripResult.rows[0];
    
    // Add destinations as trip stops
    const cityDestinations = [];
    for (let i = 0; i < destinations.length; i++) {
      const destination = destinations[i];
      
      // First, check if the city exists (join with countries)
      let cityQuery = `
        SELECT c.city_id, c.name, co.name as country_name 
        FROM cities c 
        JOIN countries co ON c.country_id = co.country_id 
        WHERE c.name ILIKE $1 AND co.name ILIKE $2
      `;
      let cityResult = await client.query(cityQuery, [destination.name, destination.country]);
      
      let cityId;
      if (cityResult.rows.length > 0) {
        cityId = cityResult.rows[0].city_id;
      } else {
        // Find or create country first
        let countryQuery = 'SELECT country_id FROM countries WHERE name ILIKE $1';
        let countryResult = await client.query(countryQuery, [destination.country]);
        
        let countryId;
        if (countryResult.rows.length > 0) {
          countryId = countryResult.rows[0].country_id;
        } else {
          // Create new country
          const insertCountryQuery = `
            INSERT INTO countries (name, country_code)
            VALUES ($1, $2)
            RETURNING country_id
          `;
          const insertCountryResult = await client.query(insertCountryQuery, [
            destination.country,
            destination.country.substring(0, 3).toUpperCase()
          ]);
          countryId = insertCountryResult.rows[0].country_id;
        }
        
        // Create new city
        const insertCityQuery = `
          INSERT INTO cities (name, country_id, description)
          VALUES ($1, $2, $3)
          RETURNING city_id
        `;
        const insertCityResult = await client.query(insertCityQuery, [
          destination.name,
          countryId,
          `Beautiful destination in ${destination.country}`
        ]);
        cityId = insertCityResult.rows[0].city_id;
      }
      
      // Calculate arrival and departure dates
      const tripDuration = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
      const stayDuration = Math.max(1, Math.floor(tripDuration / destinations.length));
      const arrivalDate = new Date(startDate);
      arrivalDate.setDate(arrivalDate.getDate() + (i * stayDuration));
      const departureDate = new Date(arrivalDate);
      departureDate.setDate(departureDate.getDate() + stayDuration);
      
      // Add to trip_stops
      const tripStopQuery = `
        INSERT INTO trip_stops (trip_id, city_id, arrival_date, departure_date, stop_order)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING stop_id
      `;
      const stopResult = await client.query(tripStopQuery, [
        trip.trip_id, 
        cityId, 
        arrivalDate.toISOString().split('T')[0],
        departureDate.toISOString().split('T')[0],
        i + 1
      ]);
      
      cityDestinations.push({
        stop_id: stopResult.rows[0].stop_id,
        city_id: cityId,
        name: destination.name,
        country: destination.country,
        arrival_date: arrivalDate.toISOString().split('T')[0],
        departure_date: departureDate.toISOString().split('T')[0]
      });
    }
    
    await client.query('COMMIT');
    
    // Return the created trip with destinations
    const response = {
      success: true,
      message: 'Trip created successfully',
      data: {
        ...trip,
        destinations: cityDestinations
      }
    };
    
    res.status(201).json(response);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating trip:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create trip'
    });
  } finally {
    client.release();
  }
});

// Get trip by ID
router.get('/:tripId', auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.user_id;
    
    // Get trip details with stops and cities
    const tripQuery = `
      SELECT 
        t.*,
        u.name as creator_name,
        COALESCE(
          json_agg(
            json_build_object(
              'stop_id', ts.stop_id,
              'city_id', c.city_id,
              'city_name', c.name,
              'country_name', co.name,
              'arrival_date', ts.arrival_date,
              'departure_date', ts.departure_date,
              'stop_order', ts.stop_order
            ) ORDER BY ts.stop_order
          ) FILTER (WHERE ts.stop_id IS NOT NULL), 
          '[]'::json
        ) as stops
      FROM trips t
      LEFT JOIN users u ON t.user_id = u.user_id
      LEFT JOIN trip_stops ts ON t.trip_id = ts.trip_id
      LEFT JOIN cities c ON ts.city_id = c.city_id
      LEFT JOIN countries co ON c.country_id = co.country_id
      WHERE t.trip_id = $1 AND (t.user_id = $2 OR t.trip_id IN (
        SELECT trip_id FROM trip_shares WHERE shared_with_user_id = $2
      ))
      GROUP BY t.trip_id, u.name
    `;
    
    const result = await pool.query(tripQuery, [tripId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Trip not found',
        message: 'Trip not found or you do not have access to it'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch trip'
    });
  }
});

// Get user's trips
router.get('/user/all', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const tripsQuery = `
      SELECT 
        t.*,
        COALESCE(
          json_agg(
            json_build_object(
              'stop_id', ts.stop_id,
              'city_id', c.city_id,
              'city_name', c.name,
              'country_name', co.name,
              'arrival_date', ts.arrival_date,
              'departure_date', ts.departure_date
            ) ORDER BY ts.stop_order
          ) FILTER (WHERE ts.stop_id IS NOT NULL), 
          '[]'::json
        ) as stops
      FROM trips t
      LEFT JOIN trip_stops ts ON t.trip_id = ts.trip_id
      LEFT JOIN cities c ON ts.city_id = c.city_id
      LEFT JOIN countries co ON c.country_id = co.country_id
      WHERE t.user_id = $1
      GROUP BY t.trip_id
      ORDER BY t.created_at DESC
    `;
    
    const result = await pool.query(tripsQuery, [userId]);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching user trips:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch trips'
    });
  }
});

// Update trip
router.put('/:tripId', auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.user_id;
    const updates = req.body;
    
    // Check if user owns the trip
    const ownershipCheck = await pool.query(
      'SELECT user_id FROM trips WHERE trip_id = $1',
      [tripId]
    );
    
    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Trip not found',
        message: 'Trip not found'
      });
    }
    
    if (ownershipCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own trips'
      });
    }
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (['title', 'description', 'start_date', 'end_date', 'total_budget', 'currency', 'status'].includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
        paramCount++;
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update',
        message: 'Please provide valid fields to update'
      });
    }
    
    updateValues.push(tripId);
    
    const updateQuery = `
      UPDATE trips 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE trip_id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, updateValues);
    
    res.json({
      success: true,
      message: 'Trip updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update trip'
    });
  }
});

// Delete trip
router.delete('/:tripId', auth, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { tripId } = req.params;
    const userId = req.user.user_id;
    
    // Check if user owns the trip
    const ownershipCheck = await client.query(
      'SELECT user_id FROM trips WHERE trip_id = $1',
      [tripId]
    );
    
    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Trip not found',
        message: 'Trip not found'
      });
    }
    
    if (ownershipCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own trips'
      });
    }
    
    // Delete related records first (foreign key constraints)
    await client.query('DELETE FROM trip_shares WHERE trip_id = $1', [tripId]);
    await client.query('DELETE FROM trip_activities WHERE stop_id IN (SELECT stop_id FROM trip_stops WHERE trip_id = $1)', [tripId]);
    await client.query('DELETE FROM trip_stops WHERE trip_id = $1', [tripId]);
    await client.query('DELETE FROM trip_expenses WHERE trip_id = $1', [tripId]);
    
    // Delete the trip
    await client.query('DELETE FROM trips WHERE trip_id = $1', [tripId]);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Trip deleted successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting trip:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete trip'
    });
  } finally {
    client.release();
  }
});

module.exports = router;
