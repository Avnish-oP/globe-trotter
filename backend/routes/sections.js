const express = require('express');
const router = express.Router();
const { pool, getClient } = require('../db/connection');
const { auth } = require('../middleware/auth');
const axios = require('axios');

// Debug endpoint to check if sections API is working
router.get('/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Sections API is working',
    timestamp: new Date().toISOString()
  });
});

// Get all sections for a trip
router.get('/trip/:tripId/sections', auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.user_id;

    // Verify user has access to this trip
    const tripCheck = await pool.query(
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
        message: 'You do not have access to this trip'
      });
    }

    // Get sections with their places
    const sectionsQuery = `
      SELECT 
        s.*,
        COALESCE(
          json_agg(
            json_build_object(
              'place_id', p.place_id,
              'name', p.name,
              'latitude', p.latitude,
              'longitude', p.longitude,
              'description', p.description,
              'estimated_cost', p.estimated_cost,
              'popularity', p.popularity,
              'is_selected', p.is_selected,
              'place_order', p.place_order
            ) ORDER BY p.place_order, p.place_id
          ) FILTER (WHERE p.place_id IS NOT NULL), 
          '[]'::json
        ) as places
      FROM trip_sections s
      LEFT JOIN trip_section_places p ON s.section_id = p.section_id
      WHERE s.trip_id = $1
      GROUP BY s.section_id
      ORDER BY s.section_order, s.section_id
    `;

    const result = await pool.query(sectionsQuery, [tripId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching trip sections:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch trip sections'
    });
  }
});

