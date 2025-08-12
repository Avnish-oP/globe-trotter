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
  DollarSign
} from 'lucide-react';
import { TripCard } from '@/components/TripCard';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';

// Mock data for trips - replace with actual API calls
const mockTrips = {
  planned: [
    {
      id: '1',
      title: 'European Adventure',
      destination: 'Paris, Rome, Barcelona',
      imageUrl: '/public/placeholder-trip-1.jpg',
      startDate: '2025-06-15',
      endDate: '2025-06-30',
      budget: 3500,
      status: 'planned' as const
    },
    {
      id: '2',
      title: 'Asian Discovery',
      destination: 'Tokyo, Seoul, Bangkok',
      startDate: '2025-09-10',
      endDate: '2025-09-25',
      budget: 4200,
      status: 'planned' as const
    }
  ],
  previous: [
    {
      id: '3',
      title: 'California Coast Road Trip',
      destination: 'San Francisco, Los Angeles, San Diego',
      imageUrl: '/public/placeholder-trip-2.jpg',
      startDate: '2024-08-05',
      endDate: '2024-08-20',
      budget: 2800,
      status: 'completed' as const
    },
    {
      id: '4',
      title: 'New York City Weekend',
      destination: 'New York, NY',
      startDate: '2024-12-15',
      endDate: '2024-12-18',
      budget: 1200,
      status: 'completed' as const
    }
  ]
};

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

  const totalTrips = mockTrips.planned.length + mockTrips.previous.length;
  const plannedTrips = mockTrips.planned;
  const previousTrips = mockTrips.previous;

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
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent mb-1">{totalTrips}</div>
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
        </div>

        {/* Trip Statistics */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/90 p-6 rounded-xl shadow-sm border border-purple-200/50 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm">Planned Trips</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">{plannedTrips.length}</p>
              </div>
              <Calendar className="h-12 w-12 text-violet-500" />
            </div>
          </div>

          <div className="bg-white/90 p-6 rounded-xl shadow-sm border border-purple-200/50 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm">Completed Trips</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">{previousTrips.length}</p>
              </div>
              <MapPin className="h-12 w-12 text-purple-500" />
            </div>
          </div>

          <div className="bg-white/90 p-6 rounded-xl shadow-sm border border-purple-200/50 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm">Total Budget</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">
                  ${([...plannedTrips, ...previousTrips].reduce((sum, trip) => sum + (trip.budget || 0), 0)).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-violet-500" />
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
              Planned Trips ({plannedTrips.length})
            </button>
            <button
              onClick={() => setActiveTab('previous')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'previous'
                  ? 'bg-white text-purple-900 shadow-sm'
                  : 'text-purple-600 hover:text-purple-900'
              }`}
            >
              Previous Trips ({previousTrips.length})
            </button>
          </div>

          {/* Trip Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'planned' ? (
              plannedTrips.length > 0 ? (
                plannedTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
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
                    trip={trip}
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
        </div>
      </main>
    </div>
  );
}
