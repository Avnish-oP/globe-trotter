'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TripMap from '@/components/TripMap';
import TripsFilter, { FilterState, SortOption, GroupOption } from '@/components/TripsFilter';
import TripsList from '@/components/TripsList';
import FloatingActionButton from '@/components/FloatingActionButton';
import TripRecommendations from '@/components/TripRecommendations';
import Navigation from '@/components/Navigation';
import AdvancedSearch from '@/components/AdvancedSearch';
import { dashboardAPI, tripsAPI } from '@/lib/api';
import { 
  Plane, 
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  Share2,
  Clock,
  Star,
  Heart,
  ChevronRight,
  Filter,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Map,
  Camera,
  Bookmark,
  Search,
  Globe,
  Users
} from 'lucide-react';

interface DashboardStats {
  stats: {
    totalTrips: number;
    upcomingTrips: number;
    totalBudget: number;
    countriesVisited: number;
  };
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
  stops?: Array<{
    stop_id: string;
    city_id: string;
    city_name: string;
    country_name: string;
    latitude?: string;
    longitude?: string;
    arrival_date?: string;
    departure_date?: string;
  }>;
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

// Doodle SVGs for background
const doodleSvgs = [
  <svg key="bag" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="12" y="20" width="24" height="18" rx="4"/><path d="M16 20v-4a8 8 0 0 1 16 0v4"/></svg>,
  <svg key="trolley" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="16" y="16" width="16" height="20" rx="3"/><path d="M24 16v-6"/><circle cx="20" cy="38" r="2"/><circle cx="28" cy="38" r="2"/></svg>,
  <svg key="umbrella" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><path d="M8 24a16 16 0 0 1 32 0z"/><path d="M24 24v12"/><circle cx="24" cy="40" r="2"/></svg>,
  <svg key="bus" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="6" y="18" width="36" height="16" rx="4"/><circle cx="14" cy="36" r="2"/><circle cx="34" cy="36" r="2"/><path d="M6 26h36"/></svg>,
  <svg key="backpack" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="14" y="18" width="20" height="18" rx="6"/><path d="M24 18v-6"/><path d="M18 36v4"/><path d="M30 36v4"/></svg>,
  <svg key="camera" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><rect x="10" y="18" width="28" height="18" rx="4"/><circle cx="24" cy="27" r="6"/><path d="M18 18l2-4h8l2 4"/></svg>,
  <svg key="mountain" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><path d="M4 40l12-20 8 12 8-16 12 24z"/></svg>,
  <svg key="trekking" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 48 48"><circle cx="24" cy="24" r="10"/><path d="M24 14v10l7 7"/></svg>,
];

function DoodleBackground({ count = 40 }) {
  const doodles = React.useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const Svg = doodleSvgs[Math.floor(Math.random() * doodleSvgs.length)];
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const size = 16 + Math.random() * 32;
      const opacity = 0.10 + Math.random() * 0.18;
      const rotate = Math.random() * 360;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${top}%`,
            left: `${left}%`,
            width: size,
            height: size,
            opacity,
            transform: `rotate(${rotate}deg)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {React.cloneElement(Svg, { width: size, height: size })}
        </div>
      );
    });
  }, [count]);
  return <>{doodles}</>;
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
  // const [sortBy, setSortBy] = useState<'date' | 'budget' | 'popularity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'domestic' | 'international'>('all');
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    trips: true,
    cities: true,
    recommendations: true,
    previousTrips: true
  });
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    countries: [],
    dateRange: { start: '', end: '' },
    budget: { min: 0, max: 10000 }
  });
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [groupBy, setGroupBy] = useState<GroupOption>('none');
  const [allTrips, setAllTrips] = useState<any[]>([]);
  
  // Advanced search states
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-trips' | 'discover'>('my-trips');

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
      // Fetch user trips first (this is the most reliable data source)
      const userTripsRes = await tripsAPI.getUserTrips();
      let userTrips: Trip[] = [];
      
      console.log('Dashboard: User trips response:', userTripsRes);
      
      // Handle different response formats from the API
      if (userTripsRes && userTripsRes.success && userTripsRes.data) {
        userTrips = userTripsRes.data;
      } else if (userTripsRes && userTripsRes.trips) {
        userTrips = userTripsRes.trips;
      } else if (userTripsRes && Array.isArray(userTripsRes)) {
        userTrips = userTripsRes;
      } else {
        console.warn('Unexpected user trips response format:', userTripsRes);
      }
      
      console.log('Dashboard: Processed user trips:', userTrips);
      setAllTrips(userTrips);
      
      if (userTrips.length > 0) {
        // Calculate stats from actual user trips
        const now = new Date();
        console.log('Current date for comparison:', now);
        
        const upcoming = userTrips.filter((trip: Trip) => {
          const startDate = new Date(trip.start_date);
          console.log(`Trip "${trip.title}": start_date=${trip.start_date}, parsed=${startDate}, isUpcoming=${startDate > now}`);
          return startDate > now;
        });
        
        const previous = userTrips.filter((trip: Trip) => {
          const endDate = new Date(trip.end_date);
          return endDate < now;
        });
        
        const totalBudget = userTrips.reduce((sum: number, trip: Trip) => sum + (trip.total_budget || 0), 0);
        
        // Get unique countries from trip stops
        const countries = new Set<string>();
        userTrips.forEach((trip: Trip) => {
          if (trip.stops && Array.isArray(trip.stops)) {
            trip.stops.forEach((stop: any) => {
              if (stop.country_name) {
                countries.add(stop.country_name);
              }
            });
          }
        });
        
        // Set calculated stats
        const calculatedStats = {
          stats: {
            totalTrips: userTrips.length,
            upcomingTrips: upcoming.length,
            totalBudget: totalBudget,
            countriesVisited: countries.size
          }
        };
        
        console.log('Dashboard: Calculated stats:', calculatedStats);
        setDashboardStats(calculatedStats);
        setUpcomingTrips(upcoming);
        setPreviousTrips(previous);
      } else {
        // No trips found, set empty stats
        const emptyStats = {
          stats: {
            totalTrips: 0,
            upcomingTrips: 0,
            totalBudget: 0,
            countriesVisited: 0
          }
        };
        setDashboardStats(emptyStats);
        setUpcomingTrips([]);
        setPreviousTrips([]);
      }
      
      setLoadingStates(prev => ({ ...prev, stats: false, trips: false, previousTrips: false }));

      // Fetch other dashboard data in parallel (these are optional)
      const [citiesRes, recommendationsRes] = await Promise.allSettled([
        dashboardAPI.getPopularCities(8), // Get more cities for regional section
        dashboardAPI.getRecommendedDestinations()
      ]);

      // Handle cities
      if (citiesRes.status === 'fulfilled') {
        setPopularCities(citiesRes.value.data || []);
      }
      setLoadingStates(prev => ({ ...prev, cities: false }));

      // Handle recommendations
      if (recommendationsRes.status === 'fulfilled') {
        setRecommendedDestinations(recommendationsRes.value.data || []);
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

  // Transform API trip data to component format
  const transformTripsForComponents = (trips: any[]) => {
    return trips
      .map(trip => {
        // Get the primary city (first stop) for coordinates
        const primaryCity = trip.stops && trip.stops.length > 0 ? trip.stops[0] : null;
        
        // Determine trip status based on dates
        const now = new Date();
        const startDate = new Date(trip.start_date);
        const endDate = new Date(trip.end_date);
        
        let status: 'upcoming' | 'completed' | 'current' = 'completed';
        if (startDate > now) {
          status = 'upcoming';
        } else if (startDate <= now && endDate >= now) {
          status = 'current';
        }

        // Use actual coordinates from the primary city
        // If coordinates are null, use city name to get approximate coordinates
        let coordinates: [number, number] = [0, 0];
        
        if (primaryCity && primaryCity.latitude && primaryCity.longitude) {
          coordinates = [parseFloat(primaryCity.latitude), parseFloat(primaryCity.longitude)];
        } else if (primaryCity) {
          // Fallback coordinates for common cities
          const cityCoordinates: { [key: string]: [number, number] } = {
            'New York': [40.7128, -74.0060],
            'Paris': [48.8566, 2.3522],
            'Tokyo': [35.6762, 139.6503],
            'London': [51.5074, -0.1278],
            'Sydney': [-33.8688, 151.2093],
            'Delhi': [28.6139, 77.2090],
            'Mumbai': [19.0760, 72.8777],
            'Bangkok': [13.7563, 100.5018],
            'Rome': [41.9028, 12.4964],
            'Barcelona': [41.3851, 2.1734],
            'Berlin': [52.5200, 13.4050],
            'Maldives': [3.2028, 73.2207],
            'Goa': [15.2993, 74.1240],
            'Tehran': [35.6892, 51.3890]
          };
          
          const cityName = primaryCity.city_name;
          coordinates = cityCoordinates[cityName] || [0, 0];
        }

        return {
          id: trip.trip_id,
          name: trip.title,
          coordinates,
          country: primaryCity ? primaryCity.country_name : 'Unknown',
          startDate: trip.start_date,
          endDate: trip.end_date,
          status,
          description: trip.description,
          budget: trip.total_budget,
          imageUrl: trip.cover_image_url || undefined,
          currency: trip.currency || 'USD',
          cities: trip.stops?.map((stop: any) => stop.city_name) || []
        };
      });
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await dashboardAPI.searchPublicTrips({ q: query });
      setSearchResults(response.data.trips || []);
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

  const handleTripSelect = (trip: any) => {
    router.push(`/trips/${trip.id}`);
  };

  const handleTripEdit = (trip: any) => {
    router.push(`/trips/${trip.id}?tab=sections`);
  };

  const handleTripDelete = async (trip: any) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      try {
        await tripsAPI.deleteTrip(trip.id);
        // Refresh trips data
        fetchDashboardData();
      } catch (error) {
        console.error('Error deleting trip:', error);
      }
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
      
      {/* Navigation */}
      <Navigation currentPage="dashboard" showCreateButton={true} />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent mb-2">
            Welcome back, {user.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-purple-600 text-lg">Track your adventures and plan your next journey</p>
        </div>

        {/* Dashboard Stats - Quick Overview */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-purple-200/50 p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Trips</p>
                  <p className="text-2xl font-bold text-purple-700">{dashboardStats.stats.totalTrips}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <Plane className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-purple-200/50 p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Trips</p>
                  <p className="text-2xl font-bold text-green-700">{dashboardStats.stats.upcomingTrips}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-purple-200/50 p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Countries Visited</p>
                  <p className="text-2xl font-bold text-blue-700">{dashboardStats.stats.countriesVisited}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-purple-200/50 p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-amber-700">${dashboardStats.stats.totalBudget.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

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
              <TripMap 
                height={isMapFullscreen ? 'calc(100vh - 200px)' : '400px'} 
                trips={transformTripsForComponents(allTrips)}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        {!isMapFullscreen && (
          <div className="mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-md">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('my-trips')}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
                    activeTab === 'my-trips'
                      ? 'text-purple-700 border-b-2 border-purple-700 bg-purple-50/50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Map className="w-5 h-5" />
                    <span>My Trips</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
                    activeTab === 'discover'
                      ? 'text-purple-700 border-b-2 border-purple-700 bg-purple-50/50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <span>Discover Trips</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'my-trips' && !isMapFullscreen && (
          <>
            {/* Filters Section */}
            <div className="mb-8">
              <TripsFilter
                onSearchChange={setSearchTerm}
                onFilterChange={setFilters}
                onSortChange={setSortBy}
                onGroupChange={setGroupBy}
              />
            </div>

            {/* Recommendations Section */}
            <div className="mb-8">
              <TripRecommendations 
                userTrips={allTrips}
              />
            </div>

            {/* Trips List Section */}
            <div className="mb-20">
              <TripsList
                searchTerm={searchTerm}
                filters={filters}
                sortBy={sortBy}
                groupBy={groupBy}
                trips={transformTripsForComponents(allTrips)}
                onTripSelect={handleTripSelect}
                onTripEdit={handleTripEdit}
                onTripDelete={handleTripDelete}
              />
            </div>
          </>
        )}

        {/* Advanced Search Section */}
        {activeTab === 'discover' && !isMapFullscreen && (
          <div className="mb-20">
            <AdvancedSearch />
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