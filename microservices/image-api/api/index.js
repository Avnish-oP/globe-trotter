require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const BASE_URL = 'https://api.unsplash.com';

async function searchTouristPlaceImages(placeName) {
  try {
    const enhancedQuery = `${placeName} tourist attraction landmark destination travel`;
    const params = {
      query: enhancedQuery,
      page: 1,
      per_page: 3,
      order_by: 'relevant',
      orientation: 'landscape',
      content_filter: 'low',
      client_id: UNSPLASH_ACCESS_KEY
    };
    const response = await axios.get(`${BASE_URL}/search/photos`, { params });

    return {
      success: true,
      place: placeName,
      total_found: response.data.total,
      images: response.data.results.map(photo => ({
        id: photo.id,
        description: photo.description || photo.alt_description || 'Beautiful view',
        photographer: {
          name: photo.user.name,
          username: photo.user.username
        },
        urls: {
          regular: photo.urls.regular,
          small: photo.urls.small,
          thumb: photo.urls.thumb
        }
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

app.get('/images/:placeName', async (req, res) => {
  const placeName = decodeURIComponent(req.params.placeName);
  if (!placeName.trim()) {
    return res.status(400).json({ success: false, error: 'Place name is required' });
  }
  res.json(await searchTouristPlaceImages(placeName));
});

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API running' });
});


if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
