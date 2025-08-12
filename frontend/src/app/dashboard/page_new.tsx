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
        setDashboardStats(statsRes.value.data);
      }
      setLoadingStates(prev => ({ ...prev, stats: false }));

      // Handle trips
      if (tripsRes.status === 'fulfilled') {
        setUpcomingTrips(tripsRes.value.data);
      }
      setLoadingStates(prev => ({ ...prev, trips: false }));

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
        recommendations: false
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
      const response = await dashboardAPI.searchPublicTrips({ q: query });
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
                  
                  <div className="space-y-3">
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
                        {formatDate(trip.start_date)}
                      </div>
                      <div className="font-semibold text-primary">
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
              <Plane className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">No upcoming trips</h4>
              <p className="text-muted-foreground mb-6">Start planning your next adventure!</p>
              <button 
                onClick={() => router.push('/trips/new')}
                className="btn-primary"
              >
                Plan Your First Trip
              </button>
            </div>
          )}
        </div>

        {/* Enhanced Popular Cities Section */}
        <div className="card-elevated bg-white/90 backdrop-blur-sm mb-12 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-heading-md text-foreground font-bold">Popular Destinations</h3>
              <p className="text-caption text-muted-foreground mt-1">Discover trending travel spots</p>
            </div>
            <button className="btn-secondary text-sm">
              Explore More
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          {loadingStates.cities ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="text-center">
                  <div className="skeleton w-24 h-24 rounded-full mx-auto mb-3" />
                  <div className="skeleton h-4 w-16 mx-auto mb-1" />
                  <div className="skeleton h-3 w-12 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {popularCities.map((city) => (
                <div 
                  key={city.city_id} 
                  className="text-center cursor-pointer group"
                  onClick={() => router.push(`/cities/${city.city_id}`)}
                >
                  <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-gradient-cool shadow-medium group-hover:shadow-strong transition-all duration-300">
                    {city.image_url ? (
                      <img 
                        src={city.image_url} 
                        alt={city.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="h-10 w-10 text-white/80" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{city.name}</h4>
                  <p className="text-caption text-muted-foreground">{city.country_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Recommended Destinations */}
        <div className="card-elevated bg-white/90 backdrop-blur-sm mb-12 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="mb-8">
            <h3 className="text-heading-md text-foreground font-bold">Recommended for You</h3>
            <p className="text-caption text-muted-foreground mt-1">Personalized suggestions based on your preferences</p>
          </div>
          
          {loadingStates.recommendations ? (
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-80">
                  <div className="skeleton h-40 w-full rounded-lg mb-3" />
                  <div className="skeleton h-4 w-3/4 mb-1" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {recommendedDestinations.map((destination) => (
                <div 
                  key={destination.city_id} 
                  className="flex-shrink-0 w-80 cursor-pointer group"
                  onClick={() => router.push(`/cities/${destination.city_id}`)}
                >
                  <div className="h-40 bg-gradient-warm rounded-lg overflow-hidden mb-3 shadow-medium group-hover:shadow-strong transition-all duration-300">
                    {destination.image_url ? (
                      <img 
                        src={destination.image_url} 
                        alt={destination.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-white/80" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{destination.name}</h4>
                  <p className="text-caption text-muted-foreground">{destination.country_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Trip Search */}
        <div className="card-elevated bg-white/90 backdrop-blur-sm mb-12 animate-fade-in" style={{ animationDelay: '0.9s' }}>
          <div className="mb-8">
            <h3 className="text-heading-md text-foreground font-bold">Discover Public Trips</h3>
            <p className="text-caption text-muted-foreground mt-1">Find inspiration from other travelers</p>
          </div>
          
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search trips by destination, dates, or keywords..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="input-field pl-12 text-sm"
            />
          </div>

          {isSearching && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-caption text-muted-foreground mt-2">Searching for trips...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-4">
              {searchResults.map((trip) => (
                <div key={trip.trip_id} className="card-compact hover-lift">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-2">{trip.title}</h4>
                      <p className="text-caption text-muted-foreground mb-3 line-clamp-2">{trip.description}</p>
                      <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground mb-3">
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
                        <div className="flex flex-wrap gap-2">
                          {trip.cities.map((city, index) => (
                            <span key={index} className="status-info text-xs">
                              {city}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowTrip(trip.trip_id);
                      }}
                      className="btn-primary ml-6 flex-shrink-0"
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
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">No trips found</h4>
              <p className="text-muted-foreground">No public trips found for "{searchQuery}". Try different keywords!</p>
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Floating "Plan New Trip" Button */}
      <button 
        onClick={() => router.push('/trips/new')}
        className="fixed bottom-8 right-8 w-16 h-16 btn-primary rounded-full shadow-strong hover:shadow-strong hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 animate-pulse-soft"
        title="Plan New Trip"
      >
        <Plus className="h-8 w-8" />
      </button>
    </div>
  );
}
