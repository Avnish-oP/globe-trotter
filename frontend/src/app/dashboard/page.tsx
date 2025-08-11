'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
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
  TrendingUp
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="h-6 w-6" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-600">Ready to plan your next adventure?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <button className="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition-colors">
            <Plus className="h-8 w-8 mb-4" />
            <h3 className="font-semibold text-lg">Plan New Trip</h3>
            <p className="text-blue-100 text-sm">Start a new adventure</p>
          </button>

          <button className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <Search className="h-8 w-8 text-gray-600 mb-4" />
            <h3 className="font-semibold text-lg text-gray-900">Explore Cities</h3>
            <p className="text-gray-500 text-sm">Discover destinations</p>
          </button>

          <button className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <MapPin className="h-8 w-8 text-gray-600 mb-4" />
            <h3 className="font-semibold text-lg text-gray-900">Find Activities</h3>
            <p className="text-gray-500 text-sm">Things to do</p>
          </button>

          <button className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <TrendingUp className="h-8 w-8 text-gray-600 mb-4" />
            <h3 className="font-semibold text-lg text-gray-900">Trip Analytics</h3>
            <p className="text-gray-500 text-sm">View insights</p>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Trips</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <Calendar className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Countries Visited</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <MapPin className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Budget</p>
                <p className="text-3xl font-bold text-gray-900">$0</p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Recent Trips Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Trips</h3>
            <button className="text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          
          <div className="text-center py-12">
            <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No trips yet</h4>
            <p className="text-gray-500 mb-6">Start planning your first adventure!</p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Plan Your First Trip
            </button>
          </div>
        </div>

        {/* User Profile Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Travel Profile</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Travel Style</p>
              <p className="text-gray-900 capitalize">
                {user.travel_style || 'Not specified'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Experience Level</p>
              <p className="text-gray-900 capitalize">
                {user.travel_experience_level || 'Not specified'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Country</p>
              <p className="text-gray-900">
                {user.country_origin || 'Not specified'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Preferred Currency</p>
              <p className="text-gray-900">
                {user.preferred_currency || 'USD'}
              </p>
            </div>
          </div>

          {user.fav_activities && user.fav_activities.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Favorite Activities</p>
              <div className="flex flex-wrap gap-2">
                {user.fav_activities.map((activity, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {activity.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
