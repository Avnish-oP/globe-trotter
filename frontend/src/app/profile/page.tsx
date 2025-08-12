'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Edit3, 
  MapPin, 
  Camera, 
  ArrowLeft,
  User,
  Plane,
  Calendar,
  DollarSign,
  Clock,
  Star,
  Heart,
  Settings
} from 'lucide-react';
import { TripCard } from '@/components/TripCard';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import { tripsAPI } from '@/lib/api';

interface Trip {
  id: string;
  trip_id?: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  total_budget?: number;
  currency: string;
  image_url?: string;
  destinations?: Array<{
    name: string;
    country: string;
    type: string;
  }>;
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
  status?: 'planned' | 'completed' | 'ongoing';
  created_at?: string;
  updated_at?: string;
}

interface UserStats {
  totalTrips: number;
  plannedTrips: number;
  completedTrips: number;
  totalBudget: number;
  countries_visited: number;
  cities_visited: number;
  favorite_destinations: string[];
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

export default function ProfilePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'planned' | 'previous'>('planned');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalTrips: 0,
    plannedTrips: 0,
    completedTrips: 0,
    totalBudget: 0,
    countries_visited: 0,
    cities_visited: 0,
    favorite_destinations: []
  });
  const [tripsLoading, setTripsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user trips and calculate stats
  useEffect(() => {
    const fetchUserTrips = async () => {
      if (!user) return;
      
      setTripsLoading(true);
      setError(null);
      try {
        console.log('Fetching user trips...');
        const response = await tripsAPI.getUserTrips();
        console.log('User trips response:', response);
        
        // Check different possible response structures
        let userTrips: Trip[] = [];
        if (response && response.success && response.data) {
          userTrips = response.data;
        } else if (response && response.trips) {
          userTrips = response.trips;
        } else if (response && Array.isArray(response)) {
          userTrips = response;
        } else {
          console.warn('Unexpected trips response structure:', response);
        }
        
        console.log('Processed user trips:', userTrips);
        setTrips(userTrips);

        // Calculate user stats
        const currentDate = new Date();
        console.log('Current date for comparison:', currentDate);
        
        const planned = userTrips.filter((trip: Trip) => {
          const startDate = new Date(trip.start_date);
          console.log(`Trip "${trip.title}": start_date=${trip.start_date}, parsed=${startDate}, isPlanned=${startDate > currentDate}`);
          return startDate > currentDate;
        });
        
        const completed = userTrips.filter((trip: Trip) => {
          const endDate = new Date(trip.end_date);
          return endDate < currentDate;
        });
        
        const totalBudget = userTrips.reduce((sum: number, trip: Trip) => sum + (trip.total_budget || 0), 0);
        
        // Calculate unique countries and cities from stops data
        const allCountries = new Set<string>();
        const allCities = new Set<string>();
        
        userTrips.forEach((trip: Trip) => {
          if (trip.stops && Array.isArray(trip.stops)) {
            trip.stops.forEach((stop: any) => {
              if (stop.country_name) {
                allCountries.add(stop.country_name);
              }
              if (stop.city_name) {
                allCities.add(stop.city_name);
              }
            });
          }
          // Fallback to destinations if stops is not available
          else if (trip.destinations && Array.isArray(trip.destinations)) {
            trip.destinations.forEach((dest: any) => {
              if (dest.country) {
                allCountries.add(dest.country);
              }
              if (dest.name) {
                allCities.add(dest.name);
              }
            });
          }
        });
        
        const calculatedStats = {
          totalTrips: userTrips.length,
          plannedTrips: planned.length,
          completedTrips: completed.length,
          totalBudget,
          countries_visited: allCountries.size,
          cities_visited: allCities.size,
          favorite_destinations: Array.from(allCities).slice(0, 5) // Top 5 most visited
        };
        
        console.log('Calculated stats:', calculatedStats);
        setUserStats(calculatedStats);
      } catch (error) {
        console.error('Failed to fetch user trips:', error);
        setError('Failed to load trips. Please try again later.');
      } finally {
        setTripsLoading(false);
      }
    };

    fetchUserTrips();
  }, [user]);

  // Handle profile picture change
  const handleProfilePictureChange = (newUrl: string | null) => {
    // The ProfilePictureUpload component handles the API call
    // The user context will be updated automatically on next page load/refresh
    console.log('Profile picture updated:', newUrl);
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  const handleEditProfile = () => {
    // Navigate to edit profile page or open modal
    router.push('/profile/edit');
  };

  const handleViewTrip = (tripId: string) => {
    router.push(`/trips/${tripId}`);
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Filter trips based on current date
  const currentDate = new Date();
  const plannedTrips = trips.filter(trip => new Date(trip.start_date) > currentDate);
  const previousTrips = trips.filter(trip => new Date(trip.end_date) < currentDate);

  // Convert Trip format to TripCard format
  const convertTripForCard = (trip: Trip) => {
    // Get destination string from stops or destinations
    let destination = 'No destination';
    
    if (trip.stops && trip.stops.length > 0) {
      destination = trip.stops.map(stop => stop.city_name).join(', ');
    } else if (trip.destinations && trip.destinations.length > 0) {
      destination = trip.destinations.map(dest => dest.name).join(', ');
    }
    
    return {
      id: trip.id || trip.trip_id || '',
      title: trip.title,
      destination,
      imageUrl: trip.image_url,
      startDate: trip.start_date,
      endDate: trip.end_date,
      budget: trip.total_budget,
      status: new Date(trip.end_date) < currentDate ? 'completed' as const : 'planned' as const
    };
  };

  return (
    <div className="min-h-screen relative font-sans bg-[#f5f3ff] overflow-hidden">
      {/* Blurred mountain hiker background */}
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center blur-[6px] opacity-60 -z-20"
        style={{ backgroundImage: "url('/mountain-hiker-bg.png')" }}
        aria-hidden="true"
      />
      {/* Doodle SVGs background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <DoodleBackground count={40} />
      </div>

      {/* Header */}
      <header className="bg-white/90 shadow-sm border-b border-purple-200/50 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={handleBackToDashboard}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center">
              <Plane className="h-8 w-8 text-violet-500 mr-2" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">GlobeTrotter</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Profile Header */}
  <div className="bg-white/90 rounded-xl shadow-sm border border-purple-200/50 p-6 mb-8 backdrop-blur-md">
          <div className="flex items-start justify-between">
            {/* Left Side - Profile Info */}
            <div className="flex items-start space-x-6">
              {/* Profile Picture */}
              <div className="relative">
                <ProfilePictureUpload
                  currentImageUrl={user.profile_picture_url}
                  onImageChange={handleProfilePictureChange}
                  size="lg"
                  userName={user.name}
                />
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent mb-2">{user.name}</h2>
                <p className="text-purple-600 mb-4">{user.email}</p>
                
                {/* User Details */}
                <div className="space-y-2 text-sm">
                  {user.country_origin && (
                    <div className="flex items-center text-purple-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{user.country_origin}</span>
                    </div>
                  )}
                  
                  {user.travel_style && (
                    <div className="flex items-center text-purple-600">
                      <User className="h-4 w-4 mr-2" />
                      <span className="capitalize">{user.travel_style.replace('-', ' ')} Traveler</span>
                    </div>
                  )}
                </div>

                {/* Edit Profile Button */}
                <button
                  onClick={handleEditProfile}
                  className="mt-4 bg-gradient-to-r from-purple-500 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-violet-700 transition-colors flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Right Side - Total Trips */}
            <div className="text-center">
        <div className="bg-gradient-to-r from-purple-100 to-violet-100 rounded-lg p-4 min-w-[120px]">
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent mb-1">{userStats.totalTrips}</div>
          <div className="text-sm text-purple-600">Total Trips</div>
              </div>
            </div>
          </div>

          {/* Favorite Activities */}
          {user.fav_activities && user.fav_activities.length > 0 && (
            <div className="mt-6 pt-6 border-t border-purple-200/50">
              <h3 className="text-sm font-medium text-purple-700 mb-3">Favorite Activities</h3>
              <div className="flex flex-wrap gap-2">
                {user.fav_activities.map((activity, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                  >
                    {activity.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Profile Information */}
          <div className="mt-6 pt-6 border-t border-purple-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Travel Experience */}
              {user.travel_experience_level && (
                <div>
                  <h3 className="text-sm font-medium text-purple-700 mb-2">Travel Experience</h3>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="text-purple-600 capitalize">{user.travel_experience_level}</span>
                  </div>
                </div>
              )}

              {/* Preferred Currency */}
              {user.preferred_currency && (
                <div>
                  <h3 className="text-sm font-medium text-purple-700 mb-2">Preferred Currency</h3>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="text-purple-600">{user.preferred_currency}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Joined Date */}
            {user.created_at && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-purple-700 mb-2">Member Since</h3>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-purple-500 mr-2" />
                  <span className="text-purple-600">
                    {new Date(user.created_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trip Statistics */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 p-6 rounded-xl shadow-sm border border-purple-200/50 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm">Planned Trips</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">{userStats.plannedTrips}</p>
              </div>
              <Calendar className="h-12 w-12 text-violet-500" />
            </div>
          </div>

          <div className="bg-white/90 p-6 rounded-xl shadow-sm border border-purple-200/50 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm">Completed Trips</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">{userStats.completedTrips}</p>
              </div>
              <MapPin className="h-12 w-12 text-purple-500" />
            </div>
          </div>

          <div className="bg-white/90 p-6 rounded-xl shadow-sm border border-purple-200/50 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm">Total Budget</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">
                  ${userStats.totalBudget.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-violet-500" />
            </div>
          </div>

          <div className="bg-white/90 p-6 rounded-xl shadow-sm border border-purple-200/50 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm">Countries Visited</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">{userStats.countries_visited}</p>
              </div>
              <Star className="h-12 w-12 text-violet-500" />
            </div>
          </div>
        </div>

        {/* Trips Section */}
  <div className="bg-white/90 rounded-xl shadow-sm border border-purple-200/50 p-6 backdrop-blur-md">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-purple-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('planned')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'planned'
                  ? 'bg-white text-purple-900 shadow-sm'
                  : 'text-purple-600 hover:text-purple-900'
              }`}
            >
              Planned Trips ({userStats.plannedTrips})
            </button>
            <button
              onClick={() => setActiveTab('previous')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'previous'
                  ? 'bg-white text-purple-900 shadow-sm'
                  : 'text-purple-600 hover:text-purple-900'
              }`}
            >
              Previous Trips ({userStats.completedTrips})
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-red-800">
                  <p className="font-medium">Unable to load trips</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {tripsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <span className="ml-3 text-purple-600">Loading trips...</span>
            </div>
          ) : (
            <>
              {/* Trip Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === 'planned' ? (
                  plannedTrips.length > 0 ? (
                    plannedTrips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={convertTripForCard(trip)}
                        onView={handleViewTrip}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No planned trips yet</h4>
                      <p className="text-gray-600 mb-6">Start planning your next adventure!</p>
                      <button 
                        onClick={() => router.push('/trips/new')}
                        className="bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        Plan New Trip
                      </button>
                    </div>
                  )
                ) : (
                  previousTrips.length > 0 ? (
                    previousTrips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={convertTripForCard(trip)}
                        onView={handleViewTrip}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No previous trips</h4>
                      <p className="text-gray-600">Your completed trips will appear here.</p>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
