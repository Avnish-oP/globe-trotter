import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Register new user
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    country_origin?: string;
    fav_activities?: string[];
    fav_places?: string[];
    travel_style?: string;
    profile_picture_url?: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (updateData: any) => {
    const response = await api.put('/auth/profile', updateData);
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (file: File) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const response = await api.post('/auth/upload-profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete profile picture
  deleteProfilePicture: async () => {
    const response = await api.delete('/auth/delete-profile-picture');
    return response.data;
  },

  // Change password
  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Delete account
  deleteAccount: async (password: string) => {
    const response = await api.delete('/auth/account', { data: { password } });
    return response.data;
  },
};

// Trip API functions (placeholder for future implementation)
export const tripAPI = {
  // Get all trips for current user
  getTrips: async () => {
    const response = await api.get('/trips');
    return response.data;
  },

  // Create new trip
  createTrip: async (tripData: any) => {
    const response = await api.post('/trips', tripData);
    return response.data;
  },

  // Get trip by ID
  getTripById: async (tripId: string) => {
    const response = await api.get(`/trips/${tripId}`);
    return response.data;
  },

  // Update trip
  updateTrip: async (tripId: string, updateData: any) => {
    const response = await api.put(`/trips/${tripId}`, updateData);
    return response.data;
  },

  // Delete trip
  deleteTrip: async (tripId: string) => {
    const response = await api.delete(`/trips/${tripId}`);
    return response.data;
  },
};

// Cities and Activities API (placeholder for future implementation)
export const searchAPI = {
  // Search cities
  searchCities: async (query: string) => {
    const response = await api.get(`/search/cities?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Search activities
  searchActivities: async (cityId: string, query?: string) => {
    const response = await api.get(`/search/activities/${cityId}?q=${encodeURIComponent(query || '')}`);
    return response.data;
  },
};

// Dashboard API functions
export const dashboardAPI = {
  // Get dashboard data (overview)
  getDashboardData: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  // Get upcoming trips
  getUpcomingTrips: async () => {
    const response = await api.get('/dashboard/upcoming-trips');
    return response.data;
  },

  // Get popular cities
  getPopularCities: async (limit: number = 5) => {
    const response = await api.get(`/dashboard/popular-cities?limit=${limit}`);
    return response.data;
  },

  // Get recommended destinations based on user preferences
  getRecommendedDestinations: async () => {
    const response = await api.get('/dashboard/recommended-destinations');
    return response.data;
  },

  // Search public trips
  searchPublicTrips: async (query: string) => {
    const response = await api.get(`/dashboard/search-trips?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Follow a public trip (add to trip_shares)
  followTrip: async (tripId: string) => {
    const response = await api.post(`/dashboard/follow-trip/${tripId}`);
    return response.data;
  },
};

// Trips API functions
export const tripsAPI = {
  // Create a new trip
  createTrip: async (tripData: {
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    total_budget?: number;
    currency: string;
    destinations: Array<{
      name: string;
      country: string;
      type: string;
    }>;
  }) => {
    const response = await api.post('/trips', tripData);
    return response.data;
  },

  // Get trip by ID
  getTripById: async (tripId: string) => {
    const response = await api.get(`/trips/${tripId}`);
    return response.data;
  },

  // Update trip
  updateTrip: async (tripId: string, tripData: any) => {
    const response = await api.put(`/trips/${tripId}`, tripData);
    return response.data;
  },

  // Delete trip
  deleteTrip: async (tripId: string) => {
    const response = await api.delete(`/trips/${tripId}`);
    return response.data;
  },

  // Get user's trips
  getUserTrips: async () => {
    const response = await api.get('/trips/user/all');
    return response.data;
  },
};

// Location API functions
export const locationAPI = {
  // Search for locations with type identification
  searchLocations: async (query: string) => {
    const response = await api.get('/locations/search', {
      params: { q: query }
    });
    return response.data;
  },

  // Search using external API (OpenStreetMap)
  searchLocationsExternal: async (query: string) => {
    const response = await api.get('/locations/external-search', {
      params: { q: query }
    });
    return response.data;
  },

  // Get popular destinations
  getPopularDestinations: async (limit: number = 20, type: string = 'all') => {
    const response = await api.get('/locations/popular', {
      params: { limit, type }
    });
    return response.data;
  },

  // Get countries
  getCountries: async () => {
    const response = await api.get('/locations/countries');
    return response.data;
  },

  // Get cities by country
  getCitiesByCountry: async (countryId: string, limit: number = 50) => {
    const response = await api.get(`/locations/cities/${countryId}`, {
      params: { limit }
    });
    return response.data;
  },
};

// Sections API functions
export const sectionsAPI = {
  // Get sections for a trip
  getTripSections: async (tripId: string) => {
    const response = await api.get(`/sections/trip/${tripId}/sections`);
    return response.data;
  },

  // Create a new section
  createSection: async (tripId: string, sectionData: {
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    location: string;
    budget_level?: 'low' | 'medium' | 'high';
  }) => {
    const response = await api.post(`/sections/trip/${tripId}/sections`, sectionData);
    return response.data;
  },

  // Get place suggestions for a section
  getSuggestions: async (sectionId: string) => {
    const response = await api.post(`/sections/sections/${sectionId}/suggest-places`);
    return response.data;
  },

  // Save selected places for a section
  savePlaces: async (sectionId: string, places: Array<{
    name: string;
    lat?: number;
    lng?: number;
    description?: string;
    estimated_cost?: string;
    popularity?: string;
  }>) => {
    const response = await api.post(`/sections/sections/${sectionId}/places`, { places });
    return response.data;
  },

  // Update a section
  updateSection: async (sectionId: string, updates: Partial<{
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string;
    budget_level: 'low' | 'medium' | 'high';
  }>) => {
    const response = await api.put(`/sections/sections/${sectionId}`, updates);
    return response.data;
  },

  // Delete a section
  deleteSection: async (sectionId: string) => {
    const response = await api.delete(`/sections/sections/${sectionId}`);
    return response.data;
  },
};

export default api;