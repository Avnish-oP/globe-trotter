'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { dashboardAPI } from '@/lib/api';
import { 
  Plane, 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Settings,
  LogOut,
  Bell,
  Search,
  TrendingUp,
  Eye,
  Share2,
  Clock,
  Star,
  Heart,
  ChevronRight,
  Globe,
  User
} from 'lucide-react';

interface DashboardStats {
  totalTrips: number;
  upcomingTrips: number;
  totalBudget: number;
  countriesVisited: number;
}

interface Trip {
  trip_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  currency: string;
  cover_image_url?: string;
  status: string;
  cities: string[];
  created_by?: string;
  creator_id?: string;
}

interface City {
  city_id: string;
  name: string;
  description: string;
  image_url?: string;
  country_name: string;
  country_code: string;
  popularity_score?: number;
}

export default function DashboardPage() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  // State management
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [popularCities, setPopularCities] = useState<City[]>([]);
  const [recommendedDestinations, setRecommendedDestinations] = useState<City[]>([]);
  const [recommendedTrips, setRecommendedTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Trip[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    trips: true,
    cities: true,
    recommendations: true,
    recommendedTrips: true
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);
  });
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [groupBy, setGroupBy] = useState<GroupOption>('none');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch all dashboard data in parallel
      const [statsRes, tripsRes, citiesRes, recommendationsRes] = await Promise.allSettled([
        dashboardAPI.getDashboardData(),
        dashboardAPI.getUpcomingTrips(),
        dashboardAPI.getPopularCities(8), // Get more cities for regional section
        dashboardAPI.getRecommendedDestinations()
      ]);

      // Handle stats
      if (statsRes.status === 'fulfilled') {
        setDashboardStats(statsRes.value.data);
      }
      setLoadingStates(prev => ({ ...prev, stats: false }));

      // Handle trips
      if (tripsRes.status === 'fulfilled') {
        const allTrips = tripsRes.value.data;
        const now = new Date();
        const upcoming = allTrips.filter((trip: Trip) => new Date(trip.start_date) > now);
        const previous = allTrips.filter((trip: Trip) => new Date(trip.end_date) < now);
        
        setUpcomingTrips(upcoming);
        setPreviousTrips(previous);
      }
      setLoadingStates(prev => ({ ...prev, trips: false, previousTrips: false }));

      // Handle cities
      if (citiesRes.status === 'fulfilled') {
        setPopularCities(citiesRes.value.data);
      }
      setLoadingStates(prev => ({ ...prev, cities: false }));

      // Handle recommendations
      if (recommendationsRes.status === 'fulfilled') {
        setRecommendedDestinations(recommendationsRes.value.data);
      }
      setLoadingStates(prev => ({ ...prev, recommendations: false }));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set all loading states to false on error
      setLoadingStates({
        stats: false,
        trips: false,
        cities: false,
        recommendations: false,
        previousTrips: false
      });
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await dashboardAPI.searchPublicTrips(query);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching trips:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollowTrip = async (tripId: string) => {
    try {
      await dashboardAPI.followTrip(tripId);
      // Refresh upcoming trips to show the followed trip
      const response = await dashboardAPI.getUpcomingTrips();
      setUpcomingTrips(response.data);
      // Remove from search results
      setSearchResults(prev => prev.filter(trip => trip.trip_id !== tripId));
    } catch (error) {
      console.error('Error following trip:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handlePlanTrip = () => {
    router.push('/trips/new');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-100/50 to-violet-100/50 blur-sm"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-violet-100/20 to-transparent"></div>
      
      {/* Header */}
      <header className="relative z-10 bg-white/90 backdrop-blur-md shadow-sm border-b border-purple-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">
                GlobeTrotter
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200">
                <Bell className="h-6 w-6" />
              </button>
              
              <button 
                onClick={() => router.push('/profile')}
                className="flex items-center space-x-3 hover:bg-purple-50 rounded-lg p-2 transition-all duration-200"
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-purple-600">{user.email}</p>
                </div>
                
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </button>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200">
                  <Settings className="h-5 w-5" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-purple-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-purple-200/50 py-4">
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => router.push('/profile')}
                  className="flex items-center space-x-3 hover:bg-purple-50 rounded-lg p-3 transition-all duration-200"
                >
                  <User className="h-5 w-5 text-purple-500" />
                  <span className="text-gray-700">Profile</span>
                </button>
                <button className="flex items-center space-x-3 hover:bg-purple-50 rounded-lg p-3 transition-all duration-200">
                  <Bell className="h-5 w-5 text-purple-500" />
                  <span className="text-gray-700">Notifications</span>
                </button>
                <button className="flex items-center space-x-3 hover:bg-purple-50 rounded-lg p-3 transition-all duration-200">
                  <Settings className="h-5 w-5 text-purple-500" />
                  <span className="text-gray-700">Settings</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-3 hover:bg-red-50 rounded-lg p-3 transition-all duration-200 text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent mb-2">
            Welcome back, {user.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-purple-600 text-lg">Track your adventures and plan your next journey</p>
        </div>

        {/* Map Section - Full Width at Top */}
        <div className={`mb-8 ${isMapFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-md">
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Your Travel Map
              </h3>
              <button 
                onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                className="text-purple-600 hover:text-purple-700 font-medium px-4 py-2 rounded-lg hover:bg-purple-50 transition-all duration-200 flex items-center space-x-2"
              >
                <span>{isMapFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMapFullscreen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5m11 0L20 9m0 0h-4.5M20 9v4.5m-11 11L3.5 20.5M9 20.5v-4.5m0 4.5h4.5m6.5-11L20.5 15M20.5 15H16m4.5 0v4.5" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  )}
                </svg>
              </button>
            </div>
            
            <div className="px-6 pb-6">
              <TripMap height={isMapFullscreen ? 'calc(100vh - 200px)' : '400px'} />
            </div>
          </div>
        </div>

        {/* Filters Section */}
        {!isMapFullscreen && (
          <div className="mb-8">
            <TripsFilter
              onSearchChange={setSearchTerm}
              onFilterChange={setFilters}
              onSortChange={setSortBy}
              onGroupChange={setGroupBy}
            />
          </div>
        )}

        {/* Trips List Section */}
        {!isMapFullscreen && (
          <div className="mb-20">
            <TripsList
              searchTerm={searchTerm}
              filters={filters}
              sortBy={sortBy}
              groupBy={groupBy}
            />
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {!isMapFullscreen && (
        <FloatingActionButton />
      )}
    </div>
  );
}
