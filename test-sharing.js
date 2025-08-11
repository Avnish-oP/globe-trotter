// Test script to verify sharing functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Sample test data
const testUser = {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User'
};

const testTrip = {
  title: 'Amazing European Adventure',
  description: 'A wonderful trip through Europe',
  start_date: '2024-06-01',
  end_date: '2024-06-15',
  total_budget: 5000,
  currency: 'USD',
  visibility: 'public',
  allow_comments: true,
  allow_cloning: true,
  destinations: [
    {
      name: 'Paris',
      country: 'France',
      arrival_date: '2024-06-01',
      departure_date: '2024-06-05'
    },
    {
      name: 'Rome',
      country: 'Italy',
      arrival_date: '2024-06-06',
      departure_date: '2024-06-10'
    },
    {
      name: 'Barcelona',
      country: 'Spain',
      arrival_date: '2024-06-11',
      departure_date: '2024-06-15'
    }
  ]
};

async function runSharingTests() {
  try {
    console.log('🚀 Starting Sharing Feature Tests...\n');

    // 1. Create a user account (or login)
    console.log('1. Creating/logging in user...');
    let authResponse;
    try {
      authResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 409 || error.response?.data?.message?.includes('already exists')) {
        // User already exists, try to login
        authResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        console.log('✅ User logged in successfully');
      } else {
        throw error;
      }
    }

    const token = authResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('🔑 Token:', token.substring(0, 20) + '...');

    // 2. Create a trip with sharing settings
    console.log('\n2. Creating a trip with sharing settings...');
    const tripResponse = await axios.post(`${BASE_URL}/trips`, testTrip, { headers });
    const tripId = tripResponse.data.data.trip_id;
    console.log(`✅ Trip created with ID: ${tripId}`);

    // 3. Get sharing settings for the trip
    console.log('\n3. Getting sharing settings...');
    const sharingResponse = await axios.get(`${BASE_URL}/sharing/${tripId}`, { headers });
    const shareToken = sharingResponse.data.data.share_token;
    console.log(`✅ Share token: ${shareToken}`);
    console.log(`📋 Sharing settings:`, sharingResponse.data.data);

    // 4. Test public access
    console.log('\n4. Testing public access...');
    const publicResponse = await axios.get(`${BASE_URL}/sharing/public/${shareToken}`);
    console.log(`✅ Public trip accessible:`, publicResponse.data.data.trip.title);

    // 5. Update sharing settings
    console.log('\n5. Updating sharing settings...');
    const updateResponse = await axios.put(`${BASE_URL}/sharing/${tripId}`, {
      visibility: 'unlisted',
      allow_comments: false,
      allow_cloning: false
    }, { headers });
    console.log(`✅ Sharing settings updated:`, updateResponse.data.data);

    // 6. Share with another user (mock email)
    console.log('\n6. Sharing with user...');
    const shareResponse = await axios.post(`${BASE_URL}/sharing/${tripId}/share`, {
      email: 'friend@example.com',
      permission_level: 'view',
      message: 'Check out my amazing trip!'
    }, { headers });
    console.log(`✅ Trip shared:`, shareResponse.data.message);

    // 7. Like the trip (as the same user for testing)
    console.log('\n7. Testing like functionality...');
    const likeResponse = await axios.post(`${BASE_URL}/sharing/public/${shareToken}/like`, {}, { headers });
    console.log(`✅ Trip liked:`, likeResponse.data.data.liked);

    // 8. Add a comment
    console.log('\n8. Adding a comment...');
    const commentResponse = await axios.post(`${BASE_URL}/sharing/public/${shareToken}/comment`, {
      comment_text: 'This looks like an amazing trip! Thanks for sharing.'
    }, { headers });
    console.log(`✅ Comment added:`, commentResponse.data.data.comment_id);

    console.log('\n🎉 All sharing tests completed successfully!');
    console.log(`\n📱 You can view the public trip at: http://localhost:3000/shared/${shareToken}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
runSharingTests();
