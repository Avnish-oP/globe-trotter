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
  Globe
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Trip[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    trips: true,
    cities: true,
    recommendations: true
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
        dashboardAPI.getPopularCities(5),
        dashboardAPI.getRecommendedDestinations()
      ]);

      // Handle stats
      if (statsRes.status === 'fulfilled') {
        setDashboardStats(statsRes.value.data.stats);
      }
      setLoadingStates(prev => ({ ...prev, stats: false }));

      // Handle upcoming trips
      if (tripsRes.status === 'fulfilled') {
        setUpcomingTrips(tripsRes.value.data);
      }
      setLoadingStates(prev => ({ ...prev, trips: false }));

      // Handle popular cities
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
      console.error('Search error:', error);
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

  // Skeleton loader component
  const SkeletonLoader = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced background with lighter gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-br from-blue-100/30 to-indigo-100/30 blur-3xl animate-float-gentle" />
        <div className="absolute top-1/4 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-violet-100/25 to-purple-100/25 blur-3xl animate-float-gentle" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-1/4 left-1/3 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-100/20 to-teal-100/20 blur-3xl animate-float-gentle" style={{ animationDelay: '6s' }} />
      </div>

      {/* Enhanced Professional Header */}
      <header className="glass-nature shadow-soft border-b border-border/50 relative z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Enhanced Logo */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-primary rounded-xl shadow-medium">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient-primary">GlobeTrotter</h1>
                <p className="text-xs text-muted-foreground font-medium">Explore the World</p>
              </div>
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
              
              {/* User Profile Section */}
              <div className="flex items-center space-x-4 pl-4 border-l border-border/50">
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
              </div>

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
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 relative z-10">
        {/* Enhanced Welcome Section */}
        <div className="mb-12 text-center lg:text-left">
          <h2 className="text-heading-xl text-foreground mb-4 animate-fade-in">
            Welcome back, {user.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-body-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Ready to plan your next adventure and explore the world?
          </p>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="card-elevated hover-lift bg-white/80 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption font-medium text-muted-foreground mb-2">Total Trips</p>
                {loadingStates.stats ? (
                  <div className="skeleton h-8 w-16 mb-1" />
                ) : (
                  <p className="text-heading-md text-foreground font-bold">{dashboardStats?.totalTrips || 0}</p>
                )}
                <p className="text-xs text-green-600 font-medium">+2 this month</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card-elevated hover-lift bg-white/80 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption font-medium text-muted-foreground mb-2">Countries Visited</p>
                {loadingStates.stats ? (
                  <div className="skeleton h-8 w-16 mb-1" />
                ) : (
                  <p className="text-heading-md text-foreground font-bold">{dashboardStats?.countriesVisited || 0}</p>
                )}
                <p className="text-xs text-green-600 font-medium">+1 this year</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <Globe className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="card-elevated hover-lift bg-white/80 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption font-medium text-muted-foreground mb-2">Total Budget</p>
                {loadingStates.stats ? (
                  <div className="skeleton h-8 w-20 mb-1" />
                ) : (
                  <p className="text-heading-md text-foreground font-bold">
                    {formatCurrency(dashboardStats?.totalBudget || 0)}
                  </p>
                )}
                <p className="text-xs text-blue-600 font-medium">Budget tracking</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card-elevated hover-lift bg-white/80 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption font-medium text-muted-foreground mb-2">Upcoming Trips</p>
                {loadingStates.stats ? (
                  <div className="skeleton h-8 w-16 mb-1" />
                ) : (
                  <p className="text-heading-md text-foreground font-bold">{dashboardStats?.upcomingTrips || 0}</p>
                )}
                <p className="text-xs text-orange-600 font-medium">Next 30 days</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Upcoming Trips Section */}
        <div className="card-elevated bg-white/90 backdrop-blur-sm mb-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-heading-md text-foreground font-bold">Upcoming Adventures</h3>
              <p className="text-caption text-muted-foreground mt-1">Your planned journeys await</p>
            </div>
            <button className="btn-secondary text-sm">
              View All
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          {loadingStates.trips ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-compact">
                  <div className="skeleton h-40 w-full mb-4 rounded-lg" />
                  <div className="skeleton h-4 w-3/4 mb-2" />
                  <div className="skeleton h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : upcomingTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTrips.map((trip) => (
                <div 
                  key={trip.trip_id} 
                  className="card-compact hover-lift cursor-pointer group"
                  onClick={() => router.push(`/trips/${trip.trip_id}`)}
                >
                  <div className="h-48 bg-gradient-cool relative overflow-hidden rounded-lg mb-4">
                    {trip.cover_image_url ? (
                      <img 
                        src={trip.cover_image_url} 
                        alt={trip.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-cool">
                        <MapPin className="h-12 w-12 text-white/80" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute top-3 right-3">
                      <span className="status-info">{trip.status}</span>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {trip.title}
                      </h4>
                      <p className="text-caption text-muted-foreground line-clamp-2 mt-1">
                        {trip.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                      </div>
                      <div className="font-semibold text-primary">
                        {formatCurrency(trip.total_budget, trip.currency)}
                      </div>
                    </div>
                    {trip.cities && trip.cities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {trip.cities.slice(0, 3).map((city, index) => (
                          <span key={index} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                            {city}
                          </span>
                        ))}
                        {trip.cities.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{trip.cities.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Plane className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">No upcoming trips</h4>
              <p className="text-muted-foreground mb-6">Start planning your next adventure!</p>
              <button 
                onClick={() => router.push('/trips/new')}
                className="gradient-primary text-white px-6 py-3 rounded-lg hover:opacity-95 transition-colors"
              >
                Plan Your First Trip
              </button>
            </div>
          )}
        </div>

        {/* Popular Cities Section */}
        <div className="glass-nature rounded-xl border border-border/40 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground">Popular Destinations</h3>
            <button className="text-primary hover:text-primary/80 font-medium">Explore More</button>
          </div>
          
          {loadingStates.cities ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="text-center">
                  <SkeletonLoader className="w-20 h-20 rounded-full mx-auto mb-2" />
                  <SkeletonLoader className="h-4 w-16 mx-auto mb-1" />
                  <SkeletonLoader className="h-3 w-12 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {popularCities.map((city) => (
                <div 
                  key={city.city_id} 
                  className="text-center cursor-pointer group"
                  onClick={() => router.push(`/cities/${city.city_id}`)}
                >
                  <div className="w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden bg-gradient-to-r from-primary/20 to-accent/20 group-hover:shadow-lg transition-shadow">
                    {city.image_url ? (
                      <img 
                        src={city.image_url} 
                        alt={city.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-primary" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">{city.name}</h4>
                  <p className="text-sm text-muted-foreground">{city.country_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Destinations */}
        <div className="glass-nature rounded-xl border border-border/40 p-6 mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-6">Recommended for You</h3>
          
          {loadingStates.recommendations ? (
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-64">
                  <SkeletonLoader className="h-32 w-full rounded-lg mb-2" />
                  <SkeletonLoader className="h-4 w-3/4 mb-1" />
                  <SkeletonLoader className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {recommendedDestinations.map((destination) => (
                <div 
                  key={destination.city_id} 
                  className="flex-shrink-0 w-64 cursor-pointer group"
                  onClick={() => router.push(`/cities/${destination.city_id}`)}
                >
                  <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg overflow-hidden mb-2 group-hover:shadow-lg transition-shadow">
                    {destination.image_url ? (
                      <img 
                        src={destination.image_url} 
                        alt={destination.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-primary" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">{destination.name}</h4>
                  <p className="text-sm text-muted-foreground">{destination.country_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trip Search */}
        <div className="glass-nature rounded-xl border border-border/40 p-6 mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-6">Discover Public Trips</h3>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search trips by destination or date..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-xl  bg-lavender/90 text-black focus:ring-2 focus:ring-lavender/400 focus:border-primary/50 transition-colors"
            />
          </div>

          {isSearching && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-4">
              {searchResults.map((trip) => (
                <div key={trip.trip_id} className="border border-border/40 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">{trip.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{trip.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatCurrency(trip.total_budget, trip.currency)}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          by {trip.created_by}
                        </span>
                      </div>
                      {trip.cities && trip.cities.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {trip.cities.map((city, index) => (
                            <span key={index} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                              {city}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleFollowTrip(trip.trip_id)}
                      className="ml-4 flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Follow Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No public trips found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating "Plan New Trip" Button */}
      <button 
        onClick={() => router.push('/trips/new')}
        className="fixed bottom-6 right-6 w-16 h-16 gradient-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center z-50"
      >
        <Plus className="h-8 w-8" />
      </button>
    </div>
  );
}
