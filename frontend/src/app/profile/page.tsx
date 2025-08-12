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
    <div className="min-h-screen relative font-sans bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Enhanced gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-100/20 via-transparent to-indigo-100/20 pointer-events-none" />
      
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-violet-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-purple-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleBackToDashboard}
                className="mr-4 p-2 text-gray-600 hover:text-purple-700 transition-all duration-200 rounded-xl hover:bg-purple-50 group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              
              <div className="flex items-center">
                <div className="relative">
                  <Plane className="h-8 w-8 text-purple-600 mr-2 transform transition-transform hover:rotate-12" />
                  <div className="absolute inset-0 bg-purple-600 rounded-full blur-lg opacity-20"></div>
                </div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-purple-700 via-violet-700 to-indigo-700 bg-clip-text text-transparent">
                  GlobeTrotter
                </h1>
              </div>
            </div>
            
            {/* Quick actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleEditProfile}
                className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-200 flex items-center gap-2 group"
              >
                <Edit3 className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
        {/* Enhanced Profile Header */}
        <div className="relative">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl opacity-90"></div>
          <div className="absolute inset-0 opacity-10 rounded-2xl" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-purple-500/10 border border-white/20 p-8">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
              {/* Left Side - Profile Info */}
              <div className="flex flex-col sm:flex-row items-start gap-6 flex-1">
                {/* Enhanced Profile Picture */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative">
                    <ProfilePictureUpload
                      currentImageUrl={user.profile_picture_url}
                      onImageChange={handleProfilePictureChange}
                      size="lg"
                      userName={user.name}
                    />
                  </div>
                </div>

                {/* Enhanced User Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                      {user.name}
                    </h2>
                    <p className="text-gray-600 font-medium">{user.email}</p>
                  </div>
                  
                  {/* Enhanced User Details */}
                  <div className="flex flex-wrap gap-4">
                    {user.country_origin && (
                      <div className="flex items-center bg-purple-50 text-purple-700 px-3 py-2 rounded-xl font-medium">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{user.country_origin}</span>
                      </div>
                    )}
                    
                    {user.travel_style && (
                      <div className="flex items-center bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl font-medium">
                        <User className="h-4 w-4 mr-2" />
                        <span className="capitalize">{user.travel_style.replace('-', ' ')} Traveler</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Right Side - Statistics */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white min-w-[160px] shadow-lg">
                  <div className="text-center">
                    <div className="text-4xl font-black mb-2">{totalTrips}</div>
                    <div className="text-purple-100 font-medium">Total Trips</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white min-w-[160px] shadow-lg">
                  <div className="text-center">
                    <div className="text-4xl font-black mb-2">{previousTrips.length}</div>
                    <div className="text-emerald-100 font-medium">Completed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Favorite Activities */}
            {user.fav_activities && user.fav_activities.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  Favorite Activities
                </h3>
                <div className="flex flex-wrap gap-3">
                  {user.fav_activities.map((activity, index) => (
                    <span 
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-full text-sm font-semibold border border-purple-200 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                    >
                      {activity.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Trip Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg shadow-purple-500/10 border border-white/20 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 opacity-50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-semibold mb-1">Planned Trips</p>
                <p className="text-3xl font-black text-gray-900">{plannedTrips.length}</p>
                <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mt-2"></div>
              </div>
              <div className="relative">
                <Calendar className="h-12 w-12 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-purple-500 rounded-full blur-lg opacity-20"></div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg shadow-emerald-500/10 border border-white/20 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-semibold mb-1">Completed Trips</p>
                <p className="text-3xl font-black text-gray-900">{previousTrips.length}</p>
                <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mt-2"></div>
              </div>
              <div className="relative">
                <MapPin className="h-12 w-12 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-lg opacity-20"></div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg shadow-amber-500/10 border border-white/20 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 opacity-50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-semibold mb-1">Total Budget</p>
                <p className="text-3xl font-black text-gray-900">
                  ${([...plannedTrips, ...previousTrips].reduce((sum, trip) => sum + (trip.budget || 0), 0)).toLocaleString()}
                </p>
                <div className="w-12 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-2"></div>
              </div>
              <div className="relative">
                <DollarSign className="h-12 w-12 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-amber-500 rounded-full blur-lg opacity-20"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Trips Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-purple-500/10 border border-white/20 p-8">
          {/* Enhanced Tab Navigation */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex space-x-2 bg-gray-100 p-1.5 rounded-xl">
              <button
                onClick={() => setActiveTab('planned')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'planned'
                    ? 'bg-white text-purple-700 shadow-md shadow-purple-500/20 border border-purple-200'
                    : 'text-gray-600 hover:text-purple-700 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Planned Trips ({plannedTrips.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('previous')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'previous'
                    ? 'bg-white text-emerald-700 shadow-md shadow-emerald-500/20 border border-emerald-200'
                    : 'text-gray-600 hover:text-emerald-700 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Previous Trips ({previousTrips.length})
                </div>
              </button>
            </div>
            
            {/* Add trip button */}
            <button 
              onClick={() => router.push('/trips/new')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Calendar className="h-4 w-4" />
              Plan New Trip
            </button>
          </div>

          {/* Enhanced Trip Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'planned' ? (
              plannedTrips.length > 0 ? (
                plannedTrips.map((trip) => (
                  <div key={trip.id} className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                    <div className="relative">
                      <TripCard
                        trip={trip}
                        onView={handleViewTrip}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full blur-3xl opacity-50"></div>
                    </div>
                    <div className="relative">
                      <Calendar className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                      <h4 className="text-2xl font-bold text-gray-900 mb-3">No planned trips yet</h4>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">Your journey awaits! Start planning your next adventure and create unforgettable memories.</p>
                      <button 
                        onClick={() => router.push('/trips/new')}
                        className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                      >
                        Plan Your First Trip
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              previousTrips.length > 0 ? (
                previousTrips.map((trip) => (
                  <div key={trip.id} className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                    <div className="relative">
                      <TripCard
                        trip={trip}
                        onView={handleViewTrip}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full blur-3xl opacity-50"></div>
                    </div>
                    <div className="relative">
                      <MapPin className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                      <h4 className="text-2xl font-bold text-gray-900 mb-3">No previous trips</h4>
                      <p className="text-gray-600 max-w-md mx-auto">Your completed adventures will appear here once you start traveling.</p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => router.push('/trips/new')}
          className="group relative w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
          <Calendar className="h-8 w-8 text-white relative z-10 group-hover:rotate-12 transition-transform duration-300" />
          
          {/* Tooltip */}
          <div className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Plan New Trip
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
          </div>
        </button>
      </div>
    </div>
  );
}
