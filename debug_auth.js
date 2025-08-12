// Quick debugging script to check authentication status
// Run this in browser console to check auth state

console.log('=== Authentication Debug ===');
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://192.168.102.228:5000/api');

// Test API call
const testAuth = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No token found');
    return;
  }
  
  try {
    const response = await fetch('http://localhost:5000/api/trips/user/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('API Response:', data);
  } catch (error) {
    console.error('API Error:', error);
  }
};

testAuth();
