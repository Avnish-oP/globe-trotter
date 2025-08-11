const express = require('express');
const router = express.Router();
const { pool } = require('../db/connection');
const { optionalAuth } = require('../middleware/auth');

// Search for locations (cities and countries with type identification)
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Search both cities and countries with type identification
    const searchQuery = `
      SELECT 
        'city' as type,
        c.city_id as id,
        c.name,
        co.name as country,
        CONCAT(c.name, ', ', co.name) as full_name,
        c.latitude,
        c.longitude,
        c.popularity_score,
        c.image_url,
        co.country_code
      FROM cities c
      JOIN countries co ON c.country_id = co.country_id
      WHERE 
        c.name ILIKE $1 
        OR co.name ILIKE $1
        OR CONCAT(c.name, ', ', co.name) ILIKE $1
      
      UNION ALL
      
      SELECT 
        'country' as type,
        co.country_id as id,
        co.name,
        co.name as country,
        co.name as full_name,
        NULL as latitude,
        NULL as longitude,
        COALESCE(co.cost_index * 10, 50) as popularity_score,
        NULL as image_url,
        co.country_code
      FROM countries co
      WHERE co.name ILIKE $1
      
      ORDER BY 
        popularity_score DESC,
        CASE 
          WHEN name ILIKE $2 THEN 1
          WHEN country ILIKE $2 THEN 2
          ELSE 3
        END,
        name
      LIMIT 15
    `;
    
    const searchTerm = `%${q}%`;
    const exactMatch = `${q}%`;
    
    const result = await pool.query(searchQuery, [searchTerm, exactMatch]);
    
    const locations = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      name: row.name,
      country: row.country,
      full_name: row.full_name,
      latitude: row.latitude,
      longitude: row.longitude,
      popularity_score: row.popularity_score,
      country_code: row.country_code
    }));
    
    res.json({
      success: true,
      data: locations
    });
    
  } catch (error) {
    console.error('Error searching locations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to search locations'
    });
  }
});

// Get popular destinations
router.get('/popular', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const popularQuery = `
      SELECT 
        c.city_id,
        c.name,
        co.name as country_name,
        co.country_code,
        c.latitude,
        c.longitude,
        c.popularity_score,
        c.image_url,
        c.description
      FROM cities c
      JOIN countries co ON c.country_id = co.country_id
      WHERE c.popularity_score > 0
      ORDER BY c.popularity_score DESC, c.name
      LIMIT $1
    `;
    
    const result = await pool.query(popularQuery, [parseInt(limit)]);
    
    const destinations = result.rows.map(row => ({
      id: row.city_id,
      name: row.name,
      country: row.country_name,
      countryCode: row.country_code,
      fullName: `${row.name}, ${row.country_name}`,
      coordinates: {
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude)
      },
      popularity: row.popularity_score,
      image: row.image_url,
      description: row.description
    }));
    
    res.json({
      success: true,
      data: destinations
    });
    
  } catch (error) {
    console.error('Error fetching popular destinations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch popular destinations'
    });
  }
});

// Get countries
router.get('/countries', async (req, res) => {
  try {
    const countriesQuery = `
      SELECT 
        country_id,
        name,
        country_code,
        continent,
        currency
      FROM countries
      ORDER BY name
    `;
    
    const result = await pool.query(countriesQuery);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch countries'
    });
  }
});

// External location search using OpenStreetMap Nominatim API
router.get('/external-search', optionalAuth, async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Use dynamic import for node-fetch (ES module)
    const fetch = (await import('node-fetch')).default;
    
    // Use Nominatim API for location search
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&q=${encodeURIComponent(query)}&accept-language=en`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'GlobeTrotter/1.0 (contact@globetrotter.com)'
      }
    });
    
    if (!response.ok) {
      throw new Error('External API request failed');
    }
    
    const data = await response.json();
    
    // Format the response to match our schema
    const formattedData = data
      .filter(item => {
        // Filter out very specific addresses, prefer cities and countries
        const address = item.address || {};
        return address.city || address.town || address.municipality || 
               address.country || address.state || address.province;
      })
      .map(item => {
        const address = item.address || {};
        let type = 'location';
        let name = item.display_name.split(',')[0];
        let country = address.country || '';
        
        // Determine type based on OSM data with better logic
        if (address.city || address.town || address.municipality) {
          type = 'city';
          name = address.city || address.town || address.municipality || name;
        } else if (address.country && !address.city && !address.town && !address.state) {
          type = 'country';
          name = address.country;
          country = address.country;
        } else if (address.state || address.province) {
          type = 'state';
          name = address.state || address.province || name;
        } else if (address.county) {
          type = 'region';
          name = address.county;
        }
        
        return {
          id: `osm_${item.place_id}`,
          type,
          name,
          country,
          full_name: `${name}${country && name !== country ? ', ' + country : ''}`,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          popularity_score: 50, // Default score for external data
          country_code: address.country_code ? address.country_code.toUpperCase() : null,
          source: 'osm',
          display_name: item.display_name
        };
      })
      .slice(0, limit); // Ensure we don't exceed the limit after filtering
    
    res.json({
      success: true,
      data: formattedData
    });
    
  } catch (error) {
    console.error('External location search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to search locations externally'
    });
  }
});

// Alternative external API using REST Countries for country data
router.get('/external-countries', optionalAuth, async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const fetch = (await import('node-fetch')).default;
    
    // Use REST Countries API for better country data
    const restCountriesUrl = `https://restcountries.com/v3.1/name/${encodeURIComponent(query)}`;
    
    const response = await fetch(restCountriesUrl);
    
    if (!response.ok) {
      throw new Error('REST Countries API request failed');
    }
    
    const data = await response.json();
    
    const formattedData = data.map((country, index) => ({
      id: `rest_${country.cca3}_${index}`,
      type: 'country',
      name: country.name.common,
      country: country.name.common,
      full_name: country.name.official,
      latitude: country.latlng ? country.latlng[0] : null,
      longitude: country.latlng ? country.latlng[1] : null,
      popularity_score: 60,
      country_code: country.cca2,
      source: 'rest_countries',
      flag: country.flag,
      region: country.region,
      subregion: country.subregion,
      capital: country.capital ? country.capital[0] : null
    }));
    
    res.json({
      success: true,
      data: formattedData
    });
    
  } catch (error) {
    console.error('REST Countries API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to search countries'
    });
  }
});

module.exports = router;
