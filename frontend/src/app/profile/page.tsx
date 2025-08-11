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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={handleBackToDashboard}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center">
              <Plane className="h-8 w-8 text-emerald-500 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">GlobeTrotter</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h2>
                <p className="text-gray-600 mb-4">{user.email}</p>
                
                {/* User Details */}
                <div className="space-y-2 text-sm">
                  {user.country_origin && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{user.country_origin}</span>
                    </div>
                  )}
                  
                  {user.travel_style && (
                    <div className="flex items-center text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      <span className="capitalize">{user.travel_style.replace('-', ' ')} Traveler</span>
                    </div>
                  )}
                </div>

                {/* Edit Profile Button */}
                <button
                  onClick={handleEditProfile}
                  className="mt-4 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Right Side - Total Trips */}
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-4 min-w-[120px]">
                <div className="text-3xl font-bold text-gray-900 mb-1">{totalTrips}</div>
                <div className="text-sm text-gray-600">Total Trips</div>
              </div>
            </div>
          </div>

          {/* Favorite Activities */}
          {user.fav_activities && user.fav_activities.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Favorite Activities</h3>
              <div className="flex flex-wrap gap-2">
                {user.fav_activities.map((activity, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium"
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
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Planned Trips</p>
                <p className="text-3xl font-bold text-gray-900">{plannedTrips.length}</p>
              </div>
              <Calendar className="h-12 w-12 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed Trips</p>
                <p className="text-3xl font-bold text-gray-900">{previousTrips.length}</p>
              </div>
              <MapPin className="h-12 w-12 text-teal-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Budget</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${([...plannedTrips, ...previousTrips].reduce((sum, trip) => sum + (trip.budget || 0), 0)).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-violet-500" />
            </div>
          </div>
        </div>

        {/* Trips Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('planned')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'planned'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Planned Trips ({plannedTrips.length})
            </button>
            <button
              onClick={() => setActiveTab('previous')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'previous'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
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
