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
  Filter,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Map,
  Camera,
  Bookmark
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
  const [previousTrips, setPreviousTrips] = useState<Trip[]>([]);
  const [popularCities, setPopularCities] = useState<City[]>([]);
  const [recommendedDestinations, setRecommendedDestinations] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Trip[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'budget' | 'popularity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'domestic' | 'international'>('all');
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    trips: true,
    cities: true,
    recommendations: true,
    previousTrips: true
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#232946] via-[#2d3250] to-[#f6c177]">
      {/* Peaceful blurred mountain hiker background */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center blur-[3px] opacity-60 -z-20"
        style={{
          backgroundImage: "url('/mountain-hiker-bg.png')"
        }}
        aria-hidden="true"
      />
      {/* Gentle dark overlay for contrast and calmness */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-black/50 via-indigo-900/30 to-transparent -z-10" aria-hidden="true" />
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Plane className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">GlobeTrotter</h1>
            </div>

            {/* Enhanced User Menu */}
            <div className="flex items-center space-x-6">
              {/* Notification Bell with Badge */}
              <div className="relative">
                <button className="p-3 text-muted-foreground hover:text-primary transition-all duration-200 hover:bg-primary/5 rounded-xl">
                  <Bell className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-semibold">3</span>
                  </span>
                </button>
              </div>
              
              <button 
                onClick={() => router.push('/profile')}
                className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-medium ring-2 ring-white/20">
                    {user.profile_picture_url ? (
                      <img 
                        src={user.profile_picture_url} 
                        alt={user.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-base">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
              </button>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button className="p-3 text-muted-foreground hover:text-primary transition-all duration-200 hover:bg-primary/5 rounded-xl">
                  <Settings className="h-5 w-5" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-3 text-muted-foreground hover:text-red-500 transition-all duration-200 hover:bg-red-50 rounded-xl"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 relative z-10">
        {/* Hero Banner Section */}
        <div className="relative mb-8 rounded-2xl overflow-hidden bg-gradient-primary p-8 lg:p-12 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                  Welcome back, {user.name.split(' ')[0]}! 🌍
                </h1>
                <p className="text-xl text-white/90 mb-6">
                  Your next adventure awaits. Discover new destinations and create unforgettable memories.
                </p>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{dashboardStats?.countriesVisited || 0} Countries Explored</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>{dashboardStats?.totalTrips || 0} Adventures Completed</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>{dashboardStats?.upcomingTrips || 0} Trips Planned</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button 
                  onClick={() => router.push('/trips/new')}
                  className="bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
                >
                  <Plus className="h-5 w-5 mr-2 inline" />
                  Plan New Adventure
                </button>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Search, Filter, and Sort Bar */}
        <div className="card-elevated bg-white/95 backdrop-blur-sm mb-8 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search destinations, trips, or experiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12 w-full"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as 'all' | 'domestic' | 'international')}
                className="input-field pr-10 min-w-[160px] appearance-none cursor-pointer"
              >
                <option value="all">All Destinations</option>
                <option value="domestic">Domestic</option>
                <option value="international">International</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  setSortBy(sort as 'date' | 'budget' | 'popularity');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="input-field pr-10 min-w-[160px] appearance-none cursor-pointer"
              >
                <option value="date-desc">Latest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="budget-desc">High Budget</option>
                <option value="budget-asc">Low Budget</option>
                <option value="popularity-desc">Most Popular</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button className="btn-secondary p-3" title="Map View">
                <Map className="h-5 w-5" />
              </button>
              <button className="btn-secondary p-3" title="Saved Trips">
                <Bookmark className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Top Regional Destinations Section */}
        <div className="card-elevated bg-white/95 backdrop-blur-sm mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-heading-lg text-foreground font-bold">Top Regional Destinations</h2>
              <p className="text-caption text-muted-foreground mt-1">Discover the most popular places to visit</p>
            </div>
            <button className="btn-secondary text-sm">
              View All Regions
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {loadingStates.cities ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="text-center">
                  <div className="skeleton h-48 w-full rounded-xl mb-4" />
                  <div className="skeleton h-5 w-24 mx-auto mb-2" />
                  <div className="skeleton h-4 w-16 mx-auto mb-1" />
                  <div className="skeleton h-3 w-20 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularCities.map((city, index) => (
                <div 
                  key={city.city_id} 
                  className="group cursor-pointer"
                  onClick={() => router.push(`/cities/${city.city_id}`)}
                >
                  <div className="relative h-48 rounded-xl overflow-hidden mb-4 shadow-medium group-hover:shadow-strong transition-all duration-300">
                    {city.image_url ? (
                      <img 
                        src={city.image_url} 
                        alt={city.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-cool flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-white/80" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:from-black/30 transition-colors"></div>
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 text-primary px-2 py-1 rounded-full text-xs font-semibold">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-bold text-lg mb-1">{city.name}</h3>
                      <p className="text-sm text-white/90">{city.country_name}</p>
                    </div>
                    <div className="absolute top-3 right-3">
                      <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                        <Star className="h-3 w-3 text-yellow-400 mr-1" />
                        <span className="text-xs text-white font-medium">
                          {city.popularity_score ? (city.popularity_score / 10).toFixed(1) : '4.5'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Previous Trips Section */}
        <div className="card-elevated bg-white/95 backdrop-blur-sm mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-heading-lg text-foreground font-bold">Your Travel History</h2>
              <p className="text-caption text-muted-foreground mt-1">Relive your amazing adventures</p>
            </div>
            <button className="btn-secondary text-sm">
              View All Trips
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {loadingStates.previousTrips ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-compact">
                  <div className="skeleton h-40 w-full mb-4 rounded-lg" />
                  <div className="skeleton h-5 w-3/4 mb-2" />
                  <div className="skeleton h-4 w-1/2 mb-2" />
                  <div className="skeleton h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : previousTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {previousTrips.slice(0, 6).map((trip) => (
                <div 
                  key={trip.trip_id} 
                  className="card-compact hover-lift cursor-pointer group"
                  onClick={() => router.push(`/trips/${trip.trip_id}`)}
                >
                  <div className="relative h-40 bg-gradient-warm rounded-lg overflow-hidden mb-4">
                    {trip.cover_image_url ? (
                      <img 
                        src={trip.cover_image_url} 
                        alt={trip.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-warm">
                        <Camera className="h-12 w-12 text-white/80" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute top-3 right-3">
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Completed
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {trip.title}
                      </h4>
                      <p className="text-caption text-muted-foreground line-clamp-2 mt-1">
                        {trip.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(trip.end_date)}
                      </div>
                      <div className="font-semibold text-emerald-600">
                        {formatCurrency(trip.total_budget, trip.currency)}
                      </div>
                    </div>
                    
                    {trip.cities && trip.cities.length > 0 && (
                      <div className="flex items-center text-caption text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {trip.cities.slice(0, 2).join(', ')}
                        {trip.cities.length > 2 && ` +${trip.cities.length - 2} more`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">No trips yet</h4>
              <p className="text-muted-foreground mb-6">Start your travel journey and create amazing memories!</p>
              <button 
                onClick={() => router.push('/trips/new')}
                className="btn-primary"
              >
                Plan Your First Adventure
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Floating "Plan New Trip" Button */}
      <button 
        onClick={() => router.push('/trips/new')}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-primary text-white rounded-full shadow-strong hover:shadow-strong hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 animate-pulse-soft group"
        title="Plan New Adventure"
      >
        <Plus className="h-8 w-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