// Create a new section for a trip
router.post('/trip/:tripId/sections', auth, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { tripId } = req.params;
    const userId = req.user.user_id;
    const { title, description, start_date, end_date, location, budget_level } = req.body;

    // Validate required fields
    if (!title || !start_date || !end_date || !location) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, start date, end date, and location are required'
      });
    }

    // Verify user owns this trip
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
        message: 'You can only add sections to your own trips'
      });
    }

    // Get the next section order
    const orderResult = await client.query(
      'SELECT COALESCE(MAX(section_order), 0) + 1 as next_order FROM trip_sections WHERE trip_id = $1',
      [tripId]
    );
    const sectionOrder = orderResult.rows[0].next_order;

    // Create the section
    const sectionQuery = `
      INSERT INTO trip_sections (trip_id, title, description, start_date, end_date, location, budget_level, section_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const sectionResult = await client.query(sectionQuery, [
      tripId,
      title,
      description || '',
      start_date,
      end_date,
      location,
      budget_level || 'medium',
      sectionOrder
    ]);

    const section = sectionResult.rows[0];

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      data: section
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating trip section:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create trip section'
    });
  } finally {
    client.release();
  }
});

// Get place suggestions preview (without requiring a section)
router.post('/suggest-places-preview', auth, async (req, res) => {
  try {
    const { location, budget, experiences } = req.body;

    console.log('Getting place suggestions preview for location:', location);

    if (!location) {
      return res.status(400).json({
        error: 'Location is required',
        message: 'Please provide a location for suggestions'
      });
    }

    // Make API call to your place suggestions service
    const requestBody = {
      location: location,
      budget: budget || 'medium',
      experiences: experiences || []
    };

    console.log('Making place suggestions API call:', requestBody);

    // Use the configured API endpoint
    const apiUrl = process.env.PLACES_API_URL || 'http://127.0.0.1:8000/suggestions';
    console.log('API URL:', apiUrl);
    
    try {
      // Make actual API call to your microservice
      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('API response received:', response.data);

      res.json({
        success: true,
        data: response.data,
        message: 'Place suggestions from external API'
      });

    } catch (apiError) {
      console.error('External API call failed:', apiError);
      
      // Fallback to mock data if API fails
      console.log('Falling back to mock data due to API error');
      
      const mockSuggestions = {
        suggestions: {
          places: [
            {
              name: "Local Market",
              lat: 28.6139,
              lng: 77.2090,
              description: "Experience local culture and cuisine at the bustling market.",
              estimated_cost: "INR 100-500",
              popularity: "popular"
            },
            {
              name: "Historical Monument",
              lat: 28.6129,
              lng: 77.2295,
              description: "Visit iconic historical landmarks and learn about local history.",
              estimated_cost: "INR 50-200",
              popularity: "very popular"
            },
            {
              name: "Local Restaurant",
              lat: 28.6149,
              lng: 77.2195,
              description: "Try authentic local cuisine at this highly recommended restaurant.",
              estimated_cost: "INR 200-800",
              popularity: "popular"
            },
            {
              name: "Cultural Center",
              lat: 28.6159,
              lng: 77.2105,
              description: "Explore local art, music, and cultural performances.",
              estimated_cost: "INR 300-600",
              popularity: "popular"
            },
            {
              name: "Scenic Viewpoint",
              lat: 28.6179,
              lng: 77.2115,
              description: "Enjoy panoramic views and perfect photo opportunities.",
              estimated_cost: "INR 0-100",
              popularity: "very popular"
            }
          ]
        }
      };

      res.json({
        success: true,
        data: mockSuggestions,
        message: 'Using fallback suggestions due to API unavailability',
        apiError: apiError.message
      });
    }

  } catch (error) {
    console.error('Error getting place suggestions preview:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get place suggestions preview',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get place suggestions for a section
router.post('/sections/:sectionId/suggest-places', auth, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const userId = req.user.user_id;

    console.log(`Getting place suggestions for section ${sectionId} by user ${userId}`);

    // Verify user has access to this section
    const sectionCheck = await pool.query(`
      SELECT s.*, t.user_id 
      FROM trip_sections s 
      JOIN trips t ON s.trip_id = t.trip_id 
      WHERE s.section_id = $1
    `, [sectionId]);

    console.log(`Section check result:`, sectionCheck.rows);

    if (sectionCheck.rows.length === 0) {
      console.log(`Section ${sectionId} not found`);
      return res.status(404).json({
        error: 'Section not found',
        message: 'Section not found'
      });
    }

    if (sectionCheck.rows[0].user_id !== userId) {
      console.log(`User ${userId} does not have access to section ${sectionId}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this section'
      });
    }

    const section = sectionCheck.rows[0];
    console.log(`Section details:`, section);

    // Make API call to your place suggestions service
    const requestBody = {
      location: section.location,
      budget: section.budget_level,
      experiences: [] // You can extend this based on user preferences
    };

    console.log('Making place suggestions API call:', requestBody);

    // Use the configured API endpoint
    const apiUrl = process.env.PLACES_API_URL || 'http://127.0.0.1:8000/suggestions';
    console.log('API URL:', apiUrl);
    
    try {
      // Make actual API call to your microservice
      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('API response received:', response.data);

      res.json({
        success: true,
        data: response.data,
        message: 'Place suggestions from external API'
      });

    } catch (apiError) {
      console.error('External API call failed:', apiError);
      
      // Fallback to mock data if API fails
      console.log('Falling back to mock data due to API error');
      
      const mockSuggestions = {
        suggestions: {
          places: [
            {
              name: "Local Market",
              lat: 28.6139,
              lng: 77.2090,
              description: "Experience local culture and cuisine at the bustling market.",
              estimated_cost: "INR 100-500",
              popularity: "popular"
            },
            {
              name: "Historical Monument",
              lat: 28.6129,
              lng: 77.2295,
              description: "Visit iconic historical landmarks and learn about local history.",
              estimated_cost: "INR 50-200",
              popularity: "very popular"
            },
            {
              name: "Local Restaurant",
              lat: 28.6149,
              lng: 77.2195,
              description: "Try authentic local cuisine at this highly recommended restaurant.",
              estimated_cost: "INR 200-800",
              popularity: "popular"
            },
            {
              name: "Cultural Center",
              lat: 28.6159,
              lng: 77.2105,
              description: "Explore local art, music, and cultural performances.",
              estimated_cost: "INR 300-600",
              popularity: "popular"
            },
            {
              name: "Scenic Viewpoint",
              lat: 28.6179,
              lng: 77.2115,
              description: "Enjoy panoramic views and perfect photo opportunities.",
              estimated_cost: "INR 0-100",
              popularity: "very popular"
            }
          ]
        }
      };

      res.json({
        success: true,
        data: mockSuggestions,
        message: 'Using fallback suggestions due to API unavailability',
        apiError: apiError.message
      });
    }

  } catch (error) {
    console.error('Error getting place suggestions:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get place suggestions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Save selected places for a section
router.post('/sections/:sectionId/places', auth, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { sectionId } = req.params;
    const userId = req.user.user_id;
    const { places } = req.body;

    if (!places || !Array.isArray(places)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Places array is required'
      });
    }

    // Verify user has access to this section
    const sectionCheck = await client.query(`
      SELECT s.*, t.user_id 
      FROM trip_sections s 
      JOIN trips t ON s.trip_id = t.trip_id 
      WHERE s.section_id = $1
    `, [sectionId]);

    if (sectionCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Section not found',
        message: 'Section not found'
      });
    }

    if (sectionCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this section'
      });
    }

    // Clear existing places for this section
    await client.query('DELETE FROM trip_section_places WHERE section_id = $1', [sectionId]);

    // Insert new places
    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      
      const insertQuery = `
        INSERT INTO trip_section_places 
        (section_id, name, latitude, longitude, description, estimated_cost, popularity, is_selected, place_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      await client.query(insertQuery, [
        sectionId,
        place.name,
        place.lat || null,
        place.lng || null,
        place.description || '',
        place.estimated_cost || '',
        place.popularity || '',
        true, // is_selected = true since user chose these places
        i + 1 // place_order
      ]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Places saved successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving section places:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to save section places'
    });
  } finally {
    client.release();
  }
});

// Update a section
router.put('/sections/:sectionId', auth, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const userId = req.user.user_id;
    const updates = req.body;

    // Verify user has access to this section
    const sectionCheck = await pool.query(`
      SELECT s.*, t.user_id 
      FROM trip_sections s 
      JOIN trips t ON s.trip_id = t.trip_id 
      WHERE s.section_id = $1
    `, [sectionId]);

    if (sectionCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Section not found',
        message: 'Section not found'
      });
    }

    if (sectionCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own sections'
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['title', 'description', 'start_date', 'end_date', 'location', 'budget_level'].includes(key)) {
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

    updateValues.push(sectionId);

    const updateQuery = `
      UPDATE trip_sections 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE section_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Section updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update section'
    });
  }
});

// Delete a section
router.delete('/sections/:sectionId', auth, async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const { sectionId } = req.params;
    const userId = req.user.user_id;

    // Verify user has access to this section
    const sectionCheck = await client.query(`
      SELECT s.*, t.user_id 
      FROM trip_sections s 
      JOIN trips t ON s.trip_id = t.trip_id 
      WHERE s.section_id = $1
    `, [sectionId]);

    if (sectionCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Section not found',
        message: 'Section not found'
      });
    }

    if (sectionCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own sections'
      });
    }

    // Delete section (places will be deleted automatically due to CASCADE)
    await client.query('DELETE FROM trip_sections WHERE section_id = $1', [sectionId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Section deleted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting section:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete section'
    });
  } finally {
    client.release();
  }
});

module.exports = router;
